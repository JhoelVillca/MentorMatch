import os
from typing import Optional
from uuid import UUID
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import ALGORITHM, SECRET_KEY
from app.db.database import get_db
from app.models.usuarios import Usuario
from app.repositories.user_repository import get_user_role_name

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_token(request: Request, bearer_token: Optional[str] = Depends(oauth2_scheme)) -> str:
    # Intento 1: ¿Vino en la cabecera (Tu nuevo parche del frontend)?
    if bearer_token:
        return bearer_token
        
    # Intento 2: ¿Vino en la Cookie (El sistema antiguo)?
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
        
    # Si no hay ninguno de los dos, patada en la puerta
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado"
    )

def get_current_user_id(token: str = Depends(get_token)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas o expiradas")

async def get_current_user(token: str = Depends(get_token), db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(token)
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token malformado")
    
    result = await db.execute(select(Usuario).filter(Usuario.id_usuario == uid))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario inexistente")
    
    if user.estado_cuenta != 'activo':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Cuenta inhabilitada. Estado actual: {user.estado_cuenta}"
        )
        
    return user

from app.models.main_models import PerfilMentor, PerfilMentee

async def get_current_mentor_user_id(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> str:
    role = await get_user_role_name(db, str(current_user.id_usuario))
    if role == "admin":
        return current_user.id_usuario
        
    result = await db.execute(select(PerfilMentor).filter(PerfilMentor.id_usuario == current_user.id_usuario))
    if not result.scalars().first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado: Necesitas perfil de Mentor")
        
    return current_user.id_usuario

async def get_current_mentee_user_id(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> str:

    role = await get_user_role_name(db, str(current_user.id_usuario))
    if role == "admin":
        return current_user.id_usuario
        
    result = await db.execute(select(PerfilMentee).filter(PerfilMentee.id_usuario == current_user.id_usuario))
    if not result.scalars().first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado: Necesitas perfil de Alumno")
        
    return current_user.id_usuario