import logging
import os
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"


async def crear_sala_video(expiracion_dt: datetime) -> str:
    """Crea una sala en Daily.co y devuelve la URL publica."""
    if not DAILY_API_KEY:
        raise RuntimeError("DAILY_API_KEY no esta configurada. Integracion de video inactiva.")

    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "properties": {
            "exp": int(expiracion_dt.timestamp()),
            "eject_at_room_exp": True,
            "enable_prejoin_ui": False,
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DAILY_API_URL}/rooms",
                headers=headers,
                json=payload,
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json().get("url")
        except httpx.HTTPStatusError as e:
            logger.error("Error de API Daily: %s", e.response.text)
            raise RuntimeError("Fallo al comunicarse con el proveedor de video.")
        except Exception as e:
            logger.error("Error de red con Daily: %s", str(e))
            raise RuntimeError("Servicio de video no disponible temporalmente.")


async def crear_meeting_token(
    room_name: str,
    user_name: str,
    expiracion_dt: datetime,
    is_owner: bool = False,
) -> str:
    """Genera un meeting token de Daily.co con nombre pre-configurado.

    Esto evita que Daily.co muestre la pantalla de 'prejoin' pidiendo nombre.
    El participante entra directamente a la sala con su identidad ya seteada.
    """
    if not DAILY_API_KEY:
        raise RuntimeError("DAILY_API_KEY no esta configurada.")

    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": user_name,
            "exp": int(expiracion_dt.timestamp()),
            "is_owner": is_owner,
            "enable_prejoin_ui": False,
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DAILY_API_URL}/meeting-tokens",
                headers=headers,
                json=payload,
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json().get("token")
        except httpx.HTTPStatusError as e:
            logger.error("Error generando meeting token: %s", e.response.text)
            raise RuntimeError("Fallo al generar token de videollamada.")
        except Exception as e:
            logger.error("Error de red generando meeting token: %s", str(e))
            raise RuntimeError("Servicio de video no disponible temporalmente.")