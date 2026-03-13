from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str

class MentorProfileBase(BaseModel):
    bio: str
    skills: str
    price_per_hour: float

class MentorProfileCreate(MentorProfileBase):
    pass

class MentorProfile(MentorProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True # Esto permite que FastAPI lea modelos de la DB


# Añade esto al final de schemas.py
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True

    