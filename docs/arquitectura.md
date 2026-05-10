# Arquitectura de MentorMatch 

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Guía de supervivencia e instalación
├── docker-compose.yml                 # Orquestación en docker para Postgres
├── .gitignore                         # Muro de fuego contra basura y binarios
│
├── docs/                              #  Documentación del proyecto
│   ├── arquitectura.md               # Este archivo
│   ├── documentoVision.md            # Visión y alcance
│   └── spec.md                       # SDD (Software Design Document) archivo de verdad absoluta
│
├── backend/                           # Servidor API (FastAPI + Python)
│   ├── app/
│   │   ├── __init__.py               # Marcador de paquete Python
│   │   ├── api/                      # Controladores y Endpoints REST (Capa Interfaz/Mesero)
│   │   │   ├── __init__.py
│   │   │   ├── admin.py              # CRUD de administración de usuarios
│   │   │   ├── auth.py               # Enrutador de Login/Signup 
│   │   │   ├── deps.py               # Inyección de dependencias centrales (Seguridad/JWT)
│   │   │   ├── paquetes.py           # Endpoints de paquetes de mentoría (CRUD)
│   │   │   ├── profiles.py           # Vistas de Mentees y Mentores
│   │   │   └── skills.py             # Lógica de taxonomía de habilidades (N+1 parchado)
│   │   ├── core/                     # Núcleo de configuraciones
│   │   │   ├── __init__.py
│   │   │   └── security.py           # Algoritmos criptográficos y firma de tokens
│   │   ├── db/                       # Capa de persistencia y Conexión
│   │   │   ├── __init__.py
│   │   │   └── database.py           # Motor SQLAlchemy y generador de descriptores get_db()
│   │   ├── models/                   # ORM: Tablas SQL mapeadas a clases Python
│   │   │   ├── __init__.py
│   │   │   ├── associations.py       # Tablas intermedias puras
│   │   │   ├── main_models.py        # Tablas de negocio (perfiles, paquetes, sesiones, habilidades)
│   │   │   └── usuarios.py           # Núcleo de identidades
│   │   ├── repositories/             # Capa de Acceso a Datos (El Músculo)
│   │   │   ├── __init__.py
│   │   │   └── user_repository.py    # Consultas I/O directas a Postgres para usuarios
│   │   ├── schemas/                  # DTOs: Validación de datos de entrada/salida
│   │   │   ├── __init__.py
│   │   │   ├── paquete_schema.py     # Esquemas de serialización de paquetes
│   │   │   ├── skills.py             # Esquemas de serialización de habilidades
│   │   │   └── user.py               # Esquemas de serialización de usuarios (Pydantic)
│   │   └── services/                 # Lógica de negocio dura (El Cerebro)
│   │       ├── __init__.py
│   │       └── auth_service.py       # Orquestación de criptografía, JWT y reglas de negocio
│   ├── main.py                       # Orquestador principal y enrutador global
│   ├── requirements.txt              # Registro de dependencias
│   ├── .env.example                  # Plantilla de variables públicas (El mapa del tesoro)
│   └── .env                          # Variables reales (IGNORADO EN GIT)
│
├── frontend/                          # Interfaz de Usuario (React 19 + Vite)
│   ├── eslint.config.js              # Reglas de linting estático
│   ├── index.html                    # Entrypoint del DOM
│   ├── package.json                  # Dependencias de Node.js y scripts
│   ├── package-lock.json             # Árbol de dependencias determinista
│   ├── README.md                     # Documentación específica del frontend
│   ├── vite.config.js                # Builder y proxy de red
│   ├── src/                          # Código fuente React
│   │   ├── App.jsx                   # Enrutador principal (React Router)
│   │   ├── AuthContext.jsx           # Estado global de sesión y persistencia JWT
│   │   ├── index.css                 # Variables globales
│   │   ├── main.jsx                  # Montaje del DOM
│   │   ├── ProtectedRoute.jsx        # Guardia de navegación por roles (RBAC)
│   │   ├── assets/                   # Recursos multimedia compilables por Vite
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/               # Bloques de UI reutilizables (Legos)
│   │   │   └── MentorSkillForm.jsx   # Formulario de inyección de habilidades
│   │   ├── pages/                    # Vistas completas encapsuladas (Las naves)
│   │   │   ├── CompleteProfile/
│   │   │   │   └── CompleteProfile.jsx 
│   │   │   ├── Login/
│   │   │   │   ├── Login.jsx         # Vista sin lógica de red
│   │   │   │   └── Login.module.css  
│   │   │   ├── MentorDashboard/
│   │   │   │   └── MentorDashboard.jsx 
│   │   │   └── Paquetes/             # Panel de gestión de paquetes del mentor
│   │   │       └── PaquetesPage.jsx
│   │   └── services/                 # Capa de Red (Comportamiento)
│   │       └── authService.js        # Abstracción de Web APIs (Fetch) y serialización HTTP
│   └── public/                       # Assets estáticos servidos directamente
│       ├── favicon.svg
│       └── icons.svg
│
└── database/                          # Inicialización de Base de Datos
    └── schema_init.sql               # Script DDL inyectado al contenedor Postgres
```
