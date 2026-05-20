from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
import urllib.parse

from app.models.main_models import PerfilMentee, PerfilMentor
from app.repositories import mentor_repository, mentee_repository
from app.schemas.mentor_profile import ProfileUpdateOrCreate
from app.schemas.mentee_profile import MenteeProfileUpsert, MenteeProfileOut
async def get_mentor_profile(db: AsyncSession, user_id: UUID) -> Optional[PerfilMentor]:
    return await mentor_repository.get_profile_by_user_id(db, user_id)


async def upsert_mentor_profile(
    db: AsyncSession, user_id: UUID, data: ProfileUpdateOrCreate
) -> PerfilMentor:
    # Lógica del motor de avatares para Mentor:
    # Si 'foto_perfil' viene vacío, nulo o solo espacios, se le genera su avatar por defecto
    if not data.foto_perfil or not data.foto_perfil.strip():
        nombre_limpio = data.nombre_completo.strip()
        nombre_codificado = urllib.parse.quote_plus(nombre_limpio)
        data.foto_perfil = f"https://ui-avatars.com/api/?name={nombre_codificado}&background=random"
    
    return await mentor_repository.upsert_profile(db, user_id, data)


async def get_mentee_profile(db: AsyncSession, user_id: UUID) -> Optional[PerfilMentee]:
    return await mentee_repository.get_profile_by_user_id(db, user_id)


async def get_mentee_profile_for_user(db: AsyncSession, id_usuario: UUID) -> MenteeProfileOut:
    profile = await mentee_repository.get_profile_by_user_id(db, id_usuario)
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


async def upsert_mentee_profile(
    db: AsyncSession, user_id: UUID, data: MenteeProfileUpsert
) -> PerfilMentee:
    tz = (data.zona_horaria_preferida or "").strip() or "UTC"
    nombre = data.nombre_completo.strip()
    bio = data.biografia_corta.strip() if data.biografia_corta else None
    
    # Lógica del motor de avatares para Mentee:
    foto = data.foto_perfil
    if not foto or not foto.strip():
        nombre_codificado = urllib.parse.quote_plus(nombre)
        foto = f"https://ui-avatars.com/api/?name={nombre_codificado}&background=random"
        
    return await mentee_repository.upsert_profile(
        db,
        user_id,
        nombre,
        tz,
        bio,
        foto,  # Se envía la variable procesada (con foto o avatar por defecto)
    )