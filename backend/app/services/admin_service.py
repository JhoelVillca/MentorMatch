from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.main_models import PaqueteMentor
from app.services.auditoria_service import AuditoriaService


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def validar_paquete(
        self,
        id_usuario: UUID,
        paquete_id: UUID,
        estado_validacion: str,
    ) -> PaqueteMentor:
        if estado_validacion not in ["aprobado", "rechazado"]:
            raise ValueError("Estado no valido")

        res = await self.db.execute(
            select(PaqueteMentor).filter(PaqueteMentor.id_paquete == paquete_id)
        )
        paquete = res.scalars().first()
        if not paquete:
            raise LookupError("Paquete no encontrado")

        estado_anterior = paquete.estado_validacion
        paquete.estado_validacion = estado_validacion

        AuditoriaService.registrar_evento(
            self.db,
            id_usuario=id_usuario,
            entidad_afectada="paquetes_mentor",
            id_entidad=paquete.id_paquete,
            accion="VALIDACION_PAQUETE",
            detalles_cambio={
                "estado_anterior": estado_anterior,
                "estado_nuevo": estado_validacion,
            },
        )

        await self.db.commit()
        await self.db.refresh(paquete)
        return paquete