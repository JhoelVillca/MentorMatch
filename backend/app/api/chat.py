import jwt
import logging
import asyncio
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.security import SECRET_KEY, ALGORITHM
from app.db.database import get_db, AsyncSessionLocal
from app.api.deps import get_current_user
from app.schemas.chat_schema import SalaResponse, MensajesPage, IniciarChatRequest
from app.repositories.chat_repository import get_salas_for_user, get_mensajes_paginated, save_mensaje, mark_as_read, verify_sala_participant, get_or_create_sala, get_contact_user_ids
from app.services.connection_manager import manager
from app.models.main_models import PerfilMentee, PerfilMentor, SalaChat

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/salas", response_model=list[SalaResponse])
async def get_salas(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_salas_for_user(db, str(current_user.id_usuario))

@router.get("/{id_sala}/mensajes", response_model=MensajesPage)
async def get_mensajes(id_sala: UUID, before: Optional[str] = Query(None), limit: int = Query(30, ge=1, le=100), current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    auth_data = await verify_sala_participant(db, id_sala, current_user.id_usuario)
    if not auth_data: raise HTTPException(status.HTTP_403_FORBIDDEN, detail="No perteneces a esta sala.")
    
    before_dt = datetime.fromisoformat(before) if before else None
    return await get_mensajes_paginated(db, id_sala, before_dt, limit)

@router.patch("/{id_sala}/read")
async def read_messages(id_sala: UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    auth_data = await verify_sala_participant(db, id_sala, current_user.id_usuario)
    if not auth_data: raise HTTPException(status.HTTP_403_FORBIDDEN, detail="No perteneces a esta sala.")
    
    await mark_as_read(db, id_sala, auth_data["is_mentee"])
    return {"status": "ok"}


@router.get("/unread-count")
async def get_unread_count(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    uid = current_user.id_usuario

    mentee_id = (
        await db.execute(select(PerfilMentee.id_mentee).where(PerfilMentee.id_usuario == uid))
    ).scalar_one_or_none()

    mentor_id = (
        await db.execute(select(PerfilMentor.id_mentor).where(PerfilMentor.id_usuario == uid))
    ).scalar_one_or_none()

    total = 0

    if mentee_id:
        result = await db.execute(
            select(func.coalesce(func.sum(SalaChat.no_leidos_mentee), 0)).where(SalaChat.id_mentee == mentee_id)
        )
        total += int(result.scalar_one())

    if mentor_id:
        result = await db.execute(
            select(func.coalesce(func.sum(SalaChat.no_leidos_mentor), 0)).where(SalaChat.id_mentor == mentor_id)
        )
        total += int(result.scalar_one())

    return {"total": total}


@router.post("/iniciar")
async def iniciar_conversacion(
    req: IniciarChatRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = current_user.id_usuario

    if req.id_mentor:
        mentee_id = (
            await db.execute(select(PerfilMentee.id_mentee).where(PerfilMentee.id_usuario == uid))
        ).scalar_one_or_none()
        if not mentee_id:
            raise HTTPException(status_code=403, detail="Perfil de mentee incompleto")

        sala_id = await get_or_create_sala(db, mentee_id, req.id_mentor)
        return {"id_sala": sala_id}

    if req.id_mentee:
        mentor_id = (
            await db.execute(select(PerfilMentor.id_mentor).where(PerfilMentor.id_usuario == uid))
        ).scalar_one_or_none()
        if not mentor_id:
            raise HTTPException(status_code=403, detail="Perfil de mentor incompleto")

        sala_id = await get_or_create_sala(db, req.id_mentee, mentor_id)
        return {"id_sala": sala_id}

    raise HTTPException(status_code=400, detail="Debe proveer id_mentor o id_mentee")


logger = logging.getLogger(__name__)

async def _save_and_notify_background(sala_id_str: str, user_id_str: str, contenido: str, is_mentee: bool) -> None:
    try:
        async with AsyncSessionLocal() as db:
            await save_mensaje(db, UUID(sala_id_str), UUID(user_id_str), contenido, is_mentee)
    except Exception as e:
        logger.error("Error al guardar mensaje en segundo plano: %s", e)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.cookies.get("access_token") or websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Token requerido")
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id: raise ValueError
    except Exception:
        await websocket.close(code=1008, reason="Token invalido")
        return

    await websocket.accept()
    was_offline = manager.connect(user_id, websocket)

    async with AsyncSessionLocal() as db:
        contact_ids = await get_contact_user_ids(db, user_id)

    online_contacts = [uid for uid in contact_ids if manager.is_online(uid)]

    await websocket.send_json({
        "type": "contacts_status",
        "online": online_contacts
    })

    if was_offline:
        await manager.broadcast_to_contacts(contact_ids, {
            "type": "user_online",
            "user_id": user_id
        })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type == "message":
                sala_id = data.get("id_sala")
                contenido = data.get("contenido_texto", "").strip()
                if not sala_id or not contenido: continue

                async with AsyncSessionLocal() as db:
                    auth_data = await verify_sala_participant(db, UUID(sala_id), UUID(user_id))
                
                if not auth_data: continue

                msg_payload = {
                    "type": "new_message",
                    "id_mensaje": str(uuid4()),
                    "id_sala": sala_id,
                    "id_remitente": user_id,
                    "contenido_texto": contenido,
                    "fecha_envio": datetime.utcnow().isoformat(),
                    "leido": False
                }

                await manager.send_personal_message(auth_data["receiver_id"], msg_payload)
                await manager.send_personal_message(user_id, msg_payload)

                asyncio.create_task(_save_and_notify_background(sala_id, user_id, contenido, auth_data["is_mentee"]))

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if not manager.is_online(user_id):
            async with AsyncSessionLocal() as db:
                contact_ids = await get_contact_user_ids(db, user_id)
            await manager.broadcast_to_contacts(contact_ids, {
                "type": "user_offline",
                "user_id": user_id
            })
    except Exception:
        manager.disconnect(user_id, websocket)
        if not manager.is_online(user_id):
            async with AsyncSessionLocal() as db:
                contact_ids = await get_contact_user_ids(db, user_id)
            await manager.broadcast_to_contacts(contact_ids, {
                "type": "user_offline",
                "user_id": user_id
            })


