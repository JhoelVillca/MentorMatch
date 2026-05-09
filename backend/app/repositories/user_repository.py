from sqlalchemy.orm import Session
from app.models.usuarios import Usuario
from app.models.associations import usuario_roles
from app.models.main_models import Rol

def get_user_by_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()

def get_user_role_name(db: Session, id_usuario: str) -> str:
    """Rastrea el rol del usuario cruzando la tabla asociativa."""
    rol_record = db.query(usuario_roles).filter(usuario_roles.c.id_usuario == id_usuario).first()
    if rol_record:
        rol_obj = db.query(Rol).filter(Rol.id_rol == rol_record.id_rol).first()
        if rol_obj:
            return rol_obj.nombre_rol
    return "mentee"  # Fallback por defecto .-.

def create_user(db: Session, email: str, hashed_password: str) -> Usuario:
    new_user = Usuario(email=email, password=hashed_password)
    db.add(new_user)
    db.commit()     
    db.refresh(new_user) 
    return new_user