from pydantic import BaseModel, UUID4
from typing import List

class HabilidadBase(BaseModel):
    nombre_habilidad: str

class HabilidadResponse(HabilidadBase):
    id_habilidad: UUID4

    class Config:
        from_attributes = True

class CategoriaResponse(BaseModel):
    id_categoria: UUID4
    nombre_categoria: str
    habilidades: List[HabilidadResponse] = []

    class Config:
        from_attributes = True

class MentorSkillCreate(BaseModel):
    id_habilidad: UUID4
    anios_experiencia: int
    nivel: str # Basico, Intermedio, Avanzado
