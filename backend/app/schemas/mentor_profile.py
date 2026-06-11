from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any, List
from uuid import UUID

class ProfileUpdateOrCreate(BaseModel):
    nombre_completo: str = Field(..., max_length=255)
    biografia_profesional: str
    zona_horaria_preferida: Optional[str] = "UTC"
    url_linkedin: Optional[str] = Field(None, max_length=500)
    url_video_presentacion: Optional[str] = Field(None, max_length=500)
    foto_perfil: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500) 

    @model_validator(mode='before')
    @classmethod
    def map_avatar(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if values.get('avatar_url'):
                values['foto_perfil'] = values.get('avatar_url')
        return values

class HabilidadNestedInfo(BaseModel):
    id_habilidad: UUID
    nombre_habilidad: str
    validada_por_admin: bool

    class Config:
        from_attributes = True

class MentorHabilidadOut(BaseModel):
    id_mentor_habilidad: UUID
    anios_experiencia: int
    nivel: str
    habilidad: Optional[HabilidadNestedInfo] = None

    class Config:
        from_attributes = True

class ProfileResponse(BaseModel):
    nombre_completo: str
    biografia_profesional: str
    zona_horaria_preferida: str
    url_linkedin: Optional[str] = None
    url_video_presentacion: Optional[str] = None
    foto_perfil: Optional[str] = None
    habilidades: List[MentorHabilidadOut] = []

    class Config:
        from_attributes = True
        