from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.main_models import PerfilMentee


def get_profile_by_user_id(db: Session, user_id: UUID) -> Optional[PerfilMentee]:
    return db.query(PerfilMentee).filter(PerfilMentee.id_usuario == user_id).first()


def upsert_profile(
    db: Session,
    user_id: UUID,
    nombre_completo: str,
    zona_horaria_preferida: str,
    biografia_corta: Optional[str],
    foto_perfil: Optional[str],  # <-- Nuevo parámetro aceptado desde el servicio
) -> PerfilMentee:
    
    perfil = get_profile_by_user_id(db, user_id)
    if perfil:
        # Al actualizar:
        perfil.nombre_completo = nombre_completo
        perfil.zona_horaria_preferida = zona_horaria_preferida
        perfil.biografia_corta = biografia_corta
        perfil.foto_perfil = foto_perfil  # <-- Guardamos la foto procesada
    else:
        # Al crear (instanciar PerfilMentee):
        perfil = PerfilMentee(
            id_usuario=user_id,
            nombre_completo=nombre_completo,
            zona_horaria_preferida=zona_horaria_preferida,
            biografia_corta=biografia_corta,
            foto_perfil=foto_perfil,  # <-- Guardamos la foto procesada aquí también
        )
        db.add(perfil)

    db.commit()
    db.refresh(perfil)
    return perfil