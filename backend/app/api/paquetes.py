from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.main_models import PaqueteMentor, PerfilMentor
from app.schemas.paquete_schema import PaqueteCreate, PaqueteOut, PaqueteUpdate
from app.api.deps import get_current_user_id  # Corrección: Importar la dependencia de seguridad

router = APIRouter(prefix="/paquetes", tags=["Paquetes de Mentoría"])

# --- ENDPOINT: CREAR UN PAQUETE ---
@router.post("/", response_model=PaqueteOut)
def crear_paquete(
    paquete: PaqueteCreate, 
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id) # Corrección: Endpoint protegido
):
    # Corrección: Buscar id_mentor usando el user_id del JWT para evitar que sea NULL
    mentor = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == user_id).first()
    if not mentor:
        raise HTTPException(status_code=403, detail="Perfil de mentor no encontrado")

    nuevo_paquete = PaqueteMentor(**paquete.dict(), id_mentor=mentor.id_mentor)
    db.add(nuevo_paquete)
    db.commit()
    db.refresh(nuevo_paquete)
    return nuevo_paquete

# --- ENDPOINT: LISTAR PAQUETES DEL MENTOR ---
@router.get("/me", response_model=List[PaqueteOut])
def listar_mis_paquetes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id) # Corrección: Endpoint protegido
):
    # Corrección: Filtrar por id_mentor para no devolver paquetes ajenos
    mentor = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == user_id).first()
    if not mentor:
        return []

    return db.query(PaqueteMentor).filter(PaqueteMentor.id_mentor == mentor.id_mentor).all()

# --- ENDPOINT: ACTIVA O DESACTIVA ---
@router.patch("/{paquete_id}/status", response_model=PaqueteOut)
def cambiar_estado(
    paquete_id: UUID, 
    update: PaqueteUpdate, 
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id) # Corrección: Endpoint protegido
):
    # Corrección: Validar que el paquete pertenezca al mentor logueado antes de modificar
    mentor = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == user_id).first()
    
    paquete = db.query(PaqueteMentor).filter(
        PaqueteMentor.id_paquete == paquete_id,
        PaqueteMentor.id_mentor == (mentor.id_mentor if mentor else None)
    ).first()
    
    if not paquete:
        raise HTTPException(status_code=404, detail="El paquete no existe o no te pertenece")
    
    paquete.estado_activo = update.estado_activo
    db.commit()
    db.refresh(paquete)
    return paquete