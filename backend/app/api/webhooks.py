import os
import logging
import asyncio
import stripe
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.future import select
from uuid import UUID

from app.db.database import AsyncSessionLocal
from app.models.main_models import TransaccionPago, ContratoMentoria

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks Financieros"])

WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


def _stripe() -> stripe.StripeClient:
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY no configurada")
    return stripe.StripeClient(key)


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET no configurada")
        raise HTTPException(status_code=500, detail="Configuracion de webhook incompleta")

    if not sig_header:
        logger.warning("Header stripe-signature faltante")
        raise HTTPException(status_code=400, detail="Firma faltante")

    try:
        event = _stripe().construct_event(payload, sig_header, WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        logger.warning("Firma Stripe invalida — posible request espuria")
        raise HTTPException(status_code=400, detail="Firma invalida")
    except Exception as e:
        logger.error("Error construyendo evento Stripe: %s", e)
        raise HTTPException(status_code=400, detail="Payload corrupto")

    if event.type == "checkout.session.completed":
        await _handle_checkout_completed(event.data.object)
    elif event.type == "checkout.session.expired":
        await _handle_checkout_expired(event.data.object)

    return {"status": "success"}


async def _handle_checkout_completed(session) -> None:
    metadata = getattr(session, "metadata", None) or {}
    id_contrato_str = metadata.get("id_contrato") if isinstance(metadata, dict) else getattr(metadata, "id_contrato", None)
    id_transaccion_str = metadata.get("id_transaccion") if isinstance(metadata, dict) else getattr(metadata, "id_transaccion", None)

    if not id_contrato_str or not id_transaccion_str:
        logger.error(
            "Webhook sin metadata completa — session_id=%s",
            getattr(session, "id", "unknown")
        )
        return

    receipt_url = await asyncio.to_thread(_extract_receipt_url, session)

    async with AsyncSessionLocal() as db:
        try:
            async with db.begin():
                res_trx = await db.execute(
                    select(TransaccionPago)
                    .filter(TransaccionPago.id_transaccion == UUID(id_transaccion_str))
                    .with_for_update()
                )
                trx = res_trx.scalars().first()

                if not trx:
                    logger.error("Transaccion %s no encontrada", id_transaccion_str)
                    return

                if trx.estado_pago != "procesando":
                    logger.warning(
                        "Webhook ignorado porque la transaccion no esta en estado procesando — estado=%s, transaccion=%s",
                        trx.estado_pago,
                        id_transaccion_str
                    )
                    return

                # Validar montos para evitar alteraciones de precios (Price Manipulation)
                monto_stripe_usd = getattr(session, "amount_total", 0) / 100
                if monto_stripe_usd != trx.monto_pagado:
                    logger.error(
                        "Alteracion de precio detectada — transaccion=%s monto_db=%s monto_stripe=%s",
                        id_transaccion_str,
                        trx.monto_pagado,
                        monto_stripe_usd
                    )
                    return

                trx.estado_pago = "completado"
                trx.id_pasarela_externa = session.id
                if receipt_url:
                    trx.url_recibo_externo = receipt_url

                res_cont = await db.execute(
                    select(ContratoMentoria)
                    .filter(ContratoMentoria.id_contrato == UUID(id_contrato_str))
                    .with_for_update()
                )
                contrato = res_cont.scalars().first()

                if not contrato:
                    logger.error("Contrato %s no encontrado", id_contrato_str)
                    return

                contrato.estado_contrato = "activo"
                logger.info(
                    "Contrato %s activado — session=%s", id_contrato_str, session.id
                )

        except Exception as e:
            logger.exception("Error critico procesando webhook: %s", e)
            raise HTTPException(status_code=500, detail="Error en persistencia")


async def _handle_checkout_expired(session) -> None:
    metadata = getattr(session, "metadata", None) or {}
    id_transaccion_str = metadata.get("id_transaccion") if isinstance(metadata, dict) else getattr(metadata, "id_transaccion", None)

    if not id_transaccion_str:
        logger.error(
            "Webhook de expiracion sin metadata completa — session_id=%s",
            getattr(session, "id", "unknown")
        )
        return

    async with AsyncSessionLocal() as db:
        try:
            async with db.begin():
                res_trx = await db.execute(
                    select(TransaccionPago)
                    .filter(TransaccionPago.id_transaccion == UUID(id_transaccion_str))
                    .with_for_update()
                )
                trx = res_trx.scalars().first()

                if not trx:
                    logger.error(
                        "Transaccion %s no encontrada en webhook de expiracion", 
                        id_transaccion_str
                    )
                    return

                if trx.estado_pago == "fallido":
                    logger.info(
                        "Webhook de expiracion duplicado o ya fallido ignorado — transaccion=%s", 
                        id_transaccion_str
                    )
                    return

                trx.estado_pago = "fallido"
                logger.info(
                    "Transaccion %s marcada como fallida por expiracion — session=%s", 
                    id_transaccion_str, 
                    getattr(session, "id", "unknown")
                )

        except Exception as e:
            logger.exception("Error critico procesando webhook de expiracion: %s", e)
            raise HTTPException(status_code=500, detail="Error en persistencia")


def _extract_receipt_url(session) -> str | None:
    payment_intent_id = getattr(session, "payment_intent", None)
    if not payment_intent_id or not isinstance(payment_intent_id, str):
        return None
    try:
        pi = _stripe().v1.payment_intents.retrieve(
            payment_intent_id,
            params={"expand": ["latest_charge"]},
        )
        charge = getattr(pi, "latest_charge", None)
        if charge and not isinstance(charge, str):
            return getattr(charge, "receipt_url", None)
    except Exception as e:
        logger.warning("No se pudo recuperar receipt_url: %s", e)
    return None