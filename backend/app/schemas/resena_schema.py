from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ResenaCreate(BaseModel):
    calificacion_estrellas: int = Field(ge=1, le=5, description="Calificacion de 1 a 5 estrellas")
    comentario_texto: Optional[str] = None

class ResenaOut(BaseModel):
    id_resena: UUID
    id_contrato: UUID
    calificacion_estrellas: int
    comentario_texto: Optional[str]
    fecha_publicacion: datetime
    reportada: bool

    class Config:
        from_attributes = True
