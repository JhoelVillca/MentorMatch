from pydantic import BaseModel
from typing import List
from uuid import UUID  

class HabilidadBase(BaseModel):
    nombre_habilidad: str

class HabilidadResponse(HabilidadBase):
    id_habilidad: UUID  

    class Config:
        from_attributes = True

class CategoriaResponse(BaseModel):
    id_categoria: UUID  
    nombre_categoria: str
    habilidades: List[HabilidadResponse] = []

    class Config:
        from_attributes = True

class MentorSkillCreate(BaseModel):
    id_habilidad: UUID  
    anios_experiencia: int
    nivel: str 