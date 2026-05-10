from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AdminUserRow(BaseModel):
    email: EmailStr
    rol: str = Field(description="Roles del usuario (texto agregado)")
    estado_cuenta: str
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True
