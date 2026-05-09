from sqlalchemy.orm import Session
from app.repositories import user_repository
from app.core import security
from app.schemas.user import UserCreate

def authenticate_user(db: Session, email: str, password: str) -> dict:
    user = user_repository.get_user_by_email(db, email)
    
    # para mitigar el timing
    if not user or not security.verify_password(password, user.password):
        return None  # Retornamos nulo, la capa HTTP va decidir que hacer
    
    # Lectura de roles
    rol_name = user_repository.get_user_role_name(db, str(user.id_usuario))
    
    # JWT
    access_token = security.create_access_token(
        data={"sub": str(user.id_usuario), "rol": rol_name}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": rol_name
    }

def register_user(db: Session, user_data: UserCreate):
    existing_user = user_repository.get_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError("Ese correo ya esta registrado.")
        
    hashed_pwd = security.get_password_hash(user_data.password)
    return user_repository.create_user(db, user_data.email, hashed_pwd)