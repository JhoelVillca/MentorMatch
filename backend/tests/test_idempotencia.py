import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4, UUID
from fastapi import HTTPException
from app.services.contrato_service import ContratoService
from app.models.main_models import PerfilMentee, PaqueteMentor, PerfilMentor, ContratoMentoria, TransaccionPago
from app.api.webhooks import _handle_checkout_completed, _handle_checkout_expired

class MockStripeSession:
    def __init__(self, id, metadata, amount_total=0, payment_intent=None):
        self.id = id
        self.metadata = metadata
        self.amount_total = amount_total
        self.payment_intent = payment_intent

class MockResult:
    def __init__(self, values):
        self.values = values
        
    def scalars(self):
        return self
        
    def first(self):
        return self.values[0] if self.values else None
        
    def all(self):
        return self.values

def create_mock_db():
    mock_db = AsyncMock()
    
    mock_begin_context = MagicMock()
    mock_begin_context.__aenter__ = AsyncMock()
    mock_begin_context.__aexit__ = AsyncMock()
    
    mock_db.begin = MagicMock(return_value=mock_begin_context)
    return mock_db

@pytest.mark.asyncio
async def test_adquirir_contrato_idempotencia_reutiliza_contrato(monkeypatch):
    # Setup de mocks de base de datos
    mock_db = AsyncMock()
    
    # Perfil Mentee Mock
    mentee_mock = PerfilMentee(id_mentee=uuid4(), id_usuario=uuid4())
    
    # Paquete y Mentor Mock
    paquete_mock = PaqueteMentor(
        id_paquete=uuid4(),
        id_mentor=uuid4(),
        precio_total=100.0,
        estado_activo=True,
        titulo_paquete="Mentoria Avanzada"
    )
    mentor_mock = PerfilMentor(
        id_mentor=paquete_mock.id_mentor,
        estado_verificacion="verificado",
        nombre_completo="Juan Perez"
    )
    
    # Contrato pendiente de pago existente (para probar Busqueda B)
    contrato_pendiente = ContratoMentoria(
        id_contrato=uuid4(),
        id_mentee=mentee_mock.id_mentee,
        id_paquete=paquete_mock.id_paquete,
        estado_contrato="pendiente_pago",
        horas_consumidas=0
    )
    
    # Transaccion previa en estado procesando
    trx_previa = TransaccionPago(
        id_transaccion=uuid4(),
        id_contrato=contrato_pendiente.id_contrato,
        monto_pagado=100.0,
        moneda="USD",
        estado_pago="procesando"
    )

    # Simular las consultas secuenciales de SQLAlchemy
    mock_db.execute.side_effect = [
        MockResult([mentee_mock]), # 1. Buscar mentee
        MagicMock(first=lambda: (paquete_mock, mentor_mock)), # 2. Buscar paquete y mentor
        MockResult([]), # 3. Busqueda A: no hay contrato activo
        MockResult([contrato_pendiente]), # 4. Busqueda B: hay contrato pendiente
        MockResult([trx_previa]), # 5. Buscar transacciones previas en estado procesando
    ]
    
    # Mockear Stripe
    mock_stripe_client = MagicMock()
    mock_stripe_session = MagicMock(id="sess_123", url="https://checkout.stripe.com/pay/sess_123")
    mock_stripe_client.v1.checkout.sessions.create.return_value = mock_stripe_session
    monkeypatch.setattr("app.services.contrato_service._stripe", lambda: mock_stripe_client)
    
    # Ejecutar el servicio de adquisicion de contrato
    service = ContratoService(mock_db)
    result = await service.adquirir_contrato(mentee_mock.id_usuario, paquete_mock.id_paquete)
    
    # Validaciones
    assert result["url_pago"] == "https://checkout.stripe.com/pay/sess_123"
    assert trx_previa.estado_pago == "fallido" # La transaccion vieja debe haber sido cancelada
    
    # Debe haberse agregado la nueva transaccion, pero no un nuevo contrato
    assert mock_db.add.call_count == 1
    args, _ = mock_db.add.call_args
    nueva_trx = args[0]
    assert isinstance(nueva_trx, TransaccionPago)
    assert nueva_trx.id_contrato == contrato_pendiente.id_contrato
    assert nueva_trx.estado_pago == "procesando"


