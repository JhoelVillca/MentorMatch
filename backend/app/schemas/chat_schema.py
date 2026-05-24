from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class SalaResponse(BaseModel):
    id_sala: UUID
    contraparte_user_id: str
    nombre_otro: str
    foto_otro: Optional[str] = None
    ultimo_mensaje: Optional[str] = None
    ultimo_mensaje_fecha: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class MensajeResponse(BaseModel):
    id_mensaje: UUID
    id_remitente: UUID
    contenido_texto: str
    leido: bool
    fecha_envio: datetime

    class Config:
        from_attributes = True

class MensajesPage(BaseModel):
    mensajes: list[MensajeResponse]
    has_more: bool


class IniciarChatRequest(BaseModel):
    id_mentor: Optional[UUID] = None
    id_mentee: Optional[UUID] = None


class SalaCreate(BaseModel):
    id_mentor: UUID
    id_mentee: UUID


