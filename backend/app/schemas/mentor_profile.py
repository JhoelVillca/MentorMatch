from pydantic import BaseModel, Field
from typing import Optional

class ProfileUpdateOrCreate(BaseModel):
    nombre_completo: str = Field(..., max_length=255)
    biografia_profesional: str
    url_linkedin: Optional[str] = Field(None, max_length=500)
    url_video_presentacion: Optional[str] = Field(None, max_length=500)

class ProfileResponse(BaseModel):
    nombre_completo: str
    biografia_profesional: str
    url_linkedin: Optional[str] = None
    url_video_presentacion: Optional[str] = None

    class Config:
        from_attributes = True
