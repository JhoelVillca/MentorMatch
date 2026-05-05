from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.main_models import PaqueteMentor
from app.schemas.paquete_schema import PaqueteCreate, PaqueteOut, PaqueteUpdate

router = APIRouter(prefix="/paquetes", tags=["Paquetes de Mentoría"])

# --- ENDPOINT: CREAR UN PAQUETE ---
@router.post("/", response_model=PaqueteOut)
def crear_paquete(paquete: PaqueteCreate, db: Session = Depends(get_db)):
    # NOTA: En una fase avanzada, aquí usarás el ID del mentor autenticado
    nuevo_paquete = PaqueteMentor(**paquete.dict())
    db.add(nuevo_paquete)
    db.commit()
    db.refresh(nuevo_paquete)
    return nuevo_paquete

# --- ENDPOINT: LISTAR PAQUETES DEL MENTOR ---
@router.get("/me", response_model=List[PaqueteOut])
def listar_mis_paquetes(db: Session = Depends(get_db)):
    # Retorna todos los paquetes (luego filtraremos por el mentor logueado)
    return db.query(PaqueteMentor).all()

# --- ENDPOINT: ACTIVA O DESACTIVA ---
@router.patch("/{paquete_id}/status", response_model=PaqueteOut)
def cambiar_estado(paquete_id: UUID, update: PaqueteUpdate, db: Session = Depends(get_db)):
    paquete = db.query(PaqueteMentor).filter(PaqueteMentor.id_paquete == paquete_id).first()
    
    if not paquete:
        raise HTTPException(status_code=404, detail="El paquete no existe")
    
    paquete.estado_activo = update.estado_activo
    db.commit()
    db.refresh(paquete)
    return paquete