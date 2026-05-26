from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from datetime import datetime, timezone, timedelta
import math

from app.models.main_models import (
    ContratoMentoria,
    DisponibilidadMentor,
    PaqueteMentor,
    PerfilMentor,
    PerfilMentee,
    Sesion,
)
from app.schemas.sesion_schema import AgendarSesionRequest

class SesionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _verificar_horas_restantes(self, paquete: PaqueteMentor, contrato: ContratoMentoria, duracion_horas: float):
        horas_restantes = paquete.cantidad_horas_totales - contrato.horas_consumidas
        if duracion_horas <= 0:
            raise ValueError("La duracion de la sesion debe ser mayor a cero.")
        if duracion_horas > horas_restantes:
            raise ValueError(f"Horas insuficientes. Disponibles: {horas_restantes:.1f}h, solicitadas: {duracion_horas:.1f}h.")

    async def _verificar_colision_horarios(self, id_mentor: UUID, inicio: datetime, fin: datetime):
        # Blindaje UTC: forzamos a que el objeto datetime sea consciente de su zona horaria
        inicio_utc = inicio.astimezone(timezone.utc) if inicio.tzinfo else inicio.replace(tzinfo=timezone.utc)
        fin_utc = fin.astimezone(timezone.utc) if fin.tzinfo else fin.replace(tzinfo=timezone.utc)

        # En Python weekday() es 0=Lunes, 6=Domingo. En nuestra DB dia_semana es 1=Lunes, 7=Domingo.
        dia_semana_iso = inicio_utc.weekday() + 1
        hora_inicio = inicio_utc.time()
        hora_fin = fin_utc.time()

        res_disp = await self.db.execute(
            select(DisponibilidadMentor)
            .filter(
                DisponibilidadMentor.id_mentor == id_mentor,
                DisponibilidadMentor.dia_semana == dia_semana_iso,
                DisponibilidadMentor.hora_inicio_utc <= hora_inicio,
                DisponibilidadMentor.hora_fin_utc >= hora_fin,
            )
        )
        if not res_disp.scalars().first():
            raise LookupError(f"El horario {hora_inicio} a {hora_fin} excede la disponibilidad del mentor para el dia {dia_semana_iso}.")

        # Bloqueo Pesimista (El guardia de seguridad anti double-booking)
        query_colision = select(Sesion).filter(
            Sesion.id_contrato.in_(
                select(ContratoMentoria.id_contrato).join(
                    PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete
                ).filter(PaqueteMentor.id_mentor == id_mentor)
            ),
            Sesion.estado_sesion.not_in(["cancelada", "ausente"]),
            Sesion.fecha_hora_inicio_utc < fin_utc,
            Sesion.fecha_hora_fin_utc > inicio_utc,
        ).with_for_update()

        res_colision = await self.db.execute(query_colision)
        if res_colision.scalars().first():
            raise FileExistsError("Double-booking interceptado: El mentor ya tiene una sesion en ese horario.")

    async def agendar_sesion(self, user_id: UUID, req: AgendarSesionRequest):
        try:
            res_mentee = await self.db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
            mentee = res_mentee.scalars().first()
            if not mentee: raise PermissionError("Perfil de mentee incompleto.")

            res_contrato = await self.db.execute(
                select(ContratoMentoria).filter(
                    ContratoMentoria.id_contrato == req.id_contrato,
                    ContratoMentoria.id_mentee == mentee.id_mentee,
                    ContratoMentoria.estado_contrato == "activo",
                ).with_for_update()
            )
            contrato = res_contrato.scalars().first()
            if not contrato: raise LookupError("Contrato no valido, inactivo o bloqueado.")

            res_paquete = await self.db.execute(select(PaqueteMentor).filter(PaqueteMentor.id_paquete == contrato.id_paquete))
            paquete = res_paquete.scalars().first()

            duracion_horas = (req.fecha_hora_fin_utc - req.fecha_hora_inicio_utc).total_seconds() / 3600
            self._verificar_horas_restantes(paquete, contrato, duracion_horas)
            
            await self._verificar_colision_horarios(paquete.id_mentor, req.fecha_hora_inicio_utc, req.fecha_hora_fin_utc)

            nueva_sesion = Sesion(
                id_contrato=contrato.id_contrato,
                fecha_hora_inicio_utc=req.fecha_hora_inicio_utc,
                fecha_hora_fin_utc=req.fecha_hora_fin_utc,
                estado_sesion="programada",
            )
            self.db.add(nueva_sesion)
            contrato.horas_consumidas += math.ceil(duracion_horas)
            
            await self.db.commit()
            await self.db.refresh(nueva_sesion)
            return nueva_sesion
        except Exception:
            await self.db.rollback()
            raise

    async def listar_sesiones_mentee(self, user_id: UUID):
        res_mentee = await self.db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
        mentee = res_mentee.scalars().first()
        if not mentee: return []

        query = (
            select(
                Sesion.id_sesion, Sesion.fecha_hora_inicio_utc, Sesion.fecha_hora_fin_utc,
                Sesion.estado_sesion, Sesion.url_videollamada, PaqueteMentor.titulo_paquete,
                PerfilMentor.nombre_completo.label("contraparte_nombre")
            )
            .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .filter(ContratoMentoria.id_mentee == mentee.id_mentee)
            .order_by(Sesion.fecha_hora_inicio_utc.asc())
        )
        res = await self.db.execute(query)
        return res.all()

    async def listar_sesiones_mentor(self, user_id: UUID):
        res_mentor = await self.db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
        mentor = res_mentor.scalars().first()
        if not mentor: return []

        query = (
            select(
                Sesion.id_sesion, Sesion.fecha_hora_inicio_utc, Sesion.fecha_hora_fin_utc,
                Sesion.estado_sesion, Sesion.url_videollamada, PaqueteMentor.titulo_paquete,
                PerfilMentee.nombre_completo.label("contraparte_nombre")
            )
            .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .join(PerfilMentee, ContratoMentoria.id_mentee == PerfilMentee.id_mentee)
            .filter(PaqueteMentor.id_mentor == mentor.id_mentor)
            .order_by(Sesion.fecha_hora_inicio_utc.asc())
        )
        res = await self.db.execute(query)
        return res.all()

    async def listar_sesiones_ocupadas_mentor(self, id_mentor: UUID):
        """Retorna sesiones programadas del mentor en los próximos 14 días (público)."""
        ahora = datetime.now(timezone.utc)
        limite = ahora + timedelta(days=14)

        query = (
            select(
                Sesion.fecha_hora_inicio_utc,
                Sesion.fecha_hora_fin_utc,
            )
            .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .filter(
                PaqueteMentor.id_mentor == id_mentor,
                Sesion.estado_sesion.not_in(["cancelada", "ausente"]),
                Sesion.fecha_hora_inicio_utc >= ahora,
                Sesion.fecha_hora_inicio_utc <= limite,
            )
            .order_by(Sesion.fecha_hora_inicio_utc.asc())
        )
        res = await self.db.execute(query)
        return res.all()