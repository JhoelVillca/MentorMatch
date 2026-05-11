from typing import Optional
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import ALGORITHM, SECRET_KEY
from app.db.database import get_db
from app.models.usuarios import Usuario
from app.repositories.user_repository import get_user_role_name

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_mentor_user_id(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
) -> str:
    role = get_user_role_name(db, str(current_user.id_usuario))
    if role not in ["mentor", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a este recurso")
    return current_user.id_usuario


def get_current_mentee_user_id(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    role = get_user_role_name(db, str(current_user.id_usuario))
    if role not in ["mentee", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a este recurso",
        )
    return current_user.id_usuario


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_id = get_current_user_id(token)
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    user = db.query(Usuario).filter(Usuario.id_usuario == uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user