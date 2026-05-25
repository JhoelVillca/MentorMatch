import os
import stripe
import traceback
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.future import select
from uuid import UUID

# Importa tu motor de base de datos y la factoria de sesion
from app.db.database import AsyncSessionLocal 
from app.models.main_models import TransaccionPago, ContratoMentoria

router = APIRouter(prefix="/webhooks", tags=["Webhooks Financieros"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Firma invalida o payload corrupto")

    if event.type == "checkout.session.completed":
        session = event.data.object
        metadata = session.metadata
        
        id_contrato_str = metadata.id_contrato if metadata else None
        id_transaccion_str = metadata.id_transaccion if metadata else None

        if id_contrato_str and id_transaccion_str:
            # GESTION MANUAL DE LA SESION
            async with AsyncSessionLocal() as db:
                try:
                    async with db.begin(): # Abrimos transaccion explicita
                        id_contrato_uuid = UUID(id_contrato_str)
                        id_transaccion_uuid = UUID(id_transaccion_str)

                        # Buscar transaccion
                        res_trx = await db.execute(select(TransaccionPago).filter(TransaccionPago.id_transaccion == id_transaccion_uuid))
                        trx = res_trx.scalars().first()

                        if trx and trx.estado_pago != "completado":
                            trx.estado_pago = "completado"
                            trx.id_pasarela_externa = session.id

                            # Buscar contrato
                            res_cont = await db.execute(select(ContratoMentoria).filter(ContratoMentoria.id_contrato == id_contrato_uuid))
                            contrato = res_cont.scalars().first()
                            
                            if contrato:
                                contrato.estado_contrato = "activo"
                                await db.commit()
                                print(f"[SUCCESS] Webhook procesado: Contrato {id_contrato_uuid} activado.")
                            else:
                                print(f"[ERROR] Contrato {id_contrato_uuid} no encontrado en BD.")
                        else:
                            print(f"[WARN] Transaccion ya procesada o no encontrada.")
                
                except Exception as e:
                    await db.rollback()
                    print(f"[ERROR CRITICO] {traceback.format_exc()}")
                    raise HTTPException(status_code=500, detail="Error en persistencia")

    return {"status": "success"}