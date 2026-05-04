from pydantic import BaseModel

class PaqueteCreate(BaseModel):
    titulo_paquete: str
    cantidad_horas_totales: int
    precio_total: float

@router.post("/")
def crear_paquete(paquete: PaqueteCreate):
    # Aquí va la lógica para insertar en la tabla Paquetes_Mentor
    return {"mensaje": "Paquete creado con éxito"}

@router.get("/me")
def listar_mis_paquetes():
    # Filtra en la DB usando el id_mentor del usuario logueado
    return {"paquetes": []}

@router.patch("/{id_paquete}/estado")
def toggle_paquete(id_paquete: int):
    # Cambia el campo 'estado_activo' en la base de datos
    return {"mensaje": "Estado actualizado"}