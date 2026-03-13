from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), default="mentee") # Roles: admin, mentor, mentee
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Datos de Contacto
    phone = Column(String(50), nullable=True)
    skype_id = Column(String(100), nullable=True)
    
    # Preferencias de Sistema
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="es")
    currency = Column(String(10), default="USD")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())