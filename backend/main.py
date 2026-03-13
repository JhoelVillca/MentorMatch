from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from database import engine, SessionLocal
import models, schemas, security 
from fastapi.middleware.cors import CORSMiddleware

# Inicialización de las tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mentor Match API", version="0.1.1")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Puerto por defecto de Vite/React
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Configuración del esquema de autenticación OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
    
    # Generar el hash de la contraseña por seguridad
    hashed_pwd = security.get_password_hash(user.password)
    
    new_user = models.User(
        email=user.email, 
        full_name=user.full_name, 
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Usuario creado exitosamente", "user_id": new_user.id}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Buscar al usuario por correo electrónico
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Verificar que la contraseña coincida con el hash almacenado
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Credenciales de acceso incorrectas.", 
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 3. Generar el token de acceso JWT con el correo del usuario
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # 1. Decodificar el token JWT usando la clave secreta
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="El token proporcionado carece de un identificador de usuario válido.")
    except Exception:
        raise HTTPException(status_code=401, detail="El token es inválido o ha expirado.")
    
    # 2. Buscar al usuario en la base de datos
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    # 3. Retornar los datos del usuario
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role  # Rol del usuario: 'mentee', 'mentor' o 'admin'
    }


@app.post("/users/me/mentor-profile", response_model=schemas.MentorProfile)
def create_mentor_profile(
    profile: schemas.MentorProfileCreate, 
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    # 1. Decodificar el token para identificar al usuario solicitante
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="El token es inválido o ha expirado.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # 2. Verificar la existencia previa del perfil
    db_profile = db.query(models.MentorProfile).filter(models.MentorProfile.user_id == user.id).first()

    if db_profile:
        # Actualizar perfil existente
        db_profile.bio = profile.bio
        db_profile.skills = profile.skills
        db_profile.price_per_hour = profile.price_per_hour
    else:
        # Crear nuevo perfil
        db_profile = models.MentorProfile(
            **profile.model_dump(), 
            user_id=user.id
        )
        db.add(db_profile)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile


@app.get("/admin/users", response_model=list[schemas.UserResponse])
def get_all_users(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # 1. Verificar la identidad del solicitante
    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    email: str = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    # 2. Validar que el usuario posea privilegios de administrador
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Nivel de autorización insuficiente.")
    
    # 3. Retornar la lista de todos los usuarios
    return db.query(models.User).all()

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # 1. Verificar la autorización del administrador
    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    admin_user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de administrador.")
    
    # 2. Buscar al usuario objetivo en el sistema
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    # 3. Eliminar el registro de la base de datos
    db.delete(target_user)
    db.commit()
    return {"message": f"El usuario {target_user.email} ha sido eliminado exitosamente del sistema."}