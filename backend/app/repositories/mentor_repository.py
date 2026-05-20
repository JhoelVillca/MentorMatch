from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.models.main_models import PerfilMentor
from app.schemas.mentor_profile import ProfileUpdateOrCreate

def get_profile_by_user_id(db: Session, user_id: UUID) -> Optional[PerfilMentor]:
    return db.query(PerfilMentor).filter(PerfilMentor.id_usuario == user_id).first()

def upsert_profile(db: Session, user_id: UUID, data: ProfileUpdateOrCreate) -> PerfilMentor:
    perfil = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == user_id).first()
    
    if perfil:
        # Al actualizar:
        perfil.nombre_completo = data.nombre_completo
        perfil.biografia_profesional = data.biografia_profesional
        perfil.url_linkedin = data.url_linkedin
        perfil.url_video_presentacion = data.url_video_presentacion
        perfil.foto_perfil = data.foto_perfil  # <-- Guardamos la foto procesada
    else:
        # Al crear (instanciar PerfilMentor):
        perfil = PerfilMentor(
            id_usuario=user_id,
            nombre_completo=data.nombre_completo,
            biografia_profesional=data.biografia_profesional,
            url_linkedin=data.url_linkedin,
            url_video_presentacion=data.url_video_presentacion,
            foto_perfil=data.foto_perfil  # <-- Guardamos la foto procesada aquí también
        )
        db.add(perfil)
        
    db.commit()
    db.refresh(perfil)
    return perfil