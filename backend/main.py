from fastapi import FastAPI
from app.api import paquetes
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, admin, profiles, skills, disponibilidad # Importaremos estos a continuación
from app.models import usuarios, main_models # Carga los modelos para SQLAlchemy
from app.api import contratos
from app.api import sesiones


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
app.include_router(skills.router)
app.include_router(paquetes.router)
app.include_router(disponibilidad.router)
app.include_router(contratos.router)
app.include_router(sesiones.router)

@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "MentorMatch listo para peticiones.",
        "docs": "/docs"
    }