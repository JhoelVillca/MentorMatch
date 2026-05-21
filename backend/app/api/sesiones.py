from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_mentee_user_id, get_current_mentor_user_id
from app.models.main_models import (
    ContratoMentoria,
    DisponibilidadMentor,
    PaqueteMentor,
    PerfilMentor,
    PerfilMentee,
    Sesion,
)
from app.schemas.sesion_schema import AgendarSesionRequest, SesionOut, SesionListOut

router = APIRouter(prefix="/sesiones", tags=["Sesiones"])

DAY_MAP = {0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}

@router.post("/agendar", response_model=SesionOut, status_code=status.HTTP_201_CREATED)
async def agendar_sesion(
    req: AgendarSesionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    res_mentee = await db.execute(
        select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id)
    )
    mentee = res_mentee.scalars().first()
    if not mentee:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Perfil de mentee incompleto")

    res_contrato = await db.execute(
        select(ContratoMentoria)
        .filter(
            ContratoMentoria.id_contrato == req.id_contrato,
            ContratoMentoria.id_mentee == mentee.id_mentee,
            ContratoMentoria.estado_contrato == "activo",
        )
        .with_for_update()
    )
    contrato = res_contrato.scalars().first()
    if not contrato:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Contrato no encontrado, no te pertenece, o no esta activo",
        )

    res_paquete = await db.execute(
        select(PaqueteMentor).filter(PaqueteMentor.id_paquete == contrato.id_paquete)
    )
    paquete = res_paquete.scalars().first()
    if not paquete:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Paquete del contrato no encontrado")

    horas_restantes = paquete.cantidad_horas_totales - contrato.horas_consumidas
    duracion_horas = (req.fecha_hora_fin_utc - req.fecha_hora_inicio_utc).total_seconds() / 3600

    if duracion_horas <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La duracion de la sesion debe ser mayor a cero")

    if duracion_horas > horas_restantes:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Horas insuficientes. Disponibles: {horas_restantes:.1f}h, solicitadas: {duracion_horas:.1f}h",
        )

    dia_semana_iso = DAY_MAP.get(req.fecha_hora_inicio_utc.weekday(), req.fecha_hora_inicio_utc.weekday())
    hora_inicio = req.fecha_hora_inicio_utc.time()
    hora_fin = req.fecha_hora_fin_utc.time()

    res_disp = await db.execute(
        select(DisponibilidadMentor)
        .filter(
            DisponibilidadMentor.id_mentor == paquete.id_mentor,
            DisponibilidadMentor.dia_semana == dia_semana_iso,
            DisponibilidadMentor.hora_inicio_utc <= hora_inicio,
            DisponibilidadMentor.hora_fin_utc >= hora_fin,
        )
        .with_for_update()
    )
    disponibilidad = res_disp.scalars().first()
    if not disponibilidad:
        raise HTTPException(status.HTTP_409_CONFLICT, "El mentor no tiene disponibilidad en ese bloque")

    res_colision = await db.execute(
        select(Sesion).filter(
            Sesion.id_contrato.in_(
                select(ContratoMentoria.id_contrato).join(
                    PaqueteMentor,
                    ContratoMentoria.id_paquete == PaqueteMentor.id_paquete,
                ).filter(PaqueteMentor.id_mentor == paquete.id_mentor)
            ),
            Sesion.estado_sesion.not_in(["cancelada", "ausente"]),
            and_(
                Sesion.fecha_hora_inicio_utc < req.fecha_hora_fin_utc,
                Sesion.fecha_hora_fin_utc > req.fecha_hora_inicio_utc,
            ),
        ).with_for_update()
    )
    if res_colision.scalars().first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Double-booking detectado")

    nueva_sesion = Sesion(
        id_contrato=contrato.id_contrato,
        fecha_hora_inicio_utc=req.fecha_hora_inicio_utc,
        fecha_hora_fin_utc=req.fecha_hora_fin_utc,
        estado_sesion="programada",
    )
    db.add(nueva_sesion)
    contrato.horas_consumidas = contrato.horas_consumidas + int(duracion_horas)

    await db.commit()
    await db.refresh(nueva_sesion)
    return nueva_sesion

@router.get("/mentee/me", response_model=list[SesionListOut])
async def listar_sesiones_mentee(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    res_mentee = await db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
    mentee = res_mentee.scalars().first()
    if not mentee:
        return []

    query = (
        select(
            Sesion.id_sesion,
            Sesion.fecha_hora_inicio_utc,
            Sesion.fecha_hora_fin_utc,
            Sesion.estado_sesion,
            Sesion.url_videollamada,
            PaqueteMentor.titulo_paquete,
            PerfilMentor.nombre_completo.label("contraparte_nombre")
        )
        .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
        .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
        .join(PerfilMentor, PaqueteMentor.id_mentor == PerfilMentor.id_mentor)
        .filter(ContratoMentoria.id_mentee == mentee.id_mentee)
        .order_by(Sesion.fecha_hora_inicio_utc.asc())
    )
    res = await db.execute(query)
    return res.all()

@router.get("/mentor/me", response_model=list[SesionListOut])
async def listar_sesiones_mentor(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    res_mentor = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
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
            PerfilMentee.nombre_completo.label("contraparte_nombre")
        )
        .join(ContratoMentoria, Sesion.id_contrato == ContratoMentoria.id_contrato)
        .join(PaqueteMentor, ContratoMentoria.id_paquete == PaqueteMentor.id_paquete)
        .join(PerfilMentee, ContratoMentoria.id_mentee == PerfilMentee.id_mentee)
        .filter(PaqueteMentor.id_mentor == mentor.id_mentor)
        .order_by(Sesion.fecha_hora_inicio_utc.asc())
    )
    res = await db.execute(query)
    return res.all()