from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.main_models import PerfilMentor
from app.models.usuarios import Usuario

router = APIRouter(prefix="/perfil", tags=["Perfil Mentor"])

class ProfileUpdateOrCreate(BaseModel):
    nombre_completo: str
    biografia_profesional: str
    url_linkedin: Optional[str] = None
    url_video_presentacion: Optional[str] = None

class ProfileResponse(BaseModel):
    nombre_completo: str
    biografia_profesional: str
    url_linkedin: Optional[str] = None
    url_video_presentacion: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=ProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    perfil = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario).first()
    if not perfil:
        return ProfileResponse(
            nombre_completo="",
            biografia_profesional="",
            url_linkedin="",
            url_video_presentacion=""
        )
    return perfil

@router.put("/", response_model=ProfileResponse)
def update_or_create_profile(
    profile_data: ProfileUpdateOrCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    perfil = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario).first()
    
    if perfil:
        # UPDATE
        perfil.nombre_completo = profile_data.nombre_completo
        perfil.biografia_profesional = profile_data.biografia_profesional
        perfil.url_linkedin = profile_data.url_linkedin
        perfil.url_video_presentacion = profile_data.url_video_presentacion
    else:
        # INSERT
        perfil = PerfilMentor(
            id_usuario=current_user.id_usuario,
            nombre_completo=profile_data.nombre_completo,
            biografia_profesional=profile_data.biografia_profesional,
            url_linkedin=profile_data.url_linkedin,
            url_video_presentacion=profile_data.url_video_presentacion
        )
        db.add(perfil)
        
    db.commit()
    db.refresh(perfil)
    
    return perfil
