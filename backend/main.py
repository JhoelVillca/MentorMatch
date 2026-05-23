import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import paquetes, auth, admin, profiles, skills, disponibilidad, contratos, sesiones
from app.models import usuarios, main_models


app = FastAPI(
    title="MentorMatch API",
    description="Protocolo de enlace para la red de mentorías Sis324",
    version="0.2.0"
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://mentormatch-ui-fwl1.onrender.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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