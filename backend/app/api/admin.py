from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.repositories.user_repository import get_all_users_with_roles, get_user_role_name
from app.schemas.user import UserResponse


router = APIRouter(prefix="/admin", tags=["Administración"])


class AdminUserResponse(UserResponse):
    """Schema extendido para respuesta de administrador con fecha y roles."""
    fecha_creacion: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


async def require_admin(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Dependencia que verifica si el usuario actual tiene rol de administrador.
    Lanza HTTP 403 Forbidden si no tiene permisos.
    """
    user_id = str(current_user.id_usuario)
    role = await get_user_role_name(db, user_id)
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren permisos de administrador."
        )
    return current_user


@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Obtiene la lista de todos los usuarios registrados en el sistema.
    Solo accesible para usuarios con rol 'admin'.
    
    Retorna:
    - id_usuario: UUID del usuario
    - email: Correo electrónico
    - estado_cuenta: Estado de la cuenta (activo, suspendido, baneado)
    - fecha_creacion: Fecha de registro
    - roles: Lista de roles asignados
    """
    users_data = await get_all_users_with_roles(db)
    
    # Convertir los resultados a un formato serializable
    result = []
    for user_row in users_data:
        # user_row es una tupla con (id_usuario, email, estado_cuenta, fecha_creacion, roles)
        roles_list = list(user_row.roles) if user_row.roles else ["mentee"]
        result.append({
            "id_usuario": user_row.id_usuario,
            "email": user_row.email,
            "estado_cuenta": user_row.estado_cuenta,
            "fecha_creacion": user_row.fecha_creacion,
            "roles": roles_list
        })
    
    return result


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Elimina un usuario del sistema por su ID.
    Solo accesible para usuarios con rol 'admin'.
    """
    from app.models.usuarios import Usuario
    
    from sqlalchemy.future import select
    res = await db.execute(select(Usuario).filter(Usuario.id_usuario == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado en la base de datos"
        )
    db.delete(user)
    await db.commit()
    return {"message": f"Usuario {user_id} eliminado del sistema."}