@pytest.mark.asyncio
async def test_webhook_checkout_completed_exitoso(monkeypatch):
    id_trx = uuid4()
    id_cont = uuid4()
    
    session_mock = MockStripeSession(
        id="sess_completed_123",
        metadata={"id_contrato": str(id_cont), "id_transaccion": str(id_trx)},
        amount_total=15000 # 150.00 USD en centavos
    )
    
    trx_mock = TransaccionPago(
        id_transaccion=id_trx,
        id_contrato=id_cont,
        monto_pagado=150.00,
        moneda="USD",
        estado_pago="procesando"
    )
    
    contrato_mock = ContratoMentoria(
        id_contrato=id_cont,
        estado_contrato="pendiente_pago"
    )
    
    # Mockear AsyncSessionLocal context manager
    mock_db = create_mock_db()
    mock_db.execute.side_effect = [
        MockResult([trx_mock]), # Buscar transaccion
        MockResult([contrato_mock]), # Buscar contrato
    ]
    
    mock_async_session_context = MagicMock()
    mock_async_session_context.__aenter__.return_value = mock_db
    mock_async_session_context.__aexit__.return_value = None
    
    monkeypatch.setattr("app.api.webhooks.AsyncSessionLocal", lambda: mock_async_session_context)
    monkeypatch.setattr("app.api.webhooks._extract_receipt_url", lambda session: "https://receipt.url")
    
    # Ejecutar webhook handler
    await _handle_checkout_completed(session_mock)
    
    # Validaciones
    assert trx_mock.estado_pago == "completado"
    assert trx_mock.id_pasarela_externa == "sess_completed_123"
    assert trx_mock.url_recibo_externo == "https://receipt.url"
    assert contrato_mock.estado_contrato == "activo"


@pytest.mark.asyncio
async def test_webhook_checkout_completed_ignora_si_no_esta_procesando(monkeypatch):
    id_trx = uuid4()
    id_cont = uuid4()
    
    session_mock = MockStripeSession(
        id="sess_completed_123",
        metadata={"id_contrato": str(id_cont), "id_transaccion": str(id_trx)},
        amount_total=15000
    )
    
    # La transaccion ya esta en estado fallido (por ejemplo, porque se reintento el pago)
    trx_mock = TransaccionPago(
        id_transaccion=id_trx,
        id_contrato=id_cont,
        monto_pagado=150.00,
        moneda="USD",
        estado_pago="fallido"
    )
    
    mock_db = create_mock_db()
    mock_db.execute.side_effect = [
        MockResult([trx_mock]),
    ]
    
    mock_async_session_context = MagicMock()
    mock_async_session_context.__aenter__.return_value = mock_db
    mock_async_session_context.__aexit__.return_value = None
    
    monkeypatch.setattr("app.api.webhooks.AsyncSessionLocal", lambda: mock_async_session_context)
    monkeypatch.setattr("app.api.webhooks._extract_receipt_url", lambda session: None)
    
    # Ejecutar webhook handler
    await _handle_checkout_completed(session_mock)
    
    # Validacion: no debe haber cambiado el estado_pago de la transaccion
    assert trx_mock.estado_pago == "fallido"


@pytest.mark.asyncio
async def test_webhook_checkout_completed_detecta_alteracion_de_precio(monkeypatch):
    id_trx = uuid4()
    id_cont = uuid4()
    
    # Stripe reporta un pago de 50.00 USD, pero en DB el monto es 150.00 USD (intento de fraude)
    session_mock = MockStripeSession(
        id="sess_completed_123",
        metadata={"id_contrato": str(id_cont), "id_transaccion": str(id_trx)},
        amount_total=5000 # 50.00 USD
    )
    
    trx_mock = TransaccionPago(
        id_transaccion=id_trx,
        id_contrato=id_cont,
        monto_pagado=150.00,
        moneda="USD",
        estado_pago="procesando"
    )
    
    mock_db = create_mock_db()
    mock_db.execute.side_effect = [
        MockResult([trx_mock]),
    ]
    
    mock_async_session_context = MagicMock()
    mock_async_session_context.__aenter__.return_value = mock_db
    mock_async_session_context.__aexit__.return_value = None
    
    monkeypatch.setattr("app.api.webhooks.AsyncSessionLocal", lambda: mock_async_session_context)
    monkeypatch.setattr("app.api.webhooks._extract_receipt_url", lambda session: None)
    
    # Ejecutar webhook handler
    await _handle_checkout_completed(session_mock)
    
    # Validacion: no debe haberse completado la transaccion por la discrepancia de precios
    assert trx_mock.estado_pago == "procesando"


@pytest.mark.asyncio
async def test_webhook_checkout_expired_exitoso(monkeypatch):
    id_trx = uuid4()
    
    session_mock = MockStripeSession(
        id="sess_expired_123",
        metadata={"id_transaccion": str(id_trx)}
    )
    
    trx_mock = TransaccionPago(
        id_transaccion=id_trx,
        id_contrato=uuid4(),
        monto_pagado=100.00,
        moneda="USD",
        estado_pago="procesando"
    )
    
    mock_db = create_mock_db()
    mock_db.execute.side_effect = [
        MockResult([trx_mock]),
    ]
    
    mock_async_session_context = MagicMock()
    mock_async_session_context.__aenter__.return_value = mock_db
    mock_async_session_context.__aexit__.return_value = None
    
    monkeypatch.setattr("app.api.webhooks.AsyncSessionLocal", lambda: mock_async_session_context)
    
    # Ejecutar webhook handler
    await _handle_checkout_expired(session_mock)
    
    # Validaciones
    assert trx_mock.estado_pago == "fallido"
