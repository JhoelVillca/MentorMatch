from typing import List, Dict, Any
from sqlalchemy import insert, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.associations import usuario_roles
from app.models.main_models import Rol
from app.models.usuarios import Usuario

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == email))
    return result.scalars().first()

async def get_all_users_with_roles(db: AsyncSession) -> List[Dict[str, Any]]:
    query = (
        select(
            Usuario.id_usuario,
            Usuario.email,
            Usuario.estado_cuenta,
            Usuario.fecha_creacion,
            func.array_agg(Rol.nombre_rol).label('roles')
        )
        .outerjoin(usuario_roles, Usuario.id_usuario == usuario_roles.c.id_usuario)
        .outerjoin(Rol, usuario_roles.c.id_rol == Rol.id_rol)
        .group_by(
            Usuario.id_usuario,
            Usuario.email,
            Usuario.estado_cuenta,
            Usuario.fecha_creacion
        )
    )
    result = await db.execute(query)
    return result.all()

async def get_user_role_name(db: AsyncSession, id_usuario: str) -> str:
    result = await db.execute(select(usuario_roles).filter(usuario_roles.c.id_usuario == UUID(id_usuario)))
    rol_record = result.first()
    if rol_record:
        res_rol = await db.execute(select(Rol).filter(Rol.id_rol == rol_record.id_rol))
        rol_obj = res_rol.scalars().first()
        if rol_obj:
            return rol_obj.nombre_rol
    return "mentee"

async def create_user(
    db: AsyncSession,
    email: str,
    hashed_password: str,
    nombre_rol: str = "mentee",
) -> Usuario:
    res_rol = await db.execute(select(Rol).filter(Rol.nombre_rol == nombre_rol))
    rol = res_rol.scalars().first()
    if not rol:
        raise ValueError(f"No existe el rol '{nombre_rol}'.")

    new_user = Usuario(email=email, password=hashed_password)
    db.add(new_user)
    await db.flush()

    await db.execute(
        insert(usuario_roles).values(
            id_usuario=new_user.id_usuario,
            id_rol=rol.id_rol,
        )
    )
    await db.commit()
    await db.refresh(new_user)
    return new_user