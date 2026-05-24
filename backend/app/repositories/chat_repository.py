from uuid import UUID
from datetime import datetime
from typing import Optional
from sqlalchemy import select, or_, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.main_models import SalaChat, MensajeChat, PerfilMentee, PerfilMentor

async def _get_user_profile_ids(db: AsyncSession, user_id: str) -> tuple:
    uid = UUID(user_id)
    mentee_id = (await db.execute(select(PerfilMentee.id_mentee).where(PerfilMentee.id_usuario == uid))).scalar_one_or_none()
    mentor_id = (await db.execute(select(PerfilMentor.id_mentor).where(PerfilMentor.id_usuario == uid))).scalar_one_or_none()
    return mentee_id, mentor_id

async def get_salas_for_user(db: AsyncSession, user_id: str) -> list[dict]:
    mentee_id, mentor_id = await _get_user_profile_ids(db, user_id)
    conditions = []
    if mentee_id: conditions.append(SalaChat.id_mentee == mentee_id)
    if mentor_id: conditions.append(SalaChat.id_mentor == mentor_id)
    if not conditions: return []

    query = (
        select(
            SalaChat.id_sala,
            SalaChat.no_leidos_mentee,
            SalaChat.no_leidos_mentor,
            SalaChat.ultima_actividad,
            PerfilMentee.nombre_completo.label("nombre_mentee"),
            PerfilMentee.foto_perfil.label("foto_mentee"),
            PerfilMentee.id_usuario.label("mentee_user_id"),
            PerfilMentor.nombre_completo.label("nombre_mentor"),
            PerfilMentor.foto_perfil.label("foto_mentor"),
            PerfilMentor.id_usuario.label("mentor_user_id"),
        )
        .join(PerfilMentee, SalaChat.id_mentee == PerfilMentee.id_mentee)
        .join(PerfilMentor, SalaChat.id_mentor == PerfilMentor.id_mentor)
        .where(or_(*conditions))
        .order_by(SalaChat.ultima_actividad.desc())
    )
    rows = (await db.execute(query)).all()

    salas = []
    for row in rows:
        is_mentee = str(row.mentee_user_id) == user_id
        
        msg = (await db.execute(
            select(MensajeChat.contenido_texto, MensajeChat.fecha_envio)
            .where(MensajeChat.id_sala == row.id_sala)
            .order_by(MensajeChat.fecha_envio.desc())
            .limit(1)
        )).first()

        salas.append({
            "id_sala": row.id_sala,
            "contraparte_user_id": str(row.mentor_user_id) if is_mentee else str(row.mentee_user_id),
            "nombre_otro": row.nombre_mentor if is_mentee else row.nombre_mentee,
            "foto_otro": row.foto_mentor if is_mentee else row.foto_mentee,
            "ultimo_mensaje": msg.contenido_texto if msg else None,
            "ultimo_mensaje_fecha": msg.fecha_envio if msg else None,
            "unread_count": row.no_leidos_mentee if is_mentee else row.no_leidos_mentor,
        })
    return salas

async def get_mensajes_paginated(db: AsyncSession, id_sala: UUID, before_dt: Optional[datetime], limit: int) -> dict:
    query = select(MensajeChat).where(MensajeChat.id_sala == id_sala)
    if before_dt: query = query.where(MensajeChat.fecha_envio < before_dt)
    query = query.order_by(MensajeChat.fecha_envio.desc()).limit(limit + 1)
    
    rows = (await db.execute(query)).scalars().all()
    has_more = len(rows) > limit
    mensajes = rows[:limit]

    return {
        "mensajes": [m for m in reversed(mensajes)],
        "has_more": has_more,
    }

async def save_mensaje(db: AsyncSession, id_sala: UUID, id_remitente: UUID, contenido: str, is_mentee: bool) -> MensajeChat:
    mensaje = MensajeChat(id_sala=id_sala, id_remitente=id_remitente, contenido_texto=contenido)
    db.add(mensaje)
    
    counter_update = {"no_leidos_mentor": SalaChat.no_leidos_mentor + 1} if is_mentee else {"no_leidos_mentee": SalaChat.no_leidos_mentee + 1}
    counter_update["ultima_actividad"] = func.now()
    
    await db.execute(update(SalaChat).where(SalaChat.id_sala == id_sala).values(**counter_update))
    await db.commit()
    await db.refresh(mensaje)
    return mensaje

async def mark_as_read(db: AsyncSession, id_sala: UUID, is_mentee: bool) -> None:
    field = {"no_leidos_mentee": 0} if is_mentee else {"no_leidos_mentor": 0}
    await db.execute(update(SalaChat).where(SalaChat.id_sala == id_sala).values(**field))
    await db.commit()

async def verify_sala_participant(db: AsyncSession, id_sala: UUID, id_usuario: UUID) -> dict:
    row = (await db.execute(
        select(PerfilMentee.id_usuario.label("mentee"), PerfilMentor.id_usuario.label("mentor"))
        .select_from(SalaChat)
        .join(PerfilMentee, SalaChat.id_mentee == PerfilMentee.id_mentee)
        .join(PerfilMentor, SalaChat.id_mentor == PerfilMentor.id_mentor)
        .where(SalaChat.id_sala == id_sala)
    )).first()
    
    if not row: return None
    is_mentee = str(row.mentee) == str(id_usuario)
    is_mentor = str(row.mentor) == str(id_usuario)
    
    if not (is_mentee or is_mentor): return None
    return {
        "is_mentee": is_mentee,
        "receiver_id": str(row.mentor) if is_mentee else str(row.mentee)
    }
    
async def get_or_create_sala(db: AsyncSession, id_mentee: UUID, id_mentor: UUID) -> str:
    query = select(SalaChat.id_sala).where(
        SalaChat.id_mentee == id_mentee,
        SalaChat.id_mentor == id_mentor
    )
    sala_id = (await db.execute(query)).scalar_one_or_none()
    
    if sala_id:
        return str(sala_id)
        
    nueva_sala = SalaChat(id_mentee=id_mentee, id_mentor=id_mentor)
    db.add(nueva_sala)
    await db.commit()
    await db.refresh(nueva_sala)
    return str(nueva_sala.id_sala)


async def get_contact_user_ids(db: AsyncSession, user_id: str) -> list[str]:
    mentee_id, mentor_id = await _get_user_profile_ids(db, user_id)
    contact_ids = []

    if mentee_id:
        rows = (await db.execute(
            select(PerfilMentor.id_usuario)
            .join(SalaChat, SalaChat.id_mentor == PerfilMentor.id_mentor)
            .where(SalaChat.id_mentee == mentee_id)
        )).scalars().all()
        contact_ids.extend([str(r) for r in rows])

    if mentor_id:
        rows = (await db.execute(
            select(PerfilMentee.id_usuario)
            .join(SalaChat, SalaChat.id_mentee == PerfilMentee.id_mentee)
            .where(SalaChat.id_mentor == mentor_id)
        )).scalars().all()
        contact_ids.extend([str(r) for r in rows])

    return list(set(contact_ids))

