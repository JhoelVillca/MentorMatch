from pydantic import BaseModel, Field
from typing import Optional

class ProfileUpdateOrCreate(BaseModel):
    nombre_completo: str = Field(..., max_length=255)
    biografia_profesional: str
    zona_horaria_preferida: Optional[str] = "UTC"
    url_linkedin: Optional[str] = Field(None, max_length=500)
    url_video_presentacion: Optional[str] = Field(None, max_length=500)
    foto_perfil: Optional[str] = Field(None, max_length=500)

class ProfileResponse(BaseModel):
    nombre_completo: str
    biografia_profesional: str
    zona_horaria_preferida: str
    url_linkedin: Optional[str] = None
    url_video_presentacion: Optional[str] = None
    foto_perfil: Optional[str] = None

    class Config:
        from_attributes = True
        