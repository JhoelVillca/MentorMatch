<<<<<<< HEAD
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MenteeProfileUpsert(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    zona_horaria_preferida: str = Field(default="UTC", max_length=50)
    biografia_corta: Optional[str] = Field(None, max_length=4000)


class MenteeProfileOut(BaseModel):
    id_mentee: Optional[UUID] = None
    nombre_completo: str = ""
    zona_horaria_preferida: str = "UTC"
=======
from pydantic import BaseModel, Field
from typing import Optional


class MenteeProfileUpsert(BaseModel):
    nombre_completo: str = Field(..., max_length=255)
    zona_horaria_preferida: Optional[str] = Field(default="UTC", max_length=50)
    biografia_corta: Optional[str] = None


class MenteeProfileResponse(BaseModel):
    nombre_completo: str
    zona_horaria_preferida: str
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
    biografia_corta: Optional[str] = None

    class Config:
        from_attributes = True
