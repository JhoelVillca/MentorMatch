from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from typing import List
import jwt

from app.db.database import SessionLocal
from app.models.main_models import CategoriaHabilidad, MentorHabilidad, PerfilMentor, Usuario
from app.schemas.skills import CategoriaResponse, MentorSkillCreate
from app.core.security import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/skills", tags=["Habilidades"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/categories", response_model=List[CategoriaResponse])
def get_categories(db: Session = Depends(get_db)):
    """Obtiene todas las categorías junto con sus habilidades."""
    categories = db.query(CategoriaHabilidad).all()
    return categories

@router.post("/mentor", status_code=status.HTTP_201_CREATED)
def add_mentor_skill(
    skill_data: MentorSkillCreate, 
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Permite a un mentor logueado añadir una habilidad a su perfil.
    Si el usuario no tiene PerfilMentor, se crea automáticamente.
    """
    # 1. Buscar si el usuario existe
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # 2. Buscar si el usuario tiene PerfilMentor
    perfil_mentor = db.query(PerfilMentor).filter(PerfilMentor.id_usuario == user_id).first()
    
    if not perfil_mentor:
        # Crear un PerfilMentor básico si no existe (con el email como nombre o "Mentor Nuevo")
        perfil_mentor = PerfilMentor(
            id_usuario=user.id_usuario,
            nombre_completo=user.email.split("@")[0] # Nombre por defecto
        )
        db.add(perfil_mentor)
        db.commit()
        db.refresh(perfil_mentor)
    
    # 3. Verificar si el mentor ya tiene esta habilidad declarada
    existing_skill = db.query(MentorHabilidad).filter(
        MentorHabilidad.id_mentor == perfil_mentor.id_mentor,
        MentorHabilidad.id_habilidad == skill_data.id_habilidad
    ).first()

    if existing_skill:
        # Actualizar la habilidad si ya la tiene
        existing_skill.anios_experiencia = skill_data.anios_experiencia
        existing_skill.nivel = skill_data.nivel
        db.commit()
        return {"detail": "Habilidad actualizada exitosamente"}

    # 4. Crear el registro en MentorHabilidad
    nueva_habilidad = MentorHabilidad(
        id_mentor=perfil_mentor.id_mentor,
        id_habilidad=skill_data.id_habilidad,
        anios_experiencia=skill_data.anios_experiencia,
        nivel=skill_data.nivel
    )
    db.add(nueva_habilidad)
    db.commit()
    
    return {"detail": "Habilidad añadida exitosamente al perfil del mentor"}
