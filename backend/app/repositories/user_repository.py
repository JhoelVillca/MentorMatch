from sqlalchemy import insert
from sqlalchemy.orm import Session
from typing import Optional

from app.models.usuarios import Usuario
from app.models.associations import usuario_roles
from app.models.main_models import Rol


def get_user_by_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_rol_by_nombre(db: Session, nombre_rol: str) -> Optional[Rol]:
    return db.query(Rol).filter(Rol.nombre_rol == nombre_rol).first()


def get_user_role_name(db: Session, id_usuario: str) -> str:
    """Rastrea el rol del usuario cruzando la tabla asociativa."""
    rol_record = db.query(usuario_roles).filter(usuario_roles.c.id_usuario == id_usuario).first()
    if rol_record:
        rol_obj = db.query(Rol).filter(Rol.id_rol == rol_record.id_rol).first()
        if rol_obj:
            return rol_obj.nombre_rol
    return "mentee"  # Fallback por defecto .-.

def create_user(db: Session, email: str, hashed_password: str, id_rol) -> Usuario:
    """Persistencia: INSERT en usuarios y usuario_roles (una transacción)."""
    new_user = Usuario(email=email, password=hashed_password)
    db.add(new_user)
    try:
        db.flush()
        db.execute(
            insert(usuario_roles).values(id_usuario=new_user.id_usuario, id_rol=id_rol)
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(new_user)
    return new_user