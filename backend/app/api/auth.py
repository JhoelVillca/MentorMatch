import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service
from app.api.deps import get_current_user
from app.repositories.user_repository import get_user_role_name

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

@router.post("/login")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    try:
        token_data = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not token_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    is_prod = os.getenv("ENVIRONMENT") == "production"

    response.set_cookie(
        key="access_token",
        value=token_data["access_token"],
        httponly=True,
        secure=is_prod,
        samesite="none",
        max_age=3600,
        path="/"
    )
    return {"message": "Login exitoso"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logout exitoso"}


@router.get("/me")
async def get_me(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rol = await get_user_role_name(db, str(current_user.id_usuario))
    return {"id": current_user.id_usuario, "rol": rol}


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await auth_service.register_new_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))