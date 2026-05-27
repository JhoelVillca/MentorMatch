from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.database import get_db
from app.api.admin import require_admin
from app.schemas.resena_schema import ResenaOut
from app.services.resena_service import ResenaService

router = APIRouter(prefix="/resenas", tags=["Resenas"])

@router.patch("/{id_resena}/reportar", response_model=ResenaOut)
async def reportar_resena(
    id_resena: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin)
):
    servicio = ResenaService(db)
    try:
        return await servicio.reportar_resena(id_resena)
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
