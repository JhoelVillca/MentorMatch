from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_mentee_user_id
from app.db.database import get_db
from app.models.main_models import PerfilMentee
from app.schemas.mentee_profile import MenteeProfileOut, MenteeProfileUpsert

router = APIRouter(prefix="/profiles", tags=["Perfiles"])


@router.get("/mentee/me", response_model=MenteeProfileOut)
def get_my_mentee_profile(
    user_id: str = Depends(get_current_mentee_user_id),
    db: Session = Depends(get_db),
):
    uid = UUID(user_id)
    profile = db.query(PerfilMentee).filter(PerfilMentee.id_usuario == uid).first()
    if not profile:
        return MenteeProfileOut(
            id_mentee=None,
            nombre_completo="",
            zona_horaria_preferida="UTC",
            biografia_corta=None,
        )
    return MenteeProfileOut(
        id_mentee=profile.id_mentee,
        nombre_completo=profile.nombre_completo,
        zona_horaria_preferida=profile.zona_horaria_preferida or "UTC",
        biografia_corta=profile.biografia_corta,
    )


@router.put("/mentee/me", response_model=MenteeProfileOut, status_code=status.HTTP_200_OK)
def upsert_my_mentee_profile(
    body: MenteeProfileUpsert,
    user_id: str = Depends(get_current_mentee_user_id),
    db: Session = Depends(get_db),
):
    uid = UUID(user_id)
    profile = db.query(PerfilMentee).filter(PerfilMentee.id_usuario == uid).first()
    tz = (body.zona_horaria_preferida or "UTC").strip() or "UTC"
    nombre = body.nombre_completo.strip()
    bio = body.biografia_corta.strip() if body.biografia_corta else None

    if profile:
        profile.nombre_completo = nombre
        profile.zona_horaria_preferida = tz
        profile.biografia_corta = bio
    else:
        profile = PerfilMentee(
            id_usuario=uid,
            nombre_completo=nombre,
            zona_horaria_preferida=tz,
            biografia_corta=bio,
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return MenteeProfileOut(
        id_mentee=profile.id_mentee,
        nombre_completo=profile.nombre_completo,
        zona_horaria_preferida=profile.zona_horaria_preferida or "UTC",
        biografia_corta=profile.biografia_corta,
    )


@router.get("/mentor/me")
def get_mentor_profile():
    return {"detail": "Espacio reservado para lógica de Mentor. Pendiente de implementación."}
