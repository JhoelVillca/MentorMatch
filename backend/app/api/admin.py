from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timezone
from uuid import UUID

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.main_models import Administrador, AuditoriaAdministrativa
from app.models.usuarios import Usuario
from app.repositories.user_repository import get_all_users_with_roles, get_user_role_name
from app.schemas.user import UserResponse
from app.schemas.admin import UserStatusUpdate


router = APIRouter(prefix="/admin", tags=["Administracion"])


class AdminUserResponse(UserResponse):
    fecha_creacion: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


async def require_admin(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> tuple[Usuario, Administrador]:
    user_id = str(current_user.id_usuario)
    role = await get_user_role_name(db, user_id)
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren permisos de administrador.",
        )

    res = await db.execute(
        select(Administrador).filter(Administrador.id_usuario == current_user.id_usuario)
    )
    admin_record = res.scalars().first()
    if not admin_record:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registro de administrador no encontrado.",
        )

    return current_user, admin_record


async def _get_target_user(db: AsyncSession, user_id: str) -> Usuario:
    res = await db.execute(
        select(Usuario).filter(Usuario.id_usuario == user_id)
    )
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return user


async def _registrar_auditoria(
    db: AsyncSession,
    id_admin: UUID,
    accion: str,
    tabla: str,
    id_registro: UUID,
) -> None:
    entrada = AuditoriaAdministrativa(
        id_admin=id_admin,
        accion_realizada=accion,
        tabla_afectada=tabla,
        id_registro_afectado=id_registro,
        fecha_accion=datetime.now(timezone.utc),
    )
    db.add(entrada)


@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    auth: tuple = Depends(require_admin),
):
    users_data = await get_all_users_with_roles(db)
    result = []
    for row in users_data:
        roles_list = (
            list(row.roles)
            if isinstance(row.roles, (list, tuple))
            else [str(row.roles)]
        ) if row.roles else ["mentee"]
        result.append({
            "id_usuario": row.id_usuario,
            "email": row.email,
            "estado_cuenta": row.estado_cuenta,
            "fecha_creacion": row.fecha_creacion,
            "roles": roles_list,
        })
    return result


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def soft_delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    auth: tuple = Depends(require_admin),
):
    _, admin_record = auth
    target = await _get_target_user(db, user_id)

    if str(target.id_usuario) == str(auth[0].id_usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un administrador no puede desactivarse a si mismo.",
        )

    target.estado_cuenta = "baneado"

    await _registrar_auditoria(
        db,
        id_admin=admin_record.id_admin,
        accion="SOFT_DELETE",
        tabla="usuarios",
        id_registro=target.id_usuario,
    )

    await db.commit()
    return {"message": f"Usuario {user_id} desactivado del sistema."}


@router.patch("/users/{user_id}/status", status_code=status.HTTP_200_OK)
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    auth: tuple = Depends(require_admin),
):
    _, admin_record = auth
    target = await _get_target_user(db, user_id)

    if str(target.id_usuario) == str(auth[0].id_usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un administrador no puede cambiar su propio estado.",
        )

    estado_anterior = target.estado_cuenta
    target.estado_cuenta = payload.estado

    await _registrar_auditoria(
        db,
        id_admin=admin_record.id_admin,
        accion=f"CAMBIO_ESTADO:{estado_anterior}->{payload.estado}",
        tabla="usuarios",
        id_registro=target.id_usuario,
    )

    await db.commit()
    return {
        "message": f"Estado de {target.email} actualizado a '{payload.estado}'.",
        "estado_anterior": estado_anterior,
        "estado_nuevo": payload.estado,
    }