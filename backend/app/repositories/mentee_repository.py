from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.models.main_models import PerfilMentee


def get_profile_by_user_id(db: Session, user_id: UUID) -> Optional[PerfilMentee]:
    return db.query(PerfilMentee).filter(PerfilMentee.id_usuario == user_id).first()


def upsert_profile(
    db: Session,
    user_id: UUID,
    nombre_completo: str,
    zona_horaria_preferida: str,
    biografia_corta: Optional[str],
) -> PerfilMentee:
    perfil = get_profile_by_user_id(db, user_id)
    if perfil:
        perfil.nombre_completo = nombre_completo
        perfil.zona_horaria_preferida = zona_horaria_preferida
        perfil.biografia_corta = biografia_corta
    else:
        perfil = PerfilMentee(
            id_usuario=user_id,
            nombre_completo=nombre_completo,
            zona_horaria_preferida=zona_horaria_preferida,
            biografia_corta=biografia_corta,
        )
        db.add(perfil)

    db.commit()
    db.refresh(perfil)
    return perfil
