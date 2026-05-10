from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories import mentee_repository
from app.schemas.mentee_profile import MenteeProfileOut, MenteeProfileUpsert


def get_mentee_profile_for_user(db: Session, id_usuario: UUID) -> MenteeProfileOut:
    profile = mentee_repository.get_profile_by_usuario_id(db, id_usuario)
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
    db: Session,
    id_usuario: UUID,
    body: MenteeProfileUpsert,
) -> MenteeProfileOut:
    tz = (body.zona_horaria_preferida or "UTC").strip() or "UTC"
    nombre = body.nombre_completo.strip()
    bio = body.biografia_corta.strip() if body.biografia_corta else None

    existing = mentee_repository.get_profile_by_usuario_id(db, id_usuario)
    if existing:
        profile = mentee_repository.update_mentee_profile(db, existing, nombre, tz, bio)
    else:
        profile = mentee_repository.insert_mentee_profile(db, id_usuario, nombre, tz, bio)

    return MenteeProfileOut(
        id_mentee=profile.id_mentee,
        nombre_completo=profile.nombre_completo,
        zona_horaria_preferida=profile.zona_horaria_preferida or "UTC",
        biografia_corta=profile.biografia_corta,
    )
