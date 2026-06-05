from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_mentee_user_id, get_current_mentor_user_id
from app.services.contrato_service import ContratoService
from app.schemas.resena_schema import ResenaCreate, ResenaOut
from app.services.resena_service import ResenaService

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

@router.post("/{id_contrato}/resenas", response_model=ResenaOut, status_code=status.HTTP_201_CREATED)
async def crear_resena(
    id_contrato: UUID,
    resena: ResenaCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    servicio = ResenaService(db)
    try:
        return await servicio.crear_resena(user_id, id_contrato, resena)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    except FileExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
    except RuntimeError as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))

class AplicarBecaReq(BaseModel):
    id_paquete: UUID
    carta_motivacion: str

@router.post("/aplicar-beca", status_code=status.HTTP_202_ACCEPTED)
async def aplicar_beca(
    req: AplicarBecaReq,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id)
):
    servicio = ContratoService(db)
    try:
        return await servicio.aplicar_beca(user_id, req.id_paquete, req.carta_motivacion)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.get("/solicitudes")
async def listar_solicitudes_beca(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    servicio = ContratoService(db)
    return await servicio.listar_solicitudes_mentor(user_id)

@router.patch("/{id_contrato}/aceptar")
async def aceptar_beca(
    id_contrato: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    servicio = ContratoService(db)
    try:
        return await servicio.responder_solicitud_beca(user_id, id_contrato, "aceptar")
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.patch("/{id_contrato}/rechazar")
async def rechazar_beca(
    id_contrato: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    servicio = ContratoService(db)
    try:
        return await servicio.responder_solicitud_beca(user_id, id_contrato, "rechazar")
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.get("/mis-estudiantes")
async def listar_mis_estudiantes(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    servicio = ContratoService(db)
    return await servicio.listar_mis_estudiantes(user_id)