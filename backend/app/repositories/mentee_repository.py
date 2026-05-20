from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.main_models import PerfilMentee

async def get_profile_by_user_id(db: AsyncSession, user_id: UUID) -> Optional[PerfilMentee]:
    result = await db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == user_id))
    return result.scalars().first()

async def upsert_profile(
    db: AsyncSession,
    user_id: UUID,
    nombre_completo: str,
    zona_horaria_preferida: str,
    biografia_corta: Optional[str],
    foto_perfil: Optional[str],
) -> PerfilMentee:
    perfil = await get_profile_by_user_id(db, user_id)
    if perfil:
        perfil.nombre_completo = nombre_completo
        perfil.zona_horaria_preferida = zona_horaria_preferida
        perfil.biografia_corta = biografia_corta
        perfil.foto_perfil = foto_perfil
    else:
        perfil = PerfilMentee(
            id_usuario=user_id,
            nombre_completo=nombre_completo,
            zona_horaria_preferida=zona_horaria_preferida,
            biografia_corta=biografia_corta,
            foto_perfil=foto_perfil,
        )
        db.add(perfil)

    await db.commit()
    await db.refresh(perfil)
    return perfil