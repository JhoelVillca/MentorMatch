from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    token_data = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not token_data:
        # None (Dominio) -> 401 (HTTP)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        new_user = auth_service.register_user(db, user)
        return new_user
    except ValueError as e:
        # ValueError (Dominio) -> 400 (HTTP)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )