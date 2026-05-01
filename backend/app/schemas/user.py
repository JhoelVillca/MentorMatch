from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id_usuario: UUID
    estado_cuenta: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    