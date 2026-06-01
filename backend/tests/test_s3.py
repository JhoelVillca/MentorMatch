import pytest
import os
import boto3
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from moto import mock_aws

from app.core.s3_client import generate_presigned_post, get_public_url
from app.api.deps import get_current_mentor_user_id, get_current_mentee_user_id
from app.repositories import mentor_repository
from app.models.main_models import PerfilMentor
from main import app

@mock_aws
def test_generate_presigned_post_returns_correct_shape(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "fake-key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "fake-secret")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "mentormatch-media")
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)

    s3 = boto3.client("s3", region_name="us-east-1")
    s3.create_bucket(Bucket="mentormatch-media")

    user_id = str(uuid4())
    result = generate_presigned_post(user_id, "png")

    assert "upload_url" in result
    assert "fields" in result
    assert "object_key" in result
    assert result["object_key"] == f"perfiles/{user_id}/foto.png"
    assert result["expires_in"] == 60
    assert result["fields"]["Content-Type"] == "image/*"


def test_get_public_url_prod(monkeypatch):
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "mentormatch-media")
    monkeypatch.setenv("AWS_REGION", "us-west-2")
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)

    url = get_public_url("perfiles/123/foto.jpg")
    assert url == "https://mentormatch-media.s3.us-west-2.amazonaws.com/perfiles/123/foto.jpg"


def test_get_public_url_minio(monkeypatch):
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "mentormatch-media")
    monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:9000")

    url = get_public_url("perfiles/123/foto.jpg")
    assert url == "http://localhost:9000/mentormatch-media/perfiles/123/foto.jpg"


@pytest.mark.asyncio
async def test_get_mentor_upload_url_endpoint(monkeypatch):
    with mock_aws():
        # Setup de env vars para S3
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "fake-key")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "fake-secret")
        monkeypatch.setenv("AWS_REGION", "us-east-1")
        monkeypatch.setenv("AWS_S3_BUCKET_NAME", "mentormatch-media")
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)

        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket="mentormatch-media")

        user_uuid = uuid4()
        
        # Overrides para autenticacion
        app.dependency_overrides[get_current_mentor_user_id] = lambda: user_uuid
        
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/profiles/mentor/me/upload-url", params={"ext": "png"})
        
        app.dependency_overrides.clear()
        
        assert response.status_code == 200
        payload = response.json()
        assert "upload_url" in payload
        assert "fields" in payload
        assert payload["object_key"] == f"perfiles/{user_uuid}/foto.png"


@pytest.mark.asyncio
async def test_update_mentor_foto_url_segura_y_rechazo(monkeypatch):
    # Setup env
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "mentormatch-media")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)

    user_uuid = uuid4()
    
    # 1. URL Autorizada del propio bucket del usuario
    url_autorizada = f"https://mentormatch-media.s3.us-east-1.amazonaws.com/perfiles/{user_uuid}/foto.jpg"
    
    # 2. URL Maliciosa externa
    url_maliciosa = "https://sitio-malicioso.com/perfiles/alguien/foto.jpg"

    # Mock del repositorio
    mock_perfil = PerfilMentor(
        id_usuario=user_uuid,
        nombre_completo="Juan Perez",
        biografia_profesional="Mentor",
        foto_perfil=url_autorizada
    )
    
    monkeypatch.setattr(
        mentor_repository,
        "update_foto_perfil",
        AsyncMock(return_value=mock_perfil)
    )

    app.dependency_overrides[get_current_mentor_user_id] = lambda: user_uuid
    
    transport = ASGITransport(app=app)
    
    # Test A: Intento con URL maliciosa externa -> debe fallar con 422
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_fail = await client.patch(
            "/profiles/mentor/me/foto",
            json={"foto_url": url_maliciosa}
        )
    assert res_fail.status_code == 422
    assert res_fail.json()["detail"] == "URL no pertenece al bucket autorizado"

    # Test B: Intento con URL valida -> debe pasar (200)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_ok = await client.patch(
            "/profiles/mentor/me/foto",
            json={"foto_url": url_autorizada}
        )
    assert res_ok.status_code == 200
    assert res_ok.json()["foto_perfil"] == url_autorizada
    
    app.dependency_overrides.clear()


def test_s3_client_startup_validation_raises_error_in_production(monkeypatch):
    import importlib
    import app.core.s3_client
    
    monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:9000")
    monkeypatch.setenv("ENVIRONMENT", "production")
    
    with pytest.raises(RuntimeError) as exc_info:
        importlib.reload(app.core.s3_client)
        
    assert str(exc_info.value) == "AWS_ENDPOINT_URL no debe estar configurada en produccion"
