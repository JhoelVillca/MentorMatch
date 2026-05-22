from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.schemas.paquete_schema import PaqueteCreate, PaqueteOut, PaqueteUpdate, PaqueteDisponibleOut, PaqueteEdit
from app.api.deps import get_current_user_id
from app.services.paquete_service import PaqueteService

router = APIRouter(prefix="/paquetes", tags=["Paquetes de Mentoria"])

@router.get("/disponibles", response_model=List[PaqueteDisponibleOut])
async def listar_paquetes_disponibles(db: AsyncSession = Depends(get_db)):
    servicio = PaqueteService(db)
    return await servicio.listar_paquetes_disponibles()

@router.post("/", response_model=PaqueteOut)
async def crear_paquete(
    paquete: PaqueteCreate, 
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    servicio = PaqueteService(db)
    try:
        return await servicio.crear_paquete(user_id, paquete)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error transaccional: {str(e)}")

@router.get("/me", response_model=List[PaqueteOut])
async def listar_mis_paquetes(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    servicio = PaqueteService(db)
    return await servicio.listar_mis_paquetes(user_id)

@router.patch("/{paquete_id}/status", response_model=PaqueteOut)
async def cambiar_estado(
    paquete_id: UUID, 
    update: PaqueteUpdate, 
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    servicio = PaqueteService(db)
    try:
        return await servicio.cambiar_estado(user_id, paquete_id, update.estado_activo)
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error transaccional: {str(e)}")


@router.patch("/{paquete_id}", response_model=PaqueteOut)
async def editar_paquete(
    paquete_id: UUID,
    update: PaqueteEdit,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    servicio = PaqueteService(db)
    try:
        return await servicio.editar_paquete(user_id, paquete_id, update.model_dump(exclude_unset=True))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error transaccional: {str(e)}")