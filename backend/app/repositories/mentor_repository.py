from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import Optional
from app.models.main_models import PerfilMentor, MentorHabilidad
from sqlalchemy.orm import joinedload
from app.schemas.mentor_profile import ProfileUpdateOrCreate

async def get_profile_by_user_id(db: AsyncSession, user_id: UUID) -> Optional[PerfilMentor]:
    query = (
        select(PerfilMentor)
        .options(
            joinedload(PerfilMentor.habilidades).joinedload(MentorHabilidad.habilidad)
        )
        .filter(PerfilMentor.id_usuario == user_id)
    )
    result = await db.execute(query)
    return result.scalars().first()


async def get_profile_by_mentor_id(db: AsyncSession, mentor_id: UUID) -> Optional[PerfilMentor]:
    query = (
        select(PerfilMentor)
        .options(
            joinedload(PerfilMentor.habilidades).joinedload(MentorHabilidad.habilidad)
        )
        .filter(PerfilMentor.id_mentor == mentor_id)
    )
    result = await db.execute(query)
    return result.scalars().first()

async def upsert_profile(db: AsyncSession, user_id: UUID, data: ProfileUpdateOrCreate) -> PerfilMentor:
    perfil = await get_profile_by_user_id(db, user_id)
    
    if perfil:
        perfil.nombre_completo = data.nombre_completo
        perfil.biografia_profesional = data.biografia_profesional
        perfil.url_linkedin = data.url_linkedin
        perfil.url_video_presentacion = data.url_video_presentacion
        perfil.foto_perfil = data.foto_perfil
    else:
        perfil = PerfilMentor(
            id_usuario=user_id,
            nombre_completo=data.nombre_completo,
            biografia_profesional=data.biografia_profesional,
            url_linkedin=data.url_linkedin,
            url_video_presentacion=data.url_video_presentacion,
            foto_perfil=data.foto_perfil
        )
        db.add(perfil)
        
    await db.commit()
    await db.refresh(perfil)
    return perfil


async def update_foto_perfil(db: AsyncSession, user_id: UUID, foto_url: str) -> Optional[PerfilMentor]:
    perfil = await get_profile_by_user_id(db, user_id)
    if not perfil:
        return None
    perfil.foto_perfil = foto_url
    await db.commit()
    await db.refresh(perfil)
    return perfil