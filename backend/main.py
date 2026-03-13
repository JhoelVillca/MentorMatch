from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from database import engine, SessionLocal
import models, schemas, security 
from fastapi.middleware.cors import CORSMiddleware

# Construye las tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mentor Match API", version="0.1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # El puerto por defecto de Vite/React
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Permite cualquier cabecera (incluyendo nuestro Authorization Bearer)
)

# El escáner de retina apunta al endpoint /token
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
        raise HTTPException(status_code=400, detail="El correo ya está en la base de datos.")
    
    # Trituradora activada: transformamos "cajita" en un hash irreversible
    hashed_pwd = security.get_password_hash(user.password)
    
    new_user = models.User(
        email=user.email, 
        full_name=user.full_name, 
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Usuario asegurado", "user_id": new_user.id}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Buscamos al usuario por correo
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Verificamos que el hash coincida con la contraseña introducida
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Credenciales incorrectas. Inténtalo de nuevo.", 
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 3. Forjamos el pasaporte digital con su correo adentro (el campo "sub" es el estándar)
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # 1. Rompemos el sello del token usando la clave secreta
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="El token no tiene un correo válido.")
    except Exception:
        raise HTTPException(status_code=401, detail="Token corrupto o expirado. Largo de aquí.")
    
    # 2. Buscamos el correo decodificado en la base de datos
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario fantasma no encontrado.")
    
    # 3. Escupimos los datos reales 
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role  # <-- Aquí está la magia. 'mentee', 'mentor' o 'admin'
    }