from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models, schemas

# Construye las tablas 
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mentor Match API",
    version="0.1.0"
)

# Dependencia: Abre y cierra la conexión a la base de datos por cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def health_check():
    return {"status": "online"}

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Para buscar si el correo ya existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
    

    fake_hashed_password = user.password + "notreallyhashed"
    
    new_user = models.User(
        email=user.email, 
        full_name=user.full_name, 
        hashed_password=fake_hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # refresh para obtener el ID autogenerado
    
    return {"message": "Usuario creado", "user_id": new_user.id}