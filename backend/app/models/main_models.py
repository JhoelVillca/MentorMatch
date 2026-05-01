from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Integer, Numeric, Time, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.types import TIMESTAMP
from app.db.database import Base

class Rol(Base):
    __tablename__ = "roles"
    id_rol = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nombre_rol = Column(String(50), unique=True, nullable=False)
    descripcion_rol = Column(Text)

class PerfilMentee(Base):
    __tablename__ = "perfil_mentee"
    id_mentee = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), unique=True)
    nombre_completo = Column(String(255), nullable=False)
    zona_horaria_preferida = Column(String(50), server_default="UTC")
    biografia_corta = Column(Text)

class PerfilMentor(Base):
    __tablename__ = "perfil_mentor"
    id_mentor = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), unique=True)
    nombre_completo = Column(String(255), nullable=False)
    biografia_profesional = Column(Text)
    estado_verificacion = Column(String(20), server_default="pendiente") # pendiente, verificado, rechazado
    url_linkedin = Column(String(500))

class PaqueteMentor(Base):
    __tablename__ = "paquetes_mentor"
    id_paquete = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_mentor = Column(UUID(as_uuid=True), ForeignKey("perfil_mentor.id_mentor", ondelete="CASCADE"))
    titulo_paquete = Column(String(255), nullable=False)
    cantidad_horas_totales = Column(Integer, nullable=False)
    precio_total = Column(Numeric(10, 2), nullable=False)
    estado_activo = Column(Boolean, server_default="true")

class ContratoMentoria(Base):
    __tablename__ = "contratos_mentoria"
    id_contrato = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_mentee = Column(UUID(as_uuid=True), ForeignKey("perfil_mentee.id_mentee", ondelete="RESTRICT"))
    id_paquete = Column(UUID(as_uuid=True), ForeignKey("paquetes_mentor.id_paquete", ondelete="RESTRICT"))
    estado_contrato = Column(String(30), server_default="pendiente_pago")
    horas_consumidas = Column(Integer, server_default="0")

class TransaccionPago(Base):
    __tablename__ = "transacciones_pago"
    id_transaccion = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_contrato = Column(UUID(as_uuid=True), ForeignKey("contratos_mentoria.id_contrato", ondelete="RESTRICT"))
    monto_pagado = Column(Numeric(10, 2), nullable=False)
    estado_pago = Column(String(20), server_default="procesando")
    url_recibo_externo = Column(String(500))

class CategoriaHabilidad(Base):
    __tablename__ = "categorias_habilidad"
    id_categoria = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nombre_categoria = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)

class Habilidad(Base):
    __tablename__ = "habilidades"
    id_habilidad = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_categoria = Column(UUID(as_uuid=True), ForeignKey("categorias_habilidad.id_categoria", ondelete="RESTRICT"))
    nombre_habilidad = Column(String(100), unique=True, nullable=False)
    validada_por_admin = Column(Boolean, server_default="false")

class Administrador(Base):
    __tablename__ = "administradores"
    id_admin = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), unique=True)
    nivel_privilegio = Column(Integer, server_default=text("1"), nullable=False)
    departamento_asignado = Column(String(100))

class DisponibilidadMentor(Base):
    __tablename__ = "disponibilidad_mentor"
    id_disponibilidad = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_mentor = Column(UUID(as_uuid=True), ForeignKey("perfil_mentor.id_mentor", ondelete="CASCADE"))
    dia_semana = Column(Integer, nullable=False) # 1=Lunes, 7=Domingo
    hora_inicio_utc = Column(Time, nullable=False)
    hora_fin_utc = Column(Time, nullable=False)

class Sesion(Base):
    __tablename__ = "sesiones"
    id_sesion = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_contrato = Column(UUID(as_uuid=True), ForeignKey("contratos_mentoria.id_contrato", ondelete="CASCADE"))
    fecha_hora_inicio_utc = Column(TIMESTAMP(timezone=True), nullable=False)
    fecha_hora_fin_utc = Column(TIMESTAMP(timezone=True), nullable=False)
    estado_sesion = Column(String(20), server_default="programada")
    url_videollamada = Column(String(500))
    notas_internas = Column(Text)

class ResenaMentor(Base):
    __tablename__ = "resenas_mentor"
    id_resena = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_contrato = Column(UUID(as_uuid=True), ForeignKey("contratos_mentoria.id_contrato", ondelete="CASCADE"), unique=True)
    calificacion_estrellas = Column(Integer, nullable=False)
    comentario_texto = Column(Text)
    fecha_publicacion = Column(TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    reportada = Column(Boolean, server_default=text("false"))

class AuditoriaAdministrativa(Base):
    __tablename__ = "auditoria_administrativa"
    id_auditoria = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_admin = Column(UUID(as_uuid=True), ForeignKey("administradores.id_admin", ondelete="SET NULL"))
    accion_realizada = Column(String(255), nullable=False)
    tabla_afectada = Column(String(100), nullable=False)
    id_registro_afectado = Column(UUID(as_uuid=True))
    fecha_accion = Column(TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class SalaChat(Base):
    __tablename__ = "salas_chat"
    id_sala = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_mentee = Column(UUID(as_uuid=True), ForeignKey("perfil_mentee.id_mentee", ondelete="CASCADE"))
    id_mentor = Column(UUID(as_uuid=True), ForeignKey("perfil_mentor.id_mentor", ondelete="CASCADE"))
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

class MensajeChat(Base):
    __tablename__ = "mensajes_chat"
    id_mensaje = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_sala = Column(UUID(as_uuid=True), ForeignKey("salas_chat.id_sala", ondelete="CASCADE"))
    id_remitente = Column(UUID(as_uuid=True), ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    contenido_texto = Column(Text, nullable=False)
    leido = Column(Boolean, server_default=text("false"))
    fecha_envio = Column(TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP"))