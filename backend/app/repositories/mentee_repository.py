<<<<<<< HEAD
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
=======
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723

from app.models.main_models import PerfilMentee


<<<<<<< HEAD
def get_profile_by_usuario_id(db: Session, id_usuario: UUID) -> Optional[PerfilMentee]:
    return db.query(PerfilMentee).filter(PerfilMentee.id_usuario == id_usuario).first()


def insert_mentee_profile(
    db: Session,
    id_usuario: UUID,
=======
def get_profile_by_user_id(db: Session, user_id: UUID) -> Optional[PerfilMentee]:
    return db.query(PerfilMentee).filter(PerfilMentee.id_usuario == user_id).first()


def upsert_profile(
    db: Session,
    user_id: UUID,
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
    nombre_completo: str,
    zona_horaria_preferida: str,
    biografia_corta: Optional[str],
) -> PerfilMentee:
<<<<<<< HEAD
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
=======
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
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
