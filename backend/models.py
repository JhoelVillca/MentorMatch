from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="mentee")

    # Esta línea es nueva, para que el usuario sepa si es mentor
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    bio = Column(Text)
    skills = Column(String)
    price_per_hour = Column(Float, default=0.0)

    user = relationship("User", back_populates="mentor_profile")