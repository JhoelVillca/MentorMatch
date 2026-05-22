from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from app.models.main_models import PaqueteMentor, PerfilMentor
from app.schemas.paquete_schema import PaqueteCreate

class PaqueteService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar_paquetes_disponibles(self):
        query = (
            select(
                PaqueteMentor.id_paquete,
                PaqueteMentor.id_mentor,
                PaqueteMentor.titulo_paquete,
                PaqueteMentor.cantidad_horas_totales,
                PaqueteMentor.precio_total,
                PerfilMentor.nombre_completo.label("mentor_nombre"),
                PerfilMentor.foto_perfil.label("mentor_foto")
            )
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .filter(
                PaqueteMentor.estado_activo == True,
                PerfilMentor.estado_verificacion == "verificado"
            )
        )
        res = await self.db.execute(query)
        return res.all()

    async def crear_paquete(self, user_id: str, paquete: PaqueteCreate):
        res = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res.scalars().first()
        if not mentor:
            raise PermissionError("Perfil de mentor no encontrado")

        nuevo_paquete = PaqueteMentor(**paquete.dict(), id_mentor=mentor.id_mentor)
        self.db.add(nuevo_paquete)
        await self.db.commit()
        await self.db.refresh(nuevo_paquete)
        return nuevo_paquete

    async def listar_mis_paquetes(self, user_id: str):
        res = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res.scalars().first()
        if not mentor:
            return []

        res2 = await self.db.execute(select(PaqueteMentor).filter(PaqueteMentor.id_mentor == mentor.id_mentor))
        return res2.scalars().all()

    async def cambiar_estado(self, user_id: str, paquete_id: UUID, estado_activo: bool):
        res = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res.scalars().first()

        res2 = await self.db.execute(select(PaqueteMentor).filter(
            PaqueteMentor.id_paquete == paquete_id,
            PaqueteMentor.id_mentor == (mentor.id_mentor if mentor else None)
        ))
        paquete = res2.scalars().first()

        if not paquete:
            raise LookupError("El paquete no existe o no te pertenece")

        paquete.estado_activo = estado_activo
        await self.db.commit()
        await self.db.refresh(paquete)
        return paquete