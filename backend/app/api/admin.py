from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.usuarios import Usuario
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Administración"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    # Aquí luego agregaremos un verificador de rol Admin real
    return db.query(Usuario).all()

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Sujeto no encontrado en la base de datos")
    db.delete(user)
    db.commit()
    return {"message": f"Usuario {user_id} eliminado del sistema."}