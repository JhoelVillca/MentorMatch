from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class MenteeProfileUpsert(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    zona_horaria_preferida: str = Field(default="UTC", max_length=50)
    biografia_corta: Optional[str] = Field(None, max_length=4000)
    foto_perfil: Optional[str] = Field(None, max_length=500) 
    avatar_url: Optional[str] = Field(None, max_length=500) 

    @model_validator(mode='before')
    @classmethod
    def map_avatar(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if values.get('avatar_url'):
                values['foto_perfil'] = values.get('avatar_url')
        return values


class MenteeProfileOut(BaseModel):
    id_mentee: Optional[UUID] = None
    nombre_completo: str = ""
    zona_horaria_preferida: str = "UTC"
    biografia_corta: Optional[str] = None
    foto_perfil: Optional[str] = None  # <-- Agregado aquí también

    class Config:
        from_attributes = True


class MenteeProfileResponse(BaseModel):
    nombre_completo: str
    zona_horaria_preferida: str
    biografia_corta: Optional[str] = None
    foto_perfil: Optional[str] = None  # <-- Agregado para la respuesta del endpoint de mentees

    class Config:
        from_attributes = True