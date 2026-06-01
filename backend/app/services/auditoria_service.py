from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.main_models import AuditoriaAdministrativa


class AuditoriaService:
    @staticmethod
    def registrar_evento(
        db: AsyncSession,
        id_usuario,
        entidad_afectada: str,
        id_entidad,
        accion: str,
        detalles_cambio: dict,
    ):
        nueva_auditoria = AuditoriaAdministrativa(
            id_usuario=id_usuario,
            entidad_afectada=entidad_afectada,
            id_entidad=str(id_entidad),
            accion=accion,
            detalles_cambio=detalles_cambio,
            fecha_creacion=datetime.now(timezone.utc),
        )
        db.add(nueva_auditoria)
        return nueva_auditoria