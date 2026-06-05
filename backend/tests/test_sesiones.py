from datetime import datetime, timezone, time
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID

import pytest

from app.models.main_models import DisponibilidadMentor, Sesion
from app.schemas.sesion_schema import AgendarSesionRequest
from app.services.sesion_service import SesionService


class MockResult:
    def __init__(self, first_value=None, all_value=None):
        self._first_value = first_value
        self._all_value = all_value if all_value is not None else ([] if first_value is None else [first_value])

    def scalars(self):
        return self

    def first(self):
        return self._first_value

    def all(self):
        return self._all_value


@pytest.mark.asyncio
async def test_agendar_sesion_double_booking_levanta_error(mock_db_session, monkeypatch):
    service = SesionService(mock_db_session)

    mentee = SimpleNamespace(id_mentee=UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
    contrato = SimpleNamespace(
        id_contrato=UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        id_paquete=UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        id_mentee=mentee.id_mentee,
        estado_contrato="activo",
        horas_consumidas=0,
    )
    paquete = SimpleNamespace(
        id_paquete=contrato.id_paquete,
        id_mentor=UUID("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        cantidad_horas_totales=10,
    )

    disponibilidad = DisponibilidadMentor()
    disponibilidad.id_mentor = paquete.id_mentor
    disponibilidad.dia_semana = 1
    disponibilidad.hora_inicio_utc = time(10, 0)
    disponibilidad.hora_fin_utc = time(12, 0)

    sesion_existente = Sesion()
    sesion_existente.id_sesion = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

    mock_db_session.execute = AsyncMock(
        side_effect=[
            MockResult(first_value=paquete),
            MockResult(first_value=disponibilidad),
            MockResult(first_value=sesion_existente),
        ]
    )

    monkeypatch.setattr(service, "_get_mentee_or_raise", AsyncMock(return_value=mentee))
    monkeypatch.setattr(service, "_get_contrato_activo_or_raise", AsyncMock(return_value=contrato))

    req = AgendarSesionRequest(
        id_contrato=contrato.id_contrato,
        fecha_hora_inicio_utc=datetime(2026, 6, 1, 10, 30, tzinfo=timezone.utc),
        fecha_hora_fin_utc=datetime(2026, 6, 1, 11, 30, tzinfo=timezone.utc),
    )

    with pytest.raises(FileExistsError, match="Double-booking interceptado"):
        await service.agendar_sesion(UUID("ffffffff-ffff-ffff-ffff-ffffffffffff"), req)

    assert mock_db_session.rollback.await_count == 1