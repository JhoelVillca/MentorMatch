from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.models.main_models import PerfilMentee, PerfilMentor
from app.repositories import mentor_repository, mentee_repository
from app.schemas.mentor_profile import ProfileUpdateOrCreate
from app.schemas.mentee_profile import MenteeProfileUpsert


def get_mentor_profile(db: Session, user_id: UUID) -> Optional[PerfilMentor]:
    return mentor_repository.get_profile_by_user_id(db, user_id)


def upsert_mentor_profile(
    db: Session, user_id: UUID, data: ProfileUpdateOrCreate
) -> PerfilMentor:
    return mentor_repository.upsert_profile(db, user_id, data)


def get_mentee_profile(db: Session, user_id: UUID) -> Optional[PerfilMentee]:
    return mentee_repository.get_profile_by_user_id(db, user_id)


def upsert_mentee_profile(
    db: Session, user_id: UUID, data: MenteeProfileUpsert
) -> PerfilMentee:
    tz = (data.zona_horaria_preferida or "").strip() or "UTC"
    return mentee_repository.upsert_profile(
        db,
        user_id,
        data.nombre_completo,
        tz,
        data.biografia_corta,
    )
