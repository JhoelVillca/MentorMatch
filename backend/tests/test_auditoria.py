from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.main_models import AuditoriaAdministrativa
from app.services.auditoria_service import AuditoriaService


@pytest.mark.asyncio
async def test_registrar_evento_agrega_a_sesion():
    db_mock = AsyncMock()
    db_mock.add = MagicMock()

    AuditoriaService.registrar_evento(
        db_mock,
        id_usuario=1,
        entidad_afectada="Prueba",
        id_entidad="100",
        accion="TEST_ACCION",
        detalles_cambio={"foo": "bar"},
    )

    assert db_mock.add.call_count == 1
    assert db_mock.commit.call_count == 0

    auditoria = db_mock.add.call_args[0][0]

    assert isinstance(auditoria, AuditoriaAdministrativa)
    assert auditoria.accion == "TEST_ACCION"
    assert auditoria.id_entidad == "100"
    assert auditoria.entidad_afectada == "Prueba"
    assert auditoria.detalles_cambio == {"foo": "bar"}