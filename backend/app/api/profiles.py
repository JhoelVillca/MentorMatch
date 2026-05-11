from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_mentor_user_id, get_current_mentee_user_id
from app.schemas.mentor_profile import ProfileUpdateOrCreate, ProfileResponse
from app.schemas.mentee_profile import MenteeProfileUpsert, MenteeProfileResponse
from app.services import profile_service

router = APIRouter(prefix="/profiles", tags=["Perfiles"])


@router.get("/mentee/me", response_model=MenteeProfileResponse)
def get_mentee_profile(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    perfil = profile_service.get_mentee_profile(db, user_id)
    if not perfil:
        return MenteeProfileResponse(
            nombre_completo="",
            zona_horaria_preferida="UTC",
            biografia_corta=None,
        )
    return perfil


@router.put("/mentee/me", response_model=MenteeProfileResponse)
def update_mentee_profile(
    profile_data: MenteeProfileUpsert,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_mentee_user_id),
):
    return profile_service.upsert_mentee_profile(db, user_id, profile_data)


@router.get("/mentor/me", response_model=ProfileResponse)
def get_mentor_profile(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    perfil = profile_service.get_mentor_profile(db, user_id)
    if not perfil:
        return ProfileResponse(
            nombre_completo="",
            biografia_profesional="",
            url_linkedin="",
            url_video_presentacion="",
        )
    return perfil


@router.put("/mentor/me", response_model=ProfileResponse)
def update_mentor_profile(
    profile_data: ProfileUpdateOrCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_mentor_user_id),
):
    return profile_service.upsert_mentor_profile(db, user_id, profile_data)
