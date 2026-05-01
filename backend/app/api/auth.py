from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.usuarios import Usuario
from app.models.associations import usuario_roles
from app.models.main_models import Rol
from app.core import security
from app.schemas.user import Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    
    # Rastrear el rol del usuario en la matriz
    rol_record = db.query(usuario_roles).filter(usuario_roles.c.id_usuario == user.id_usuario).first()
    rol_name = "mentee" # Fallback por defecto
    
    if rol_record:
        rol_obj = db.query(Rol).filter(Rol.id_rol == rol_record.id_rol).first()
        if rol_obj:
            rol_name = rol_obj.nombre_rol

    access_token = security.create_access_token(data={"sub": str(user.id_usuario), "rol": rol_name})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": rol_name 
    }

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificamos que el clon no exista
    db_user = db.query(Usuario).filter(Usuario.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La anomalía ya existe: ese correo ya está registrado."
        )

    # 2. Ciframos la contraseña (NUNCA texto plano)
    hashed_pwd = security.get_password_hash(user.password)

    # 3. Ensamblamos y guardamos en Postgres
    new_user = Usuario(email=user.email, password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user