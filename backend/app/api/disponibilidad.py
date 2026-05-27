from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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

    @model_validator(mode='before')
    @classmethod
    def preprocess_times(cls, data):
        if isinstance(data, dict):
            for field in ('hora_inicio', 'hora_fin'):
                val = data.get(field)
                if isinstance(val, str) and val.startswith("24:00"):
                    data[field] = "23:59:59"
        return data

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
async def create_availability(
    availability: AvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    res = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario))
    perfil = res.scalars().first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de mentor no encontrado")

    dia_int = DIA_STR_TO_INT.get(availability.dia_semana, 1)

    # Validar solapamiento con bloques existentes del mismo día
    res_overlap = await db.execute(
        select(DisponibilidadMentor).filter(
            DisponibilidadMentor.id_mentor == perfil.id_mentor,
            DisponibilidadMentor.dia_semana == dia_int,
            DisponibilidadMentor.hora_inicio_utc < availability.hora_fin,
            DisponibilidadMentor.hora_fin_utc > availability.hora_inicio,
        )
    )
    if res_overlap.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un bloque de disponibilidad en {availability.dia_semana} que se solapa con el rango {availability.hora_inicio} - {availability.hora_fin}."
        )

    new_availability = DisponibilidadMentor(
        id_mentor=perfil.id_mentor,
        dia_semana=dia_int,
        hora_inicio_utc=availability.hora_inicio,
        hora_fin_utc=availability.hora_fin
    )
    db.add(new_availability)
    await db.commit()
    await db.refresh(new_availability)
    return new_availability

@router.get("/", response_model=List[AvailabilityResponse])
async def get_availabilities(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    res = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario))
    perfil = res.scalars().first()
    if not perfil:
        return []

    res2 = await db.execute(select(DisponibilidadMentor).filter(
        DisponibilidadMentor.id_mentor == perfil.id_mentor
    ))
    availabilities = res2.scalars().all()
    return availabilities

@router.get("/mentor/{id_mentor}", response_model=List[AvailabilityResponse])
async def get_mentor_availability(id_mentor: UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DisponibilidadMentor).filter(DisponibilidadMentor.id_mentor == id_mentor)
    )
    return res.scalars().all()

@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_availability(
    availability_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    res = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario))
    perfil = res.scalars().first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de mentor no encontrado")

    res2 = await db.execute(select(DisponibilidadMentor).filter(
        DisponibilidadMentor.id_disponibilidad == availability_id,
        DisponibilidadMentor.id_mentor == perfil.id_mentor
    ))
    availability = res2.scalars().first()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Horario no encontrado o no autorizado"
        )
        
    db.delete(availability)
    await db.commit()
    return None
