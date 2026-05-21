from pydantic import BaseModel
from typing import Literal

class UserStatusUpdate(BaseModel):
    estado: Literal["activo", "suspendido", "baneado", "inactivo"]