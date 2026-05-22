from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_mentee_user_id
from app.services.contrato_service import ContratoService

router = APIRouter(prefix="/contratos", tags=["Contratos y Transacciones"])

class AdquirirPaqueteReq(BaseModel):
    id_paquete: UUID

@router.post("/adquirir", status_code=status.HTTP_201_CREATED)
async def adquirir_contrato(
    req: AdquirirPaqueteReq,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    servicio = ContratoService(db)
    try:
        resultado = await servicio.adquirir_contrato(user_id, req.id_paquete)
        return resultado
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    except FileExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Fallo de integridad transaccional: {str(e)}")

@router.get("/me")
async def listar_mis_contratos(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    servicio = ContratoService(db)
    return await servicio.listar_mis_contratos(user_id)