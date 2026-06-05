from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services.auth_service import authenticate_user


@pytest.mark.asyncio
async def test_authenticate_user_invalid_credentials_returns_none(mock_db_session, monkeypatch):
    monkeypatch.setattr(
        "app.services.auth_service.user_repository.get_user_by_email",
        AsyncMock(return_value=None),
    )

    result = await authenticate_user(mock_db_session, "noexiste@mentormatch.com", "mala-clave")

    assert result is None


@pytest.mark.asyncio
async def test_authenticate_user_success_returns_token(mock_db_session, monkeypatch):
    user = SimpleNamespace(
        id_usuario="11111111-1111-1111-1111-111111111111",
        password="hashed-password",
        estado_cuenta="activo",
    )

    monkeypatch.setattr(
        "app.services.auth_service.user_repository.get_user_by_email",
        AsyncMock(return_value=user),
    )
    monkeypatch.setattr(
        "app.services.auth_service.user_repository.get_user_role_name",
        AsyncMock(return_value="mentor"),
    )
    monkeypatch.setattr("app.services.auth_service.security.verify_password", lambda password, hashed: True)
    monkeypatch.setattr(
        "app.services.auth_service.security.create_access_token",
        lambda data: "fake-token",
    )

    result = await authenticate_user(mock_db_session, "mentor@mentormatch.com", "clave-correcta")

    assert result == {
        "access_token": "fake-token",
        "token_type": "bearer",
        "role": "mentor",
    }