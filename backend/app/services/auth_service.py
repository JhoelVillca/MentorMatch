from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import user_repository
from app.core import security
from app.schemas.user import UserCreate

ESTADOS_BLOQUEADOS = {"suspendido", "baneado", "inactivo"}


async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict:
    user = await user_repository.get_user_by_email(db, email)

    if not user or not security.verify_password(password, user.password):
        return None

    if user.estado_cuenta in ESTADOS_BLOQUEADOS:
        raise ValueError("Cuenta bloqueada.")

    rol_name = await user_repository.get_user_role_name(db, str(user.id_usuario))

    access_token = security.create_access_token(
        data={"sub": str(user.id_usuario), "rol": rol_name}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": rol_name,
    }


async def register_new_user(db: AsyncSession, user_data: UserCreate):
    if await user_repository.get_user_by_email(db, user_data.email):
        raise ValueError("Ese correo ya esta registrado.")

    hashed_pwd = security.get_password_hash(user_data.password)
    return await user_repository.create_user(db, user_data.email, hashed_pwd, user_data.rol)