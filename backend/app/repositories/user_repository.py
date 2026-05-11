from typing import List, Dict, Any
from sqlalchemy import insert, func
from sqlalchemy.orm import Session

from app.models.associations import usuario_roles
from app.models.main_models import Rol
from app.models.usuarios import Usuario


def get_user_by_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_all_users_with_roles(db: Session) -> List[Dict[str, Any]]:
    """
    Obtiene todos los usuarios con su email, fecha de creación, estado de cuenta y rol.
    Realiza un JOIN entre usuarios, usuario_roles y roles para obtener la información completa.
    """
    # Consulta que obtiene todos los usuarios con sus roles
    # Usamos outerjoin para incluir usuarios sin rol (aunque no debería pasar)
    query = db.query(
        Usuario.id_usuario,
        Usuario.email,
        Usuario.estado_cuenta,
        Usuario.fecha_creacion,
        func.array_agg(Rol.nombre_rol).label('roles')
    ).outerjoin(
        usuario_roles, Usuario.id_usuario == usuario_roles.c.id_usuario
    ).outerjoin(
        Rol, usuario_roles.c.id_rol == Rol.id_rol
    ).group_by(
        Usuario.id_usuario,
        Usuario.email,
        Usuario.estado_cuenta,
        Usuario.fecha_creacion
    ).all()
    
    return query


def get_user_role_name(db: Session, id_usuario: str) -> str:
    """Rastrea el rol del usuario cruzando la tabla asociativa."""
    rol_record = db.query(usuario_roles).filter(usuario_roles.c.id_usuario == id_usuario).first()
    if rol_record:
        rol_obj = db.query(Rol).filter(Rol.id_rol == rol_record.id_rol).first()
        if rol_obj:
            return rol_obj.nombre_rol
    return "mentee"  # Fallback por defecto .-.


def create_user(
    db: Session,
    email: str,
    hashed_password: str,
    nombre_rol: str = "mentee",
) -> Usuario:
    """Persiste usuario y fila en Usuario_Roles dentro de una transacción."""
    rol = db.query(Rol).filter(Rol.nombre_rol == nombre_rol).first()
    if not rol:
        raise ValueError(f"No existe el rol '{nombre_rol}'.")

    new_user = Usuario(email=email, password=hashed_password)
    db.add(new_user)
    db.flush()

    db.execute(
        insert(usuario_roles).values(
            id_usuario=new_user.id_usuario,
            id_rol=rol.id_rol,
        )
    )
    db.commit()
    db.refresh(new_user)
    return new_user