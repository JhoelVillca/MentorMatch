from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# fomaato: postgresql://usuario:contraseña@servidor:puerto/nombre_base_datos
# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:123456@localhost:5432/mentormatch"
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost/mentormatch"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()