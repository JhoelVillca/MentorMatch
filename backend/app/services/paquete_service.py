from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func, desc
from uuid import UUID
from app.models.main_models import PaqueteMentor, PerfilMentor, MentorHabilidad, Habilidad, ContratoMentoria, ResenaMentor
from app.schemas.paquete_schema import PaqueteCreate

class PaqueteService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar_paquetes_disponibles(self):
        # Subconsulta para obtener la calificacion promedio por mentor, omitiendo reportes
        subq_promedio = (
            select(
                PaqueteMentor.id_mentor,
                func.round(func.avg(ResenaMentor.calificacion_estrellas), 1).label("promedio")
            )
            .join(ContratoMentoria, PaqueteMentor.id_paquete == ContratoMentoria.id_paquete)
            .join(ResenaMentor, ContratoMentoria.id_contrato == ResenaMentor.id_contrato)
            .filter(ResenaMentor.reportada == False)
            .group_by(PaqueteMentor.id_mentor)
            .subquery()
        )

        query = (
            select(
                PaqueteMentor.id_paquete,
                PaqueteMentor.id_mentor,
                PaqueteMentor.titulo_paquete,
                PaqueteMentor.cantidad_horas_totales,
                PaqueteMentor.precio_total,
                PerfilMentor.nombre_completo.label("mentor_nombre"),
                PerfilMentor.foto_perfil.label("mentor_foto"),
                subq_promedio.c.promedio.label("calificacion_promedio")
            )
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .outerjoin(subq_promedio, PaqueteMentor.id_mentor == subq_promedio.c.id_mentor)
            .filter(
                PaqueteMentor.estado_activo == True,
                PaqueteMentor.estado_validacion == "aprobado",
                PerfilMentor.estado_verificacion == "verificado"
            )
        )
        res = await self.db.execute(query)
        return res.all()

    async def buscar_paquetes(
        self,
        q: str | None = None,
        precio_max: float | None = None,
        id_habilidad: UUID | None = None,
        nivel_dominio: str | None = None,
        sort_by: str | None = None,
    ):
        # Subconsulta para obtener la calificacion promedio por mentor, omitiendo reportes
        subq_promedio = (
            select(
                PaqueteMentor.id_mentor,
                func.round(func.avg(ResenaMentor.calificacion_estrellas), 1).label("promedio")
            )
            .join(ContratoMentoria, PaqueteMentor.id_paquete == ContratoMentoria.id_paquete)
            .join(ResenaMentor, ContratoMentoria.id_contrato == ResenaMentor.id_contrato)
            .filter(ResenaMentor.reportada == False)
            .group_by(PaqueteMentor.id_mentor)
            .subquery()
        )

        # 2. Subconsulta transaccional para Popularidad
        subq_ventas = (
            select(
                ContratoMentoria.id_paquete,
                func.count(ContratoMentoria.id_contrato).label("num_ventas")
            )
            .group_by(ContratoMentoria.id_paquete)
            .subquery()
        )

        query = (
            select(
                PaqueteMentor.id_paquete,
                PaqueteMentor.id_mentor,
                PaqueteMentor.titulo_paquete,
                PaqueteMentor.cantidad_horas_totales,
                PaqueteMentor.precio_total,
                PaqueteMentor.fecha_creacion,
                PerfilMentor.nombre_completo.label("mentor_nombre"),
                PerfilMentor.foto_perfil.label("mentor_foto"),
                subq_promedio.c.promedio.label("calificacion_promedio"),
                Habilidad.validada_por_admin,
                func.coalesce(subq_ventas.c.num_ventas, 0).label("ventas_totales")
            )
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .outerjoin(MentorHabilidad, PaqueteMentor.id_mentor == MentorHabilidad.id_mentor)
            .outerjoin(Habilidad, MentorHabilidad.id_habilidad == Habilidad.id_habilidad)
            .outerjoin(subq_promedio, PaqueteMentor.id_mentor == subq_promedio.c.id_mentor)
            .outerjoin(subq_ventas, PaqueteMentor.id_paquete == subq_ventas.c.id_paquete)
        )

        if id_habilidad:
            query = query.filter(MentorHabilidad.id_habilidad == id_habilidad)

        if nivel_dominio:
            query = query.filter(MentorHabilidad.nivel == nivel_dominio)

        query = query.filter(
            PaqueteMentor.estado_activo == True,
            PaqueteMentor.estado_validacion == "aprobado",
            PerfilMentor.estado_verificacion == "verificado"
        )

        if q:
            query = query.filter(
                or_(
                    PaqueteMentor.titulo_paquete.ilike(f"%{q}%"),
                    PerfilMentor.nombre_completo.ilike(f"%{q}%")
                )
            )

        if precio_max:
            query = query.filter(PaqueteMentor.precio_total <= precio_max)

        # AST Dinamico para el ordenamiento
        if sort_by == "recientes":
            query = query.order_by(PaqueteMentor.fecha_creacion.desc())
        elif sort_by == "calificados":
            query = query.order_by(subq_promedio.c.promedio.desc().nulls_last())
        elif sort_by == "populares":
            query = query.order_by(desc("ventas_totales"))
        else:
            query = query.order_by(Habilidad.validada_por_admin.desc())

        query = query.distinct()

        res = await self.db.execute(query)
        return [dict(row._mapping) for row in res.all()]

    async def crear_paquete(self, user_id: str, paquete: PaqueteCreate):
        res = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res.scalars().first()
        if not mentor:
            raise PermissionError("Perfil de mentor no encontrado")

        nuevo_paquete = PaqueteMentor(**paquete.model_dump(), id_mentor=mentor.id_mentor, estado_validacion="pendiente")
        self.db.add(nuevo_paquete)
        await self.db.commit()
        await self.db.refresh(nuevo_paquete)
        return nuevo_paquete

    async def editar_paquete(self, user_id: str, paquete_id: UUID, datos_nuevos: dict):
        res = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res.scalars().first()

        res2 = await self.db.execute(select(PaqueteMentor).filter(
            PaqueteMentor.id_paquete == paquete_id,
            PaqueteMentor.id_mentor == (mentor.id_mentor if mentor else None)
        ))
        paquete = res2.scalars().first()

        if not paquete:
            raise LookupError("El paquete no existe o no te pertenece")

        cambio_critico = False
        if 'titulo_paquete' in datos_nuevos and datos_nuevos['titulo_paquete']:
            paquete.titulo_paquete = datos_nuevos['titulo_paquete']
            cambio_critico = True
        if 'cantidad_horas_totales' in datos_nuevos and datos_nuevos['cantidad_horas_totales'] is not None:
            paquete.cantidad_horas_totales = datos_nuevos['cantidad_horas_totales']
            cambio_critico = True
        if 'precio_total' in datos_nuevos and datos_nuevos['precio_total'] is not None:
            paquete.precio_total = datos_nuevos['precio_total']
            cambio_critico = True

        if cambio_critico:
            paquete.estado_validacion = "pendiente"

        await self.db.commit()
        await self.db.refresh(paquete)
        return paquete

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