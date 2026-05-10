from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_mentee_user_id
from app.db.database import get_db
from app.schemas.mentee_profile import MenteeProfileOut, MenteeProfileUpsert
from app.services import profile_service

router = APIRouter(prefix="/profiles", tags=["Perfiles"])


@router.get("/mentee/me", response_model=MenteeProfileOut)
def get_my_mentee_profile(
    user_id: str = Depends(get_current_mentee_user_id),
    db: Session = Depends(get_db),
):
    return profile_service.get_mentee_profile_for_user(db, UUID(user_id))


@router.put("/mentee/me", response_model=MenteeProfileOut, status_code=status.HTTP_200_OK)
def upsert_my_mentee_profile(
    body: MenteeProfileUpsert,
    user_id: str = Depends(get_current_mentee_user_id),
    db: Session = Depends(get_db),
):
    return profile_service.upsert_mentee_profile(db, UUID(user_id), body)


@router.get("/mentor/me")
def get_mentor_profile():
    return {"detail": "Espacio reservado para lógica de Mentor. Pendiente de implementación."}
