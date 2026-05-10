from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field, field_validator
from datetime import time
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.main_models import MentorAvailability
from app.models.usuarios import Usuario

router = APIRouter(prefix="/disponibilidad", tags=["Disponibilidad"])

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
    mentor_id: UUID
    dia_semana: str
    hora_inicio: time
    hora_fin: time

    class Config:
        from_attributes = True

@router.post("/", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability(
    availability: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    new_availability = MentorAvailability(
        mentor_id=current_user.id_usuario,
        dia_semana=availability.dia_semana,
        hora_inicio=availability.hora_inicio,
        hora_fin=availability.hora_fin
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
    availabilities = db.query(MentorAvailability).filter(
        MentorAvailability.mentor_id == current_user.id_usuario
    ).all()
    return availabilities

@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    availability_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    availability = db.query(MentorAvailability).filter(
        MentorAvailability.id == availability_id,
        MentorAvailability.mentor_id == current_user.id_usuario
    ).first()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Horario no encontrado o no autorizado"
        )
        
    db.delete(availability)
    db.commit()
    return None
