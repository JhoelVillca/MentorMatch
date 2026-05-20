from typing import Optional
from uuid import UUID
import jwt
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import ALGORITHM, SECRET_KEY
from app.db.database import get_db
from app.models.usuarios import Usuario
from app.repositories.user_repository import get_user_role_name

def get_token_from_cookie(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token no encontrado")
    return token

def get_current_user_id(token: str = Depends(get_token_from_cookie)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

async def get_current_user(token: str = Depends(get_token_from_cookie), db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(token)
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    
    result = await db.execute(select(Usuario).filter(Usuario.id_usuario == uid))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user

async def get_current_mentor_user_id(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> str:
    role = await get_user_role_name(db, str(current_user.id_usuario))
    if role not in ["mentor", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a este recurso")
    return current_user.id_usuario

async def get_current_mentee_user_id(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    role = await get_user_role_name(db, str(current_user.id_usuario))
    if role not in ["mentee", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a este recurso",
        )
    return current_user.id_usuario