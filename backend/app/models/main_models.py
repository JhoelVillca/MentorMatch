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

