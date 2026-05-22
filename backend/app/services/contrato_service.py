from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.main_models import PaqueteMentor, ContratoMentoria, TransaccionPago, PerfilMentor, PerfilMentee

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

            await self.db.commit()
            await self.db.refresh(nuevo_contrato)

            return {"id_contrato": str(nuevo_contrato.id_contrato), "estado": nuevo_contrato.estado_contrato}

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