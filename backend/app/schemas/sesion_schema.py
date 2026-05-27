from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class AgendarSesionRequest(BaseModel):
    id_contrato: UUID
    fecha_hora_inicio_utc: datetime
    fecha_hora_fin_utc: datetime

    @field_validator("fecha_hora_fin_utc")
    @classmethod
    def fin_despues_de_inicio(cls, v, info):
        if "fecha_hora_inicio_utc" in info.data and v <= info.data["fecha_hora_inicio_utc"]:
            raise ValueError("fecha_hora_fin_utc debe ser posterior a fecha_hora_inicio_utc")
        return v


class SesionOut(BaseModel):
    id_sesion: UUID
    id_contrato: UUID
    fecha_hora_inicio_utc: datetime
    fecha_hora_fin_utc: datetime
    estado_sesion: str
    url_videollamada: str | None = None

    class Config:
        from_attributes = True


class SesionDetalleOut(SesionOut):
    titulo_paquete: str
    mentor_nombre: str
    mentee_nombre: str


class SesionOcupadaOut(BaseModel):
    fecha_hora_inicio_utc: datetime
    fecha_hora_fin_utc: datetime

    class Config:
        from_attributes = True


class SesionListOut(BaseModel):
    id_sesion: UUID
    fecha_hora_inicio_utc: datetime
    fecha_hora_fin_utc: datetime
    estado_sesion: str
    url_videollamada: str | None = None
    titulo_paquete: str
    contraparte_nombre: str

    class Config:
        from_attributes = True