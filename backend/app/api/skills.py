from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from sqlalchemy.orm import joinedload
from sqlalchemy.future import select

from app.db.database import get_db
from app.models.main_models import CategoriaHabilidad, MentorHabilidad, PerfilMentor
from app.models.usuarios import Usuario
from app.schemas.skills import CategoriaResponse, MentorSkillCreate
from app.api.deps import get_current_user_id


router = APIRouter(prefix="/skills", tags=["Habilidades"])

@router.get("/categories", response_model=List[CategoriaResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CategoriaHabilidad).options(joinedload(CategoriaHabilidad.habilidades)))
    categories = res.scalars().unique().all()
    return categories

@router.post("/mentor", status_code=status.HTTP_201_CREATED)
async def add_mentor_skill(
    skill_data: MentorSkillCreate, 
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Permite a un mentor logueado añadir una habilidad a su perfil.
    """
    user_uuid = UUID(user_id)

    # 1. Buscar si el usuario existe
    res = await db.execute(select(Usuario).filter(Usuario.id_usuario == user_uuid))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # 2. Buscar si el usuario tiene PerfilMentor
    res2 = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == user_uuid))
    perfil_mentor = res2.scalars().first()
    
    if not perfil_mentor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe completar su perfil de mentor primero")
    
    # 3. Verificar si el mentor ya tiene esta habilidad declarada
    existing_q = await db.execute(select(MentorHabilidad).filter(
        MentorHabilidad.id_mentor == perfil_mentor.id_mentor,
        MentorHabilidad.id_habilidad == skill_data.id_habilidad
    ))
    existing_skill = existing_q.scalars().first()

    if existing_skill:
        # Actualizar la habilidad si ya la tiene
        existing_skill.anios_experiencia = skill_data.anios_experiencia
        existing_skill.nivel = skill_data.nivel
        await db.commit()
        return {"detail": "Habilidad actualizada exitosamente"}

    # 4. Crear el registro en MentorHabilidad
    nueva_habilidad = MentorHabilidad(
        id_mentor=perfil_mentor.id_mentor,
        id_habilidad=skill_data.id_habilidad,
        anios_experiencia=skill_data.anios_experiencia,
        nivel=skill_data.nivel
    )
    db.add(nueva_habilidad)
    await db.commit()
    
    return {"detail": "Habilidad añadida exitosamente al perfil del mentor"}
