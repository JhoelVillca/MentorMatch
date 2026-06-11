import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_mentor_user_id, get_current_mentee_user_id
from app.db.database import get_db
from app.schemas.mentor_profile import ProfileUpdateOrCreate, ProfileResponse
from app.schemas.mentee_profile import MenteeProfileUpsert, MenteeProfileResponse, MenteeProfileOut
from app.schemas.upload_schema import PresignedUploadResponse, FotoPerfilUpdate
from app.core.s3_client import generate_presigned_post, get_public_url
from app.repositories import mentor_repository, mentee_repository
from app.services import profile_service

router = APIRouter(prefix="/profiles", tags=["Perfiles"])


@router.get("/mentee/me", response_model=MenteeProfileResponse)
async def get_mentee_profile(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    perfil = await profile_service.get_mentee_profile(db, user_id)
    if not perfil:
        # Añadimos foto_perfil=None para que el Schema de Pydantic no lance error
        return MenteeProfileResponse(
            nombre_completo="",
            zona_horaria_preferida="UTC",
            biografia_corta=None,
            foto_perfil=None,  
        )
    return perfil


@router.put("/mentee/me", response_model=MenteeProfileResponse)
async def update_mentee_profile(
    profile_data: MenteeProfileUpsert,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    return await profile_service.upsert_mentee_profile(db, user_id, profile_data)


@router.get("/mentor/me", response_model=ProfileResponse)
async def get_mentor_profile(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    perfil = await profile_service.get_mentor_profile(db, user_id)
    if not perfil:
        # Añadimos foto_perfil=None para mantener la consistencia con el nuevo Schema
        return ProfileResponse(
            nombre_completo="",
            biografia_profesional="",
            zona_horaria_preferida="UTC",
            url_linkedin="",
            url_video_presentacion="",
            foto_perfil=None,  
        )
    return perfil


@router.get("/mentor/{id_mentor}", response_model=ProfileResponse)
async def get_public_mentor_profile(
    id_mentor: UUID,
    db: AsyncSession = Depends(get_db),
):
    perfil = await profile_service.get_public_mentor_profile(db, id_mentor)
    if not perfil:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor no encontrado")
    return perfil


@router.put("/mentor/me", response_model=ProfileResponse)
async def update_mentor_profile(
    profile_data: ProfileUpdateOrCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    return await profile_service.upsert_mentor_profile(db, user_id, profile_data)


@router.get("/mentor/me/upload-url", response_model=PresignedUploadResponse)
async def get_mentor_upload_url(
    ext: str = Query(default="jpg", regex="^(jpg|jpeg|png|webp)$"),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    try:
        result = await asyncio.to_thread(generate_presigned_post, str(user_id), ext)
        return result
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Servicio de almacenamiento no disponible")


@router.get("/mentee/me/upload-url", response_model=PresignedUploadResponse)
async def get_mentee_upload_url(
    ext: str = Query(default="jpg", regex="^(jpg|jpeg|png|webp)$"),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    try:
        result = await asyncio.to_thread(generate_presigned_post, str(user_id), ext)
        return result
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Servicio de almacenamiento no disponible")


@router.patch("/mentor/me/foto", response_model=ProfileResponse)
async def update_mentor_foto(
    payload: FotoPerfilUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    if not (payload.foto_url.startswith("https://") or payload.foto_url.startswith("http://")):
        raise HTTPException(status_code=422, detail="URL de foto invalida")

    expected_prefix = get_public_url(f"perfiles/{user_id}/")
    if not payload.foto_url.startswith(expected_prefix):
        raise HTTPException(status_code=422, detail="URL no pertenece al bucket autorizado")

    perfil = await mentor_repository.update_foto_perfil(db, user_id, payload.foto_url)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de mentor no encontrado")
    return perfil


@router.patch("/mentee/me/foto", response_model=MenteeProfileResponse)
async def update_mentee_foto(
    payload: FotoPerfilUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    if not (payload.foto_url.startswith("https://") or payload.foto_url.startswith("http://")):
        raise HTTPException(status_code=422, detail="URL de foto invalida")

    expected_prefix = get_public_url(f"perfiles/{user_id}/")
    if not payload.foto_url.startswith(expected_prefix):
        raise HTTPException(status_code=422, detail="URL no pertenece al bucket autorizado")

    perfil = await mentee_repository.update_foto_perfil(db, user_id, payload.foto_url)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de mentee no encontrado")
    return perfil