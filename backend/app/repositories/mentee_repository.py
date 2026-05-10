from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.main_models import PerfilMentee


def get_profile_by_usuario_id(db: Session, id_usuario: UUID) -> Optional[PerfilMentee]:
    return db.query(PerfilMentee).filter(PerfilMentee.id_usuario == id_usuario).first()


def insert_mentee_profile(
    db: Session,
    id_usuario: UUID,
    nombre_completo: str,
    zona_horaria_preferida: str,
    biografia_corta: Optional[str],
) -> PerfilMentee:
    profile = PerfilMentee(
        id_usuario=id_usuario,
        nombre_completo=nombre_completo,
        zona_horaria_preferida=zona_horaria_preferida,
        biografia_corta=biografia_corta,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_mentee_profile(
    db: Session,
    profile: PerfilMentee,
    nombre_completo: str,
    zona_horaria_preferida: str,
    biografia_corta: Optional[str],
) -> PerfilMentee:
    profile.nombre_completo = nombre_completo
    profile.zona_horaria_preferida = zona_horaria_preferida
    profile.biografia_corta = biografia_corta
    db.commit()
    db.refresh(profile)
    return profile
