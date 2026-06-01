from uuid import UUID

import pytest
from unittest.mock import AsyncMock

from httpx import ASGITransport, AsyncClient

from app.db.database import get_db
from app.services import profile_service
from main import app


@pytest.fixture(autouse=True)
def override_db_dependency(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_public_mentor_profile_returns_200(mock_db_session, monkeypatch):
    mentor_id = UUID("11111111-1111-1111-1111-111111111111")
    expected_payload = {
        "nombre_completo": "Mentor Publico",
        "biografia_profesional": "Especialista en arquitectura de software",
        "url_linkedin": "https://linkedin.com/in/mentor-publico",
        "url_video_presentacion": "https://video.example.com/presentacion",
        "foto_perfil": "https://images.example.com/mentor.png",
    }

    monkeypatch.setattr(
        profile_service,
        "get_public_mentor_profile",
        AsyncMock(return_value=expected_payload),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(f"/profiles/mentor/{mentor_id}")

    assert response.status_code == 200
    assert response.json() == expected_payload


@pytest.mark.asyncio
async def test_get_public_mentor_profile_returns_404_when_missing(mock_db_session, monkeypatch):
    mentor_id = UUID("22222222-2222-2222-2222-222222222222")

    monkeypatch.setattr(
        profile_service,
        "get_public_mentor_profile",
        AsyncMock(return_value=None),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(f"/profiles/mentor/{mentor_id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Mentor no encontrado"