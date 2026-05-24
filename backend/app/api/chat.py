import jwt
from uuid import UUID
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import SECRET_KEY, ALGORITHM
from app.db.database import get_db, AsyncSessionLocal
from app.api.deps import get_current_user
from app.schemas.chat_schema import SalaResponse, MensajesPage, IniciarChatRequest
from app.repositories.chat_repository import get_salas_for_user, get_mensajes_paginated, save_mensaje, mark_as_read, verify_sala_participant, get_or_create_sala
from app.services.connection_manager import manager
from app.models.main_models import PerfilMentee, PerfilMentor

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

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.cookies.get("access_token")
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
    manager.connect(user_id, websocket)

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

                    mensaje = await save_mensaje(db, UUID(sala_id), UUID(user_id), contenido, auth_data["is_mentee"])

                msg_payload = {
                    "type": "new_message",
                    "id_mensaje": str(mensaje.id_mensaje),
                    "id_sala": sala_id,
                    "id_remitente": user_id,
                    "contenido_texto": contenido,
                    "fecha_envio": mensaje.fecha_envio.isoformat(),
                    "leido": False
                }

                await manager.send_personal_message(auth_data["receiver_id"], msg_payload)
                await manager.send_personal_message(user_id, msg_payload)

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)


