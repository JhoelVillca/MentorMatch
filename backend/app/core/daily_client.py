import os
import httpx
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"

async def crear_sala_video(expiracion_dt: datetime) -> str:
    """
    Crea una sala efimera en Daily.co.
    Lanza RuntimeError si el proveedor falla, protegiendo la transaccion de la bd
    """
    if not DAILY_API_KEY:
        raise RuntimeError("DAILY_API_KEY no esta configurada. Integracion de video inactiva.")
        
    exp_unix = int(expiracion_dt.timestamp())
    
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "properties": {
            "exp": exp_unix,
            "eject_at_room_exp": True 
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DAILY_API_URL}/rooms",
                headers=headers,
                json=payload,
                timeout=10.0 
            )
            response.raise_for_status()
            data = response.json()
            return data.get("url")
        except httpx.HTTPStatusError as e:
            logger.error(f"Error de API Daily: {e.response.text}")
            raise RuntimeError("Fallo al comunicarse con el proveedor de video.")
        except Exception as e:
            logger.error(f"Error de red con Daily: {str(e)}")
            raise RuntimeError("Servicio de video no disponible temporalmente.")