from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.db.database import get_db
from app.services.paquete_service import PaqueteService
from main import app


@pytest.fixture(autouse=True)
def override_db_dependency(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_paquetes_disponibles_returns_200(mock_db_session, monkeypatch):
    paquete = {
        "id_paquete": "11111111-1111-1111-1111-111111111111",
        "id_mentor": "22222222-2222-2222-2222-222222222222",
        "titulo_paquete": "Mentoria Python",
        "cantidad_horas_totales": 10,
        "precio_total": 150.0,
        "mentor_nombre": "Mentor Publico",
        "mentor_foto": "https://images.example.com/mentor.png",
        "calificacion_promedio": 4.8,
    }

    monkeypatch.setattr(
        PaqueteService,
        "listar_paquetes_disponibles",
        AsyncMock(return_value=[paquete]),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/paquetes/disponibles")

    payload = response.json()
    assert response.status_code == 200
    assert len(payload) == 1
    assert payload[0]["id_paquete"] == paquete["id_paquete"]
    assert payload[0]["titulo_paquete"] == paquete["titulo_paquete"]
    assert float(payload[0]["precio_total"]) == paquete["precio_total"]
    assert float(payload[0]["calificacion_promedio"]) == paquete["calificacion_promedio"]


@pytest.mark.asyncio
async def test_buscar_paquetes_returns_200(mock_db_session, monkeypatch):
    paquete = {
        "id_paquete": "33333333-3333-3333-3333-333333333333",
        "id_mentor": "44444444-4444-4444-4444-444444444444",
        "titulo_paquete": "Python avanzado",
        "cantidad_horas_totales": 8,
        "precio_total": 120.0,
        "mentor_nombre": "Mentora Publica",
        "mentor_foto": "https://images.example.com/mentora.png",
        "calificacion_promedio": 5.0,
    }

    search_mock = AsyncMock(return_value=[paquete])
    monkeypatch.setattr(PaqueteService, "buscar_paquetes", search_mock)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/paquetes/buscar", params={"q": "python"})

    payload = response.json()
    assert response.status_code == 200
    assert len(payload) == 1
    assert payload[0]["id_paquete"] == paquete["id_paquete"]
    assert payload[0]["titulo_paquete"] == paquete["titulo_paquete"]
    assert float(payload[0]["precio_total"]) == paquete["precio_total"]
    assert float(payload[0]["calificacion_promedio"]) == paquete["calificacion_promedio"]
    search_mock.assert_awaited_once_with("python", None, None, None)


@pytest.mark.asyncio
async def test_buscar_paquetes_returns_404_when_service_raises(mock_db_session, monkeypatch):
    monkeypatch.setattr(
        PaqueteService,
        "buscar_paquetes",
        AsyncMock(side_effect=HTTPException(status_code=404, detail="Paquete no encontrado")),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/paquetes/buscar", params={"q": "python"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Paquete no encontrado"