from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories import user_repository
from app.core import security
from app.schemas.user import UserCreate


async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict:
    user = await user_repository.get_user_by_email(db, email)
    
    # para mitigar el timing
    if not user or not security.verify_password(password, user.password):
        return None  # Retornamos nulo, la capa HTTP va decidir que hacer
    
    # Lectura de roles
    rol_name = await user_repository.get_user_role_name(db, str(user.id_usuario))
    
    # JWT
    access_token = security.create_access_token(
        data={"sub": str(user.id_usuario), "rol": rol_name}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": rol_name
    }


async def register_new_user(db: AsyncSession, user_data: UserCreate):
    if await user_repository.get_user_by_email(db, user_data.email):
        raise ValueError("Ese correo ya esta registrado.")

    hashed_pwd = security.get_password_hash(user_data.password)
    return await user_repository.create_user(db, user_data.email, hashed_pwd)