from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin_role
from app.db.database import get_db
from app.models.usuarios import Usuario
from app.schemas.admin import AdminUserRow
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/users", response_model=list[AdminUserRow])
def get_all_users(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin_role),
):
    return admin_service.list_registered_users(db)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin_role),
):
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador de usuario inválido")
    user = db.query(Usuario).filter(Usuario.id_usuario == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Sujeto no encontrado en la base de datos")
    db.delete(user)
    db.commit()
    return {"message": f"Usuario {user_id} eliminado del sistema."}
