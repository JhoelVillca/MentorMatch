import os
from uuid import UUID
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.main_models import PaqueteMentor, ContratoMentoria, TransaccionPago, PerfilMentor, PerfilMentee

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://localhost:5173"

class ContratoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def adquirir_contrato(self, user_id: UUID, id_paquete: UUID):
        try:
            res_mentee = await self.db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
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

            if not paquete.estado_activo or mentor.estado_verificacion != 'verificado':
                raise ValueError("El paquete no esta disponible para compra")

            res_dup = await self.db.execute(
                select(ContratoMentoria).filter(
                    ContratoMentoria.id_mentee == mentee.id_mentee,
                    ContratoMentoria.id_paquete == paquete.id_paquete,
                    ContratoMentoria.estado_contrato.in_(['pendiente_pago', 'activo'])
                )
            )
            if res_dup.scalars().first():
                raise FileExistsError("Ya existe un contrato activo o en proceso para este paquete")

            nuevo_contrato = ContratoMentoria(
                id_mentee=mentee.id_mentee,
                id_paquete=paquete.id_paquete,
                estado_contrato="pendiente_pago",
                horas_consumidas=0
            )
            self.db.add(nuevo_contrato)
            await self.db.flush()

            nueva_trx = TransaccionPago(
                id_contrato=nuevo_contrato.id_contrato,
                monto_pagado=paquete.precio_total,
                moneda="USD",
                estado_pago="procesando"
            )
            self.db.add(nueva_trx)
            await self.db.flush()

            # Creacion de la sesion en Stripe
            precio_centavos = int(paquete.precio_total * 100)

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': precio_centavos,
                        'product_data': {
                            'name': f"Mentoria: {paquete.titulo_paquete}",
                            'description': f"Mentor: {mentor.nombre_completo}"
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{FRONTEND_URL}/mentee/contratos?success=true",
                cancel_url=f"{FRONTEND_URL}/mentee/marketplace?canceled=true",
                metadata={
                    "id_contrato": str(nuevo_contrato.id_contrato),
                    "id_transaccion": str(nueva_trx.id_transaccion)
                }
            )

            await self.db.commit()

            return {"url_pago": checkout_session.url}

        except Exception:
            await self.db.rollback()
            raise

    async def listar_mis_contratos(self, user_id: UUID):
        res_mentee = await self.db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
        mentee = res_mentee.scalars().first()

        if not mentee:
            return []

        query = (
            select(ContratoMentoria, PaqueteMentor.titulo_paquete)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .filter(ContratoMentoria.id_mentee == mentee.id_mentee)
        )
        res = await self.db.execute(query)

        return [
            {
                "id_contrato": c.ContratoMentoria.id_contrato,
                "estado": c.ContratoMentoria.estado_contrato,
                "horas_consumidas": c.ContratoMentoria.horas_consumidas,
                "fecha": c.ContratoMentoria.fecha_adquisicion,
                "paquete": c.titulo_paquete
            }
            for c in res.all()
        ]