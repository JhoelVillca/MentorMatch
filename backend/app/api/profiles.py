from fastapi import APIRouter

router = APIRouter(prefix="/profiles", tags=["Perfiles"])

# El router es tu mini-aplicación.
@router.get("/mentee/me")
def get_mentee_profile():
    return {"detail": "Espacio reservado para lógica de Mentee. Pendiente de implementación."}

@router.get("/mentor/me")
def get_mentor_profile():
    return {"detail": "Espacio reservado para lógica de Mentor. Pendiente de implementación."}