from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.main_models import PaqueteMentor, PerfilMentor
from app.schemas.paquete_schema import PaqueteCreate, PaqueteOut, PaqueteUpdate
from app.api.deps import get_current_user_id  # Corrección: Importar la dependencia de seguridad

router = APIRouter(prefix="/paquetes", tags=["Paquetes de Mentoría"])

# --- ENDPOINT: CREAR UN PAQUETE ---
@router.post("/", response_model=PaqueteOut)
async def crear_paquete(
    paquete: PaqueteCreate, 
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id) # Corrección: Endpoint protegido
):
    # Corrección: Buscar id_mentor usando el user_id del JWT para evitar que sea NULL
    res = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
    mentor = res.scalars().first()
    if not mentor:
        raise HTTPException(status_code=403, detail="Perfil de mentor no encontrado")

    nuevo_paquete = PaqueteMentor(**paquete.dict(), id_mentor=mentor.id_mentor)
    db.add(nuevo_paquete)
    await db.commit()
    await db.refresh(nuevo_paquete)
    return nuevo_paquete

# --- ENDPOINT: LISTAR PAQUETES DEL MENTOR ---
@router.get("/me", response_model=List[PaqueteOut])
async def listar_mis_paquetes(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id) # Corrección: Endpoint protegido
):
    # Corrección: Filtrar por id_mentor para no devolver paquetes ajenos
    res = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
    mentor = res.scalars().first()
    if not mentor:
        return []

    res2 = await db.execute(select(PaqueteMentor).filter(PaqueteMentor.id_mentor == mentor.id_mentor))
    return res2.scalars().all()

# --- ENDPOINT: ACTIVA O DESACTIVA ---
@router.patch("/{paquete_id}/status", response_model=PaqueteOut)
async def cambiar_estado(
    paquete_id: UUID, 
    update: PaqueteUpdate, 
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id) # Corrección: Endpoint protegido
):
    # Corrección: Validar que el paquete pertenezca al mentor logueado antes de modificar
    res = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_id))
    mentor = res.scalars().first()
    
    res2 = await db.execute(select(PaqueteMentor).filter(
        PaqueteMentor.id_paquete == paquete_id,
        PaqueteMentor.id_mentor == (mentor.id_mentor if mentor else None)
    ))
    paquete = res2.scalars().first()
    
    if not paquete:
        raise HTTPException(status_code=404, detail="El paquete no existe o no te pertenece")
    
    paquete.estado_activo = update.estado_activo
    await db.commit()
    await db.refresh(paquete)
    return paquete