from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api import auth, admin, profiles, skills, paquetes 
from app.models import usuarios, main_models


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MentorMatch API",
    description="Protocolo de enlace para la red de mentorías Sis324",
    version="0.2.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(profiles.router)
app.include_router(skills.router) 

app.include_router(paquetes.router, prefix="/api/paquetes", tags=["Paquetes"])

@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "MentorMatch listo para peticiones.",
        "docs": "/docs"
    }