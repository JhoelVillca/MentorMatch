from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.main_models import ContratoMentoria, ResenaMentor, PerfilMentee
from app.schemas.resena_schema import ResenaCreate
import logging

logger = logging.getLogger(__name__)

class ResenaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def crear_resena(self, user_id: UUID, id_contrato: UUID, data: ResenaCreate) -> ResenaMentor:
        res_mentee = await self.db.execute(select(PerfilMentee.id_mentee).filter(PerfilMentee.id_usuario == user_id))
        id_mentee = res_mentee.scalar_one_or_none()
        if not id_mentee:
            raise PermissionError("Perfil de mentee incompleto.")

        res_contrato = await self.db.execute(select(ContratoMentoria).filter(ContratoMentoria.id_contrato == id_contrato))
        contrato = res_contrato.scalars().first()

        if not contrato:
            raise LookupError("Contrato no encontrado.")
        if contrato.id_mentee != id_mentee:
            raise PermissionError("No puedes resenar un contrato que no te pertenece.")
        if contrato.estado_contrato not in ["activo", "completado"]:
            raise ValueError("Solo se pueden resenar contratos en curso o completados.")

        # Validacion logica inicial
        res_existente = await self.db.execute(select(ResenaMentor).filter(ResenaMentor.id_contrato == id_contrato))
        if res_existente.scalars().first():
            raise FileExistsError("Ya existe una resena para este contrato.")

        nueva_resena = ResenaMentor(
            id_contrato=id_contrato,
            calificacion_estrellas=data.calificacion_estrellas,
            comentario_texto=data.comentario_texto
        )
        self.db.add(nueva_resena)
        
        try:
            await self.db.commit()
            await self.db.refresh(nueva_resena)
            return nueva_resena
        except IntegrityError:
            # Blindaje contra concurrencia (double-click del usuario)
            await self.db.rollback()
            logger.warning(f"Intento de resena duplicada bloqueado por BD para contrato {id_contrato}")
            raise FileExistsError("Ya existe una resena para este contrato.")
        except Exception as e:
            await self.db.rollback()
            raise RuntimeError(f"Error interno al guardar la resena: {str(e)}")

    async def reportar_resena(self, id_resena: UUID) -> ResenaMentor:
        res = await self.db.execute(select(ResenaMentor).filter(ResenaMentor.id_resena == id_resena))
        resena = res.scalars().first()
        if not resena:
            raise LookupError("Resena no encontrada.")
        
        resena.reportada = True
        await self.db.commit()
        await self.db.refresh(resena)
        return resena
