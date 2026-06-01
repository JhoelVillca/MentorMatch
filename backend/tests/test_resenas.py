import sys
import os
import asyncio
import unittest
from uuid import uuid4
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.usuarios import Usuario
from app.models.main_models import PerfilMentee, PerfilMentor, PaqueteMentor, ContratoMentoria, ResenaMentor
from app.services.resena_service import ResenaService
from app.services.paquete_service import PaqueteService
from app.schemas.resena_schema import ResenaCreate

class TestResenaService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise ValueError("DATABASE_URL environment variable is missing for the tests.")
        
        # Formatear la URL con el dialecto asyncpg si es necesario
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Crear engine local con NullPool para evitar leaks y caídas de event loops en Windows
        self.engine = create_async_engine(db_url, poolclass=NullPool, echo=False)
        self.session_factory = sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        self.session = self.session_factory()
        # Iniciamos una transacción global para este test
        self.transaction = await self.session.begin()

        # Creamos los registros ficticios necesarios
        self.user_mentee = Usuario(
            email=f"test_mentee_{uuid4()}@mentormatch.com",
            password="hashedpassword123",
            estado_cuenta="activo"
        )
        self.user_mentor = Usuario(
            email=f"test_mentor_{uuid4()}@mentormatch.com",
            password="hashedpassword123",
            estado_cuenta="activo"
        )
        self.session.add_all([self.user_mentee, self.user_mentor])
        await self.session.flush()

        self.mentee = PerfilMentee(
            id_usuario=self.user_mentee.id_usuario,
            nombre_completo="Test Mentee"
        )
        self.mentor = PerfilMentor(
            id_usuario=self.user_mentor.id_usuario,
            nombre_completo="Test Mentor"
        )
        self.session.add_all([self.mentee, self.mentor])
        await self.session.flush()

        self.paquete = PaqueteMentor(
            id_mentor=self.mentor.id_mentor,
            titulo_paquete="Paquete de Prueba",
            cantidad_horas_totales=10,
            precio_total=150.00
        )
        self.session.add(self.paquete)
        await self.session.flush()

        self.contrato = ContratoMentoria(
            id_mentee=self.mentee.id_mentee,
            id_paquete=self.paquete.id_paquete,
            estado_contrato="activo",
            horas_consumidas=2
        )
        self.session.add(self.contrato)
        await self.session.flush()

        self.service = ResenaService(self.session)

    async def asyncTearDown(self):
        # Limpieza ordenada
        try:
            await self.transaction.rollback()
        except Exception:
            pass
        await self.session.close()
        await self.engine.dispose()

    async def test_crear_resena_exitoso(self):
        data = ResenaCreate(
            calificacion_estrellas=5,
            comentario_texto="¡Excelente mentoría de prueba!"
        )
        resena = await self.service.crear_resena(
            user_id=self.user_mentee.id_usuario,
            id_contrato=self.contrato.id_contrato,
            data=data
        )

        self.assertIsNotNone(resena.id_resena)
        self.assertEqual(resena.id_contrato, self.contrato.id_contrato)
        self.assertEqual(resena.calificacion_estrellas, 5)
        self.assertEqual(resena.comentario_texto, "¡Excelente mentoría de prueba!")
        self.assertFalse(resena.reportada)

    async def test_crear_resena_contrato_ajeno_lanza_error(self):
        # Crear otro mentee y otro contrato
        otro_user = Usuario(
            email=f"otro_mentee_{uuid4()}@mentormatch.com",
            password="password",
            estado_cuenta="activo"
        )
        self.session.add(otro_user)
        await self.session.flush()
        
        otro_mentee = PerfilMentee(
            id_usuario=otro_user.id_usuario,
            nombre_completo="Otro Mentee"
        )
        self.session.add(otro_mentee)
        await self.session.flush()
        
        otro_contrato = ContratoMentoria(
            id_mentee=otro_mentee.id_mentee,
            id_paquete=self.paquete.id_paquete,
            estado_contrato="activo",
            horas_consumidas=0
        )
        self.session.add(otro_contrato)
        await self.session.flush()

        data = ResenaCreate(calificacion_estrellas=4)
        
        # El primer mentee intenta reseñar el contrato del segundo mentee
        with self.assertRaises(PermissionError) as context:
            await self.service.crear_resena(
                user_id=self.user_mentee.id_usuario,
                id_contrato=otro_contrato.id_contrato,
                data=data
            )
        self.assertIn("No puedes resenar un contrato que no te pertenece", str(context.exception))

    async def test_crear_resena_estado_invalido_lanza_error(self):
        contrato_pendiente = ContratoMentoria(
            id_mentee=self.mentee.id_mentee,
            id_paquete=self.paquete.id_paquete,
            estado_contrato="pendiente_pago",
            horas_consumidas=0
        )
        self.session.add(contrato_pendiente)
        await self.session.flush()

        data = ResenaCreate(calificacion_estrellas=4)

        with self.assertRaises(ValueError) as context:
            await self.service.crear_resena(
                user_id=self.user_mentee.id_usuario,
                id_contrato=contrato_pendiente.id_contrato,
                data=data
            )
        self.assertIn("Solo se pueden resenar contratos en curso o completados", str(context.exception))

    async def test_crear_resena_duplicada_lanza_error_por_select(self):
        data1 = ResenaCreate(calificacion_estrellas=5, comentario_texto="Reseña 1")
        await self.service.crear_resena(
            user_id=self.user_mentee.id_usuario,
            id_contrato=self.contrato.id_contrato,
            data=data1
        )

        data2 = ResenaCreate(calificacion_estrellas=4, comentario_texto="Reseña 2")
        with self.assertRaises(FileExistsError) as context:
            await self.service.crear_resena(
                user_id=self.user_mentee.id_usuario,
                id_contrato=self.contrato.id_contrato,
                data=data2
            )
        self.assertIn("Ya existe una resena para este contrato", str(context.exception))

    async def test_crear_resena_duplicada_lanza_error_por_integrity(self):
        resena_existente = ResenaMentor(
            id_contrato=self.contrato.id_contrato,
            calificacion_estrellas=5,
            comentario_texto="Reseña existente para condición de carrera"
        )
        self.session.add(resena_existente)
        await self.session.flush()

        data = ResenaCreate(calificacion_estrellas=4, comentario_texto="Intento simultáneo")
        
        with self.assertRaises(FileExistsError):
            await self.service.crear_resena(
                user_id=self.user_mentee.id_usuario,
                id_contrato=self.contrato.id_contrato,
                data=data
            )

    async def test_reportar_resena(self):
        data = ResenaCreate(calificacion_estrellas=4, comentario_texto="Comentario problemático")
        resena = await self.service.crear_resena(
            user_id=self.user_mentee.id_usuario,
            id_contrato=self.contrato.id_contrato,
            data=data
        )

        self.assertFalse(resena.reportada)

        resena_reportada = await self.service.reportar_resena(resena.id_resena)
        self.assertTrue(resena_reportada.reportada)

    async def test_paquete_service_promedio_estrellas(self):
        # Aseguramos estado validado y verificado para que liste en el marketplace
        self.paquete.estado_activo = True
        self.paquete.estado_validacion = "aprobado"
        self.mentor.estado_verificacion = "verificado"
        self.session.add_all([self.paquete, self.mentor])
        await self.session.flush()

        paquete_service = PaqueteService(self.session)

        # 1. Comprobar que inicialmente la calificacion promedio es None para nuestro paquete
        paquetes_inicial = await paquete_service.listar_paquetes_disponibles()
        nuestro_paquete_ini = next((p for p in paquetes_inicial if p.id_paquete == self.paquete.id_paquete), None)
        self.assertIsNotNone(nuestro_paquete_ini)
        self.assertIsNone(nuestro_paquete_ini.calificacion_promedio)

        # 2. Crear resena
        data_resena = ResenaCreate(calificacion_estrellas=4, comentario_texto="Resena 4 estrellas")
        await self.service.crear_resena(
            user_id=self.user_mentee.id_usuario,
            id_contrato=self.contrato.id_contrato,
            data=data_resena
        )

        # 3. Comprobar que ahora la calificacion promedio es 4.0 para nuestro paquete
        paquetes_con_resena = await paquete_service.listar_paquetes_disponibles()
        nuestro_paquete_res = next((p for p in paquetes_con_resena if p.id_paquete == self.paquete.id_paquete), None)
        self.assertIsNotNone(nuestro_paquete_res)
        self.assertEqual(float(nuestro_paquete_res.calificacion_promedio), 4.0)

        # 4. Reportar resena (moderacion)
        res = await self.session.execute(select(ResenaMentor).filter(ResenaMentor.id_contrato == self.contrato.id_contrato))
        resena = res.scalars().first()
        await self.service.reportar_resena(resena.id_resena)

        # 5. Comprobar que vuelve a ser None para nuestro paquete
        paquetes_reportados = await paquete_service.listar_paquetes_disponibles()
        nuestro_paquete_rep = next((p for p in paquetes_reportados if p.id_paquete == self.paquete.id_paquete), None)
        self.assertIsNotNone(nuestro_paquete_rep)
        self.assertIsNone(nuestro_paquete_rep.calificacion_promedio)


