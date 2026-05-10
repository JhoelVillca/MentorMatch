from pydantic import BaseModel, Field
from typing import Optional


class MenteeProfileUpsert(BaseModel):
    nombre_completo: str = Field(..., max_length=255)
    zona_horaria_preferida: Optional[str] = Field(default="UTC", max_length=50)
    biografia_corta: Optional[str] = None


class MenteeProfileResponse(BaseModel):
    nombre_completo: str
    zona_horaria_preferida: str
    biografia_corta: Optional[str] = None

    class Config:
        from_attributes = True
