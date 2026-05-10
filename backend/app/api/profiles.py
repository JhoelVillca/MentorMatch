from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_mentor_user_id
from app.schemas.mentor_profile import ProfileUpdateOrCreate, ProfileResponse
from app.repositories import mentor_repository

router = APIRouter(prefix="/profiles", tags=["Perfiles"])

# El router es tu mini-aplicación.
@router.get("/mentee/me")
def get_mentee_profile():
    return {"detail": "Espacio reservado para lógica de Mentee. Pendiente de implementación."}

@router.get("/mentor/me", response_model=ProfileResponse)
def get_mentor_profile(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    perfil = mentor_repository.get_profile_by_user_id(db, user_id)
    if not perfil:
        return ProfileResponse(
            nombre_completo="",
            biografia_profesional="",
            url_linkedin="",
            url_video_presentacion=""
        )
    return perfil

@router.put("/mentor/me", response_model=ProfileResponse)
def update_mentor_profile(
    profile_data: ProfileUpdateOrCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id)
):
    perfil = mentor_repository.upsert_profile(db, user_id, profile_data)
    return perfil