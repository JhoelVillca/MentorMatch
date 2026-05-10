import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt  # Usando PyJWT como los dioses de la terminal mandan
from passlib.context import CryptContext
from dotenv import load_dotenv

# 1. Cargamos el archivo físico a la RAM
load_dotenv()

# 2. Ahora leemos las llaves
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

if not SECRET_KEY:
    raise ValueError("Falta la SECRET_KEY en las variables de entorno. Revisa tu .env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # PyJWT genera directamente un string en las versiones modernas
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)