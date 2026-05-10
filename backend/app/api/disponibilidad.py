from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import time
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.main_models import DisponibilidadMentor, PerfilMentor
from app.models.usuarios import Usuario

router = APIRouter(prefix="/disponibilidad", tags=["Disponibilidad"])

DIA_STR_TO_INT = {
    "Lunes": 1,
    "Martes": 2,
    "Miércoles": 3,
    "Jueves": 4,
    "Viernes": 5,
    "Sábado": 6,
    "Domingo": 7
}
DIA_INT_TO_STR = {v: k for k, v in DIA_STR_TO_INT.items()}

class AvailabilityCreate(BaseModel):
    dia_semana: str = Field(..., description="Día de la semana (ej. Lunes, Martes)")
    hora_inicio: time
    hora_fin: time

    @field_validator('hora_fin')
    def check_time_order(cls, v, info):
        if 'hora_inicio' in info.data and v <= info.data['hora_inicio']:
            raise ValueError('hora_fin debe ser estrictamente posterior a hora_inicio')
        return v

class AvailabilityResponse(BaseModel):
    id: UUID
    id_mentor: UUID
    dia_semana: str
    hora_inicio: time
    hora_fin: time

    @model_validator(mode='before')
    @classmethod
    def map_db_to_schema(cls, data):
        if hasattr(data, 'id_disponibilidad'):
            return {
                "id": data.id_disponibilidad,
                "id_mentor": data.id_mentor,
                "dia_semana": DIA_INT_TO_STR.get(data.dia_semana, "Desconocido"),
                "hora_inicio": data.hora_inicio_utc,
                "hora_fin": data.hora_fin_utc,
            }
        return data

    class Config:
        from_attributes = True

@router.post("/", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability(
    availability: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    perfil = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de mentor no encontrado")

    dia_int = DIA_STR_TO_INT.get(availability.dia_semana, 1)

    new_availability = DisponibilidadMentor(
        id_mentor=perfil.id_mentor,
        dia_semana=dia_int,
        hora_inicio_utc=availability.hora_inicio,
        hora_fin_utc=availability.hora_fin
    )
    db.add(new_availability)
    db.commit()
    db.refresh(new_availability)
    return new_availability

@router.get("/", response_model=List[AvailabilityResponse])
def get_availabilities(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    perfil = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario).first()
    if not perfil:
        return []

    availabilities = db.query(DisponibilidadMentor).filter(
        DisponibilidadMentor.id_mentor == perfil.id_mentor
    ).all()
    return availabilities

@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    availability_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    perfil = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de mentor no encontrado")

    availability = db.query(DisponibilidadMentor).filter(
        DisponibilidadMentor.id_disponibilidad == availability_id,
        DisponibilidadMentor.id_mentor == perfil.id_mentor
    ).first()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Horario no encontrado o no autorizado"
        )
        
    db.delete(availability)
    db.commit()
    return None
