from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_mentee_user_id, get_current_mentor_user_id, get_current_user
from app.db.database import get_db
from app.schemas.sesion_schema import (
    AgendarSesionRequest,
    SesionDetalleOut,
    SesionListOut,
    SesionOcupadaOut,
    SesionOut,
)
from app.services.sesion_service import SesionService

router = APIRouter(prefix="/sesiones", tags=["Sesiones"])


@router.post("/agendar", response_model=SesionOut, status_code=status.HTTP_201_CREATED)
async def agendar_sesion(
    req: AgendarSesionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    servicio = SesionService(db)
    try:
        return await servicio.agendar_sesion(user_id, req)
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
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Fallo interno: {str(e)}")


@router.get("/mentee/me", response_model=list[SesionListOut])
async def listar_sesiones_mentee(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    return await SesionService(db).listar_sesiones_mentee(user_id)


@router.get("/mentor/me", response_model=list[SesionListOut])
async def listar_sesiones_mentor(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    return await SesionService(db).listar_sesiones_mentor(user_id)


@router.get("/ocupadas/{id_mentor}", response_model=list[SesionOcupadaOut])
async def listar_sesiones_ocupadas_mentor(
    id_mentor: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await SesionService(db).listar_sesiones_ocupadas_mentor(id_mentor)


@router.get("/{id_sesion}", response_model=SesionDetalleOut)
async def obtener_sesion_por_id(
    id_sesion: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    servicio = SesionService(db)
    try:
        return await servicio.obtener_sesion_por_id(current_user.id_usuario, id_sesion)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.get("/{id_sesion}/token")
async def obtener_token_video(
    id_sesion: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    servicio = SesionService(db)
    try:
        return await servicio.generar_token_acceso(current_user.id_usuario, id_sesion)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    except RuntimeError as e:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))



@router.post("/{id_sesion}/iniciar", response_model=SesionOut)
async def iniciar_videollamada(
    id_sesion: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    servicio = SesionService(db)
    try:
        return await servicio.cambiar_estado_sesion(current_user.id_usuario, id_sesion, "en_curso")
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/{id_sesion}/finalizar", response_model=SesionOut)
async def finalizar_videollamada(
    id_sesion: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    servicio = SesionService(db)
    try:
        return await servicio.cambiar_estado_sesion(current_user.id_usuario, id_sesion, "finalizada")
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))