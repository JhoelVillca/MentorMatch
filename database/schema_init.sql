CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. NÚCLEO DE AUTENTICACIÓN

CREATE TABLE Usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    estado_cuenta VARCHAR(20) DEFAULT 'activo' CHECK (estado_cuenta IN ('activo', 'suspendido', 'baneado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP WITH TIME ZONE
);

CREATE TABLE Roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion_rol TEXT
);

CREATE TABLE Usuario_Roles (
    id_usuario UUID REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_rol UUID REFERENCES Roles(id_rol) ON DELETE CASCADE,
    PRIMARY KEY (id_usuario, id_rol)
);

CREATE TABLE Administradores (
    id_admin UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID UNIQUE REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    nivel_privilegio INT NOT NULL DEFAULT 1,
    departamento_asignado VARCHAR(100)
);

-- 2. ENTIDADES DE PERFILES

CREATE TABLE Perfil_Mentee (
    id_mentee UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID UNIQUE REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    zona_horaria_preferida VARCHAR(50) DEFAULT 'UTC',
    biografia_corta TEXT
);

CREATE TABLE Perfil_Mentor (
    id_mentor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID UNIQUE REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    biografia_profesional TEXT,
    url_video_presentacion VARCHAR(500),
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente', 'verificado', 'rechazado')),
    url_linkedin VARCHAR(500)
);

-- 3. TAXONOMÍA DE HABILIDADES

CREATE TABLE Categorias_Habilidad (
    id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_categoria VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE Habilidades (
    id_habilidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_categoria UUID REFERENCES Categorias_Habilidad(id_categoria) ON DELETE RESTRICT,
    nombre_habilidad VARCHAR(100) UNIQUE NOT NULL,
    validada_por_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE Mentor_Habilidades (
    id_mentor UUID REFERENCES Perfil_Mentor(id_mentor) ON DELETE CASCADE,
    id_habilidad UUID REFERENCES Habilidades(id_habilidad) ON DELETE CASCADE,
    anios_experiencia INT CHECK (anios_experiencia >= 0),
    nivel_dominio VARCHAR(20) CHECK (nivel_dominio IN ('basico', 'intermedio', 'avanzado', 'experto')),
    PRIMARY KEY (id_mentor, id_habilidad)
);

-- 4. OFERTA COMERCIAL

CREATE TABLE Paquetes_Mentor (
    id_paquete UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mentor UUID REFERENCES Perfil_Mentor(id_mentor) ON DELETE CASCADE,
    titulo_paquete VARCHAR(255) NOT NULL,
    cantidad_horas_totales INT NOT NULL CHECK (cantidad_horas_totales > 0),
    precio_total DECIMAL(10, 2) NOT NULL CHECK (precio_total >= 0),
    estado_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACUERDOS Y TRANSACCIONES FINANCIERAS

CREATE TABLE Contratos_Mentoria (
    id_contrato UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mentee UUID REFERENCES Perfil_Mentee(id_mentee) ON DELETE RESTRICT,
    id_paquete UUID REFERENCES Paquetes_Mentor(id_paquete) ON DELETE RESTRICT,
    estado_contrato VARCHAR(30) DEFAULT 'pendiente_pago' CHECK (estado_contrato IN ('pendiente_pago', 'activo', 'completado', 'cancelado')),
    fecha_adquisicion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    horas_consumidas INT DEFAULT 0 CHECK (horas_consumidas >= 0)
);

CREATE TABLE Transacciones_Pago (
    id_transaccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato UUID REFERENCES Contratos_Mentoria(id_contrato) ON DELETE RESTRICT,
    monto_pagado DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    estado_pago VARCHAR(20) DEFAULT 'procesando' CHECK (estado_pago IN ('procesando', 'completado', 'fallido', 'reembolsado')),
    id_pasarela_externa VARCHAR(255) UNIQUE,
    fecha_procesamiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MOTOR DE AGENDAMIENTO Y EJECUCIÓN

CREATE TABLE Disponibilidad_Mentor (
    id_disponibilidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mentor UUID REFERENCES Perfil_Mentor(id_mentor) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    hora_inicio_utc TIME NOT NULL,
    hora_fin_utc TIME NOT NULL,
    CHECK (hora_inicio_utc < hora_fin_utc)
);

CREATE TABLE Sesiones (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato UUID REFERENCES Contratos_Mentoria(id_contrato) ON DELETE CASCADE,
    fecha_hora_inicio_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    estado_sesion VARCHAR(20) DEFAULT 'programada' CHECK (estado_sesion IN ('programada', 'en_curso', 'finalizada', 'ausente', 'cancelada')),
    url_videollamada VARCHAR(500),
    notas_internas TEXT,
    CHECK (fecha_hora_inicio_utc < fecha_hora_fin_utc)
);

-- 7. CALIDAD Y AUDITORÍA

CREATE TABLE Resenas_Mentor (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato UUID UNIQUE REFERENCES Contratos_Mentoria(id_contrato) ON DELETE CASCADE,
    calificacion_estrellas INT NOT NULL CHECK (calificacion_estrellas BETWEEN 1 AND 5),
    comentario_texto TEXT,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reportada BOOLEAN DEFAULT FALSE
);

CREATE TABLE Auditoria_Administrativa (
    id_auditoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_admin UUID REFERENCES Administradores(id_admin) ON DELETE SET NULL,
    accion_realizada VARCHAR(255) NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    id_registro_afectado UUID,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ÍNDICES ESTRATÉGICOS (B-Trees)
CREATE INDEX idx_usuarios_email ON Usuarios(email);
CREATE INDEX idx_sesiones_fechas ON Sesiones(fecha_hora_inicio_utc, fecha_hora_fin_utc);
CREATE INDEX idx_contratos_mentee ON Contratos_Mentoria(id_mentee);
CREATE INDEX idx_contratos_paquete ON Contratos_Mentoria(id_paquete);
CREATE INDEX idx_paquetes_mentor ON Paquetes_Mentor(id_mentor);

-- 9. MOTOR DE COMUNICACIÓN Y CHAT

CREATE TABLE Salas_Chat (
    id_sala UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mentee UUID REFERENCES Perfil_Mentee(id_mentee) ON DELETE CASCADE,
    id_mentor UUID REFERENCES Perfil_Mentor(id_mentor) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Evita crear múltiples salas para las mismas dos personas
    UNIQUE (id_mentee, id_mentor) 
);

CREATE TABLE Mensajes_Chat (
    id_mensaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sala UUID REFERENCES Salas_Chat(id_sala) ON DELETE CASCADE,
    id_remitente UUID REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    contenido_texto TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mensajes_historial ON Mensajes_Chat(id_sala, fecha_envio DESC);

ALTER TABLE Transacciones_Pago 
ADD COLUMN url_recibo_externo VARCHAR(500);