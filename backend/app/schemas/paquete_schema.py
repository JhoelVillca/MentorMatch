from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PaqueteBase(BaseModel):
    titulo_paquete: str = Field(..., example="Pack Inicial 5 Horas")
    cantidad_horas_totales: int = Field(..., gt=0, example=5)
    precio_total: Decimal = Field(..., ge=0, example=150.00)

class PaqueteCreate(PaqueteBase):
    pass

class PaqueteUpdate(BaseModel):
    estado_activo: bool

class PaqueteOut(PaqueteBase):
    id_paquete: UUID
    id_mentor: UUID
    estado_activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True