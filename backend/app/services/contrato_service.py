import os
import logging
import asyncio
import stripe
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.main_models import PaqueteMentor, ContratoMentoria, TransaccionPago, PerfilMentor, PerfilMentee, ResenaMentor
from app.services.auditoria_service import AuditoriaService

logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://localhost:5173"


def _stripe() -> stripe.StripeClient:
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY no configurada")
    return stripe.StripeClient(key)


class ContratoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def adquirir_contrato(self, user_id: UUID, id_paquete: UUID):
        try:
            res_mentee = await self.db.execute(
                select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id)
            )
            mentee = res_mentee.scalars().first()
            if not mentee:
                raise PermissionError("Perfil de mentee incompleto")

            res_paq = await self.db.execute(
                select(PaqueteMentor, PerfilMentor)
                .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
                .filter(PaqueteMentor.id_paquete == id_paquete)
                .with_for_update()
            )
            row = res_paq.first()
            if not row:
                raise LookupError("Paquete no encontrado")

            paquete, mentor = row

            if not paquete.estado_activo or mentor.estado_verificacion != "verificado":
                raise ValueError("El paquete no esta disponible para compra")

            # Busqueda A: Verificar si existe un contrato activo
            res_activo = await self.db.execute(
                select(ContratoMentoria).filter(
                    ContratoMentoria.id_mentee == mentee.id_mentee,
                    ContratoMentoria.id_paquete == paquete.id_paquete,
                    ContratoMentoria.estado_contrato == "activo",
                )
            )
            if res_activo.scalars().first():
                raise FileExistsError("Ya tienes un contrato activo para este paquete")

            # Busqueda B: Verificar si existe un contrato pendiente de pago
            res_pendiente = await self.db.execute(
                select(ContratoMentoria).filter(
                    ContratoMentoria.id_mentee == mentee.id_mentee,
                    ContratoMentoria.id_paquete == paquete.id_paquete,
                    ContratoMentoria.estado_contrato == "pendiente_pago",
                )
            )
            contrato_existente = res_pendiente.scalars().first()

            if contrato_existente:
                contrato_id_utilizado = contrato_existente.id_contrato
                
                # Cancelar transacciones previas en estado procesando para evitar doble cobro
                res_trx_previas = await self.db.execute(
                    select(TransaccionPago)
                    .filter(
                        TransaccionPago.id_contrato == contrato_id_utilizado,
                        TransaccionPago.estado_pago == "procesando"
                    )
                    .with_for_update()
                )
                for trx_previa in res_trx_previas.scalars().all():
                    trx_previa.estado_pago = "fallido"
                
                # Crear nueva transaccion de pago
                nueva_trx = TransaccionPago(
                    id_contrato=contrato_id_utilizado,
                    monto_pagado=paquete.precio_total,
                    moneda="USD",
                    estado_pago="procesando",
                )
                self.db.add(nueva_trx)
                await self.db.flush()
                
                contrato_para_refresh = contrato_existente
            else:
                # Flujo normal de creacion desde cero
                nuevo_contrato = ContratoMentoria(
                    id_mentee=mentee.id_mentee,
                    id_paquete=paquete.id_paquete,
                    estado_contrato="pendiente_pago",
                    horas_consumidas=0,
                )
                self.db.add(nuevo_contrato)
                await self.db.flush()
                
                contrato_id_utilizado = nuevo_contrato.id_contrato
                
                nueva_trx = TransaccionPago(
                    id_contrato=contrato_id_utilizado,
                    monto_pagado=paquete.precio_total,
                    moneda="USD",
                    estado_pago="procesando",
                )
                self.db.add(nueva_trx)
                await self.db.flush()
                
                contrato_para_refresh = nuevo_contrato

            precio_centavos = int(paquete.precio_total * 100)
            contrato_id = str(contrato_id_utilizado)
            trx_id = str(nueva_trx.id_transaccion)
            titulo = paquete.titulo_paquete
            nombre_mentor = mentor.nombre_completo

            def _crear_checkout():
                return _stripe().v1.checkout.sessions.create(
                    params={
                        "payment_method_types": ["card"],
                        "line_items": [
                            {
                                "price_data": {
                                    "currency": "usd",
                                    "unit_amount": precio_centavos,
                                    "product_data": {
                                        "name": f"Mentoria: {titulo}",
                                        "description": f"Mentor: {nombre_mentor}",
                                    },
                                },
                                "quantity": 1,
                            }
                        ],
                        "mode": "payment",
                        "success_url": f"{FRONTEND_URL}/mentee/contratos?success=true",
                        "cancel_url": f"{FRONTEND_URL}/mentee/marketplace?canceled=true",
                        "metadata": {
                            "id_contrato": contrato_id,
                            "id_transaccion": trx_id,
                        },
                    }
                )

            checkout_session = await asyncio.to_thread(_crear_checkout)

            await self.db.commit()
            await self.db.refresh(contrato_para_refresh)

            logger.info(
                "Checkout creado — contrato=%s session=%s", contrato_id, checkout_session.id
            )

            return {"url_pago": checkout_session.url}

        except Exception:
            await self.db.rollback()
            raise

    async def listar_mis_contratos(self, user_id: UUID):
        res_mentee = await self.db.execute(
            select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id)
        )
        mentee = res_mentee.scalars().first()

        if not mentee:
            return []

        query = (
            select(
                ContratoMentoria, 
                PaqueteMentor.titulo_paquete, 
                PaqueteMentor.id_mentor,
                ResenaMentor.id_resena
            )
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .outerjoin(ResenaMentor, ContratoMentoria.id_contrato == ResenaMentor.id_contrato)
            .filter(ContratoMentoria.id_mentee == mentee.id_mentee)
        )
        res = await self.db.execute(query)

        return [
            {
                "id_contrato": c.ContratoMentoria.id_contrato,
                "id_mentor": c.id_mentor,
                "estado": c.ContratoMentoria.estado_contrato,
                "horas_consumidas": c.ContratoMentoria.horas_consumidas,
                "fecha": c.ContratoMentoria.fecha_adquisicion,
                "paquete": c.titulo_paquete,
                "ya_resenado": c.id_resena is not None,
            for c in res.all()
        ]

    async def aplicar_beca(self, user_id: UUID, id_paquete: UUID, carta_motivacion: str):
        res_mentee = await self.db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
        mentee = res_mentee.scalars().first()
        if not mentee:
            raise PermissionError("Perfil de mentee incompleto")

        res_paq = await self.db.execute(
            select(PaqueteMentor, PerfilMentor)
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .filter(PaqueteMentor.id_paquete == id_paquete)
        )
        row = res_paq.first()
        if not row:
            raise LookupError("Paquete no encontrado")
        
        paquete, mentor = row

        if not paquete.estado_activo or mentor.estado_verificacion != "verificado":
            raise ValueError("El paquete no esta disponible")

        res_existente = await self.db.execute(
            select(ContratoMentoria).filter(
                ContratoMentoria.id_mentee == mentee.id_mentee,
                ContratoMentoria.id_paquete == paquete.id_paquete,
                ContratoMentoria.estado_contrato.in_(["activo", "pendiente_pago", "pendiente_aprobacion"])
            )
        )
        if res_existente.scalars().first():
            raise FileExistsError("Ya tienes un proceso activo o pendiente para este paquete")

        nuevo_contrato = ContratoMentoria(
            id_mentee=mentee.id_mentee,
            id_paquete=paquete.id_paquete,
            estado_contrato="pendiente_aprobacion",
            carta_motivacion=carta_motivacion,
            horas_consumidas=0
        )
        self.db.add(nuevo_contrato)
        await self.db.commit()
        await self.db.refresh(nuevo_contrato)
        
        return {"mensaje": "Solicitud de beca encolada", "id_contrato": nuevo_contrato.id_contrato}

    async def listar_solicitudes_mentor(self, user_id: UUID):
        res_mentor = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res_mentor.scalars().first()
        if not mentor:
            return []

        query = (
            select(ContratoMentoria, PerfilMentee.nombre_completo, PaqueteMentor.titulo_paquete)
            .join(PerfilMentee, ContratoMentoria.id_mentee == PerfilMentee.id_mentee)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .filter(
                PaqueteMentor.id_mentor == mentor.id_mentor,
                ContratoMentoria.estado_contrato == "pendiente_aprobacion"
            )
        )
        res = await self.db.execute(query)
        
        return [
            {
                "id_contrato": c.ContratoMentoria.id_contrato,
                "mentee_nombre": c.nombre_completo,
                "paquete_titulo": c.titulo_paquete,
                "carta_motivacion": c.ContratoMentoria.carta_motivacion,
                "fecha_solicitud": c.ContratoMentoria.fecha_adquisicion
            }
            for c in res.all()
        ]

    async def responder_solicitud_beca(self, user_id: UUID, id_contrato: UUID, accion: str):
        query = (
            select(ContratoMentoria, PaqueteMentor, PerfilMentor)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .filter(ContratoMentoria.id_contrato == id_contrato)
            .with_for_update()
        )
        res = await self.db.execute(query)
        row = res.first()
        
        if not row:
            raise LookupError("Solicitud no encontrada")
            
        contrato, paquete, mentor = row

        if str(mentor.id_usuario) != str(user_id):
            raise PermissionError("Brecha de seguridad: Intento de manipular solicitud ajena")
            
        if contrato.estado_contrato != "pendiente_aprobacion":
            raise ValueError("El contrato ya fue procesado o no es una beca")

        estado_anterior = contrato.estado_contrato
        nuevo_estado = "activo" if accion == "aceptar" else "rechazado"
        
        contrato.estado_contrato = nuevo_estado

        AuditoriaService.registrar_evento(
            self.db,
            id_usuario=user_id,
            entidad_afectada="contratos_mentoria",
            id_entidad=str(contrato.id_contrato),
            accion=f"BECA_{accion.upper()}",
            detalles_cambio={
                "estado_anterior": estado_anterior,
                "estado_nuevo": nuevo_estado
            }
        )

        await self.db.commit()
        return {"mensaje": f"Solicitud {accion}da con exito"}