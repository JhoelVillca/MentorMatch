from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
# 1. Agregamos "paquetes" a la importación de la API
from app.api import auth, admin, profiles, paquetes 
from app.models import usuarios, main_models 

# Creamos las tablas en la DB
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MentorMatch API",
    description="Protocolo de enlace para la red de mentorías Sis324",
    version="0.2.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Módulos de la API
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(profiles.router)
# 2. Registramos el nuevo módulo de paquetes para la Tarea B
app.include_router(paquetes.router, prefix="/api/paquetes", tags=["Paquetes"])

@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "MentorMatch listo para peticiones.",
        "docs": "/docs"
    }