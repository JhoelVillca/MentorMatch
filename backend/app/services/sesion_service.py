import math
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.daily_client import crear_meeting_token, crear_sala_video
from app.models.main_models import (
    ContratoMentoria,
    DisponibilidadMentor,
    PaqueteMentor,
    PerfilMentee,
    PerfilMentor,
    Sesion,
)
from app.repositories.user_repository import get_user_role_name
from app.schemas.sesion_schema import AgendarSesionRequest


class SesionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _verificar_horas_restantes(
        self, paquete: PaqueteMentor, contrato: ContratoMentoria, duracion_horas: float
    ):
        if duracion_horas <= 0:
            raise ValueError("La duracion de la sesion debe ser mayor a cero.")
        horas_restantes = paquete.cantidad_horas_totales - contrato.horas_consumidas
        if duracion_horas > horas_restantes:
            raise ValueError(
                f"Horas insuficientes. Disponibles: {horas_restantes:.1f}h, "
                f"solicitadas: {duracion_horas:.1f}h."
            )

    async def _verificar_colision_horarios(
        self, id_mentor: UUID, inicio: datetime, fin: datetime
    ):
        inicio_utc = inicio.astimezone(timezone.utc) if inicio.tzinfo else inicio.replace(tzinfo=timezone.utc)
        fin_utc = fin.astimezone(timezone.utc) if fin.tzinfo else fin.replace(tzinfo=timezone.utc)

        dia_semana_iso = inicio_utc.weekday() + 1
        hora_inicio = inicio_utc.time()
        hora_fin = fin_utc.time()

        res_disp = await self.db.execute(
            select(DisponibilidadMentor).filter(
                DisponibilidadMentor.id_mentor == id_mentor,
                DisponibilidadMentor.dia_semana == dia_semana_iso,
                DisponibilidadMentor.hora_inicio_utc <= hora_inicio,
                DisponibilidadMentor.hora_fin_utc >= hora_fin,
            )
        )
        if not res_disp.scalars().first():
            raise LookupError(
                f"El horario {hora_inicio} - {hora_fin} excede la disponibilidad "
                f"del mentor para el dia {dia_semana_iso}."
            )

        query_colision = (
            select(Sesion)
            .filter(
                Sesion.id_contrato.in_(
                    select(ContratoMentoria.id_contrato)
                    .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
                    .filter(PaqueteMentor.id_mentor == id_mentor)
                ),
                Sesion.estado_sesion.not_in(["cancelada", "ausente"]),
                Sesion.fecha_hora_inicio_utc < fin_utc,
                Sesion.fecha_hora_fin_utc > inicio_utc,
            )
            .with_for_update()
        )
        res_colision = await self.db.execute(query_colision)
        if res_colision.scalars().first():
            raise FileExistsError(
                "Double-booking interceptado: el mentor ya tiene una sesion en ese horario."
            )

    async def agendar_sesion(self, user_id: UUID, req: AgendarSesionRequest) -> Sesion:
        try:
            mentee = await self._get_mentee_or_raise(user_id)

            contrato = await self._get_contrato_activo_or_raise(req.id_contrato, mentee.id_mentee)

            res_paquete = await self.db.execute(
                select(PaqueteMentor).filter(PaqueteMentor.id_paquete == contrato.id_paquete)
            )
            paquete = res_paquete.scalars().first()

            duracion_horas = (
                req.fecha_hora_fin_utc - req.fecha_hora_inicio_utc
            ).total_seconds() / 3600

            self._verificar_horas_restantes(paquete, contrato, duracion_horas)
            await self._verificar_colision_horarios(
                paquete.id_mentor, req.fecha_hora_inicio_utc, req.fecha_hora_fin_utc
            )

            url_sala = await crear_sala_video(req.fecha_hora_fin_utc)
            if not url_sala:
                raise RuntimeError("No se pudo crear la sala de video.")

            nueva_sesion = Sesion(
                id_contrato=contrato.id_contrato,
                fecha_hora_inicio_utc=req.fecha_hora_inicio_utc,
                fecha_hora_fin_utc=req.fecha_hora_fin_utc,
                estado_sesion="programada",
                url_videollamada=url_sala,
            )
            self.db.add(nueva_sesion)

            await self.db.commit()
            await self.db.refresh(nueva_sesion)
            return nueva_sesion

        except Exception:
            await self.db.rollback()
            raise

    async def cambiar_estado_sesion(
        self, user_id: UUID, id_sesion: UUID, nuevo_estado: str
    ) -> Sesion:
        query = (
            select(Sesion, ContratoMentoria, PaqueteMentor)
            .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .filter(Sesion.id_sesion == id_sesion)
            .with_for_update()
        )
        res = await self.db.execute(query)
        row = res.first()

        if not row:
            raise LookupError("Sesion no encontrada.")

        sesion, contrato, paquete = row

        mentee_id = await self._get_mentee_id(user_id)
        mentor_id = await self._get_mentor_id(user_id)

        es_participante = (
            contrato.id_mentee == mentee_id or paquete.id_mentor == mentor_id
        )
        if not es_participante:
            raise PermissionError("No tienes acceso a esta sesion.")

        if nuevo_estado == "en_curso" and sesion.estado_sesion == "programada":
            sesion.estado_sesion = "en_curso"

        elif nuevo_estado == "finalizada" and sesion.estado_sesion == "en_curso":
            sesion.estado_sesion = "finalizada"
            duracion_horas = (
                sesion.fecha_hora_fin_utc - sesion.fecha_hora_inicio_utc
            ).total_seconds() / 3600
            contrato.horas_consumidas += math.ceil(duracion_horas)

        else:
            raise ValueError(
                f"Transicion de estado invalida: {sesion.estado_sesion} -> {nuevo_estado}"
            )

        await self.db.commit()
        await self.db.refresh(sesion)
        return sesion

    async def obtener_sesion_por_id(
        self, user_id: UUID, id_sesion: UUID
    ) -> dict:
        query = (
            select(Sesion, ContratoMentoria, PaqueteMentor, PerfilMentor, PerfilMentee)
            .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
            .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
            .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
            .join(PerfilMentee, ContratoMentoria.id_mentee == PerfilMentee.id_mentee)
            .filter(Sesion.id_sesion == id_sesion)
        )
        res = await self.db.execute(query)
        row = res.first()
        if not row:
            raise LookupError("Sesion no encontrada.")

        sesion, contrato, paquete, mentor, mentee = row

        # --- Verificacion de permisos + determinar identidad ---
        role = await get_user_role_name(self.db, str(user_id))
        mentee_id = await self._get_mentee_id(user_id)
        mentor_id = await self._get_mentor_id(user_id)

        es_mentor = paquete.id_mentor == mentor_id
        es_mentee = contrato.id_mentee == mentee_id

        if role != "admin" and not es_mentor and not es_mentee:
            raise PermissionError("No tienes acceso a esta sesion.")

        # --- Generar meeting token personalizado si la sesion esta activa ---
        url_para_participante = sesion.url_videollamada

        if sesion.url_videollamada and sesion.estado_sesion in ("programada", "en_curso"):
            try:
                # Extraer el nombre de la sala de la URL (ultima parte del path)
                room_name = sesion.url_videollamada.rstrip("/").split("/")[-1]
                nombre_participante = mentor.nombre_completo if es_mentor else mentee.nombre_completo

                token = await crear_meeting_token(
                    room_name=room_name,
                    user_name=nombre_participante,
                    expiracion_dt=sesion.fecha_hora_fin_utc,
                    is_owner=es_mentor,
                )
                # URL con token: Daily.co salta el prejoin y usa el nombre del token
                url_para_participante = f"{sesion.url_videollamada}?t={token}"
            except Exception:
                # Si falla la generacion de token, usar URL base (mostrara prejoin)
                pass

        return {
            "id_sesion": sesion.id_sesion,
            "id_contrato": contrato.id_contrato,
            "fecha_hora_inicio_utc": sesion.fecha_hora_inicio_utc,
            "fecha_hora_fin_utc": sesion.fecha_hora_fin_utc,
            "estado_sesion": sesion.estado_sesion,
            "url_videollamada": url_para_participante,
            "titulo_paquete": paquete.titulo_paquete,
            "mentor_nombre": mentor.nombre_completo,
            "mentee_nombre": mentee.nombre_completo,
        }

    async def listar_sesiones_mentee(self, user_id: UUID):
        mentee = await self._get_mentee_or_raise(user_id)

        query = (
            select(
                Sesion.id_sesion,
                Sesion.fecha_hora_inicio_utc,
                Sesion.fecha_hora_fin_utc,
                Sesion.estado_sesion,
                Sesion.url_videollamada,
                PaqueteMentor.titulo_paquete,
                PerfilMentor.nombre_completo.label("contraparte_nombre"),
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
        res_mentor = await self.db.execute(
            select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id)
        )
        mentor = res_mentor.scalars().first()
        if not mentor:
            return []

        query = (
            select(
                Sesion.id_sesion,
                Sesion.fecha_hora_inicio_utc,
                Sesion.fecha_hora_fin_utc,
                Sesion.estado_sesion,
                Sesion.url_videollamada,
                PaqueteMentor.titulo_paquete,
                PerfilMentee.nombre_completo.label("contraparte_nombre"),
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

    async def _get_mentee_or_raise(self, user_id: UUID) -> PerfilMentee:
        res = await self.db.execute(
            select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id)
        )
        mentee = res.scalars().first()
        if not mentee:
            raise PermissionError("Perfil de mentee incompleto.")
        return mentee

    async def _get_contrato_activo_or_raise(
        self, id_contrato: UUID, id_mentee: UUID
    ) -> ContratoMentoria:
        res = await self.db.execute(
            select(ContratoMentoria)
            .filter(
                ContratoMentoria.id_contrato == id_contrato,
                ContratoMentoria.id_mentee == id_mentee,
                ContratoMentoria.estado_contrato == "activo",
            )
            .with_for_update()
        )
        contrato = res.scalars().first()
        if not contrato:
            raise LookupError("Contrato no valido, inactivo o bloqueado.")
        return contrato

    async def _get_mentee_id(self, user_id: UUID) -> UUID | None:
        res = await self.db.execute(
            select(PerfilMentee.id_mentee).filter(PerfilMentee.id_usuario == user_id)
        )
        return res.scalar_one_or_none()

    async def _get_mentor_id(self, user_id: UUID) -> UUID | None:
        res = await self.db.execute(
            select(PerfilMentor.id_mentor).filter(PerfilMentor.id_usuario == user_id)
        )
        return res.scalar_one_or_none()