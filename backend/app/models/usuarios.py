from sqlalchemy import Column, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TIMESTAMP
from app.db.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    # UUID de Postgres
    id_usuario = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        server_default=text("gen_random_uuid()")
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    estado_cuenta = Column(String(20), server_default='activo')
    
    # Manejo del tiempo
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    ultimo_acceso = Column(TIMESTAMP(timezone=True), nullable=True)