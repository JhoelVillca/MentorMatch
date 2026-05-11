from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.models.main_models import PerfilMentee, PerfilMentor
from app.repositories import mentor_repository, mentee_repository
from app.schemas.mentor_profile import ProfileUpdateOrCreate
from app.schemas.mentee_profile import MenteeProfileUpsert, MenteeProfileOut


def get_mentor_profile(db: Session, user_id: UUID) -> Optional[PerfilMentor]:
    return mentor_repository.get_profile_by_user_id(db, user_id)


def upsert_mentor_profile(
    db: Session, user_id: UUID, data: ProfileUpdateOrCreate
) -> PerfilMentor:
    return mentor_repository.upsert_profile(db, user_id, data)


def get_mentee_profile(db: Session, user_id: UUID) -> Optional[PerfilMentee]:
    return mentee_repository.get_profile_by_user_id(db, user_id)


def get_mentee_profile_for_user(db: Session, id_usuario: UUID) -> MenteeProfileOut:
    profile = mentee_repository.get_profile_by_user_id(db, id_usuario)
    if not profile:
        return MenteeProfileOut(
            id_mentee=None,
            nombre_completo="",
            zona_horaria_preferida="UTC",
            biografia_corta=None,
        )
    return MenteeProfileOut(
        id_mentee=profile.id_mentee,
        nombre_completo=profile.nombre_completo,
        zona_horaria_preferida=profile.zona_horaria_preferida or "UTC",
        biografia_corta=profile.biografia_corta,
    )


def upsert_mentee_profile(
    db: Session, user_id: UUID, data: MenteeProfileUpsert
) -> PerfilMentee:
    tz = (data.zona_horaria_preferida or "").strip() or "UTC"
    nombre = data.nombre_completo.strip()
    bio = data.biografia_corta.strip() if data.biografia_corta else None
    return mentee_repository.upsert_profile(
        db,
        user_id,
        nombre,
        tz,
        bio,
    )