# Arquitectura de MentorMatch 

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Guía de instalación
├── docker-compose.yml                 # Orquestación en docker para Postgres
├── .gitignore                         # Muro de fuego contra basura y binarios
│
├── docs/                              # Documentación del proyecto
│   ├── arquitectura.md               # Este archivo
│   ├── documentoVision.md            # Visión y alcance
│   └── spec.md                       # SDD (Software Design Document) archivo de verdad absoluta
│
├── backend/                           # Servidor API (FastAPI + Python)
│   ├── app/
│   │   ├── __init__.py               # Marcador de paquete Python
│   │   ├── api/                      # Controladores y Endpoints REST
│   │   │   ├── __init__.py
│   │   │   ├── admin.py              # CRUD de administración de usuarios
│   │   │   ├── auth.py               # Lógica de Login/Signup, roles y JWT
│   │   │   ├── profiles.py           # Vistas de Mentees y Mentores
│   │   │   └── skills.py             # Lógica de taxonomía de habilidades (N+1 parchado)
│   │   ├── core/                     # Núcleo de configuraciones
│   │   │   ├── __init__.py
│   │   │   └── security.py           # Algoritmos criptográficos y firma de tokens
│   │   ├── db/                       # Capa de persistencia
│   │   │   ├── __init__.py
│   │   │   └── database.py           # Motor de SQLAlchemy y lectura del .env
│   │   ├── models/                   # ORM: Tablas SQL mapeadas a clases Python
│   │   │   ├── __init__.py
│   │   │   ├── associations.py       # Tablas intermedias puras
│   │   │   ├── main_models.py        # Tablas de negocio (perfiles, paquetes, sesiones, habilidades)
│   │   │   └── usuarios.py           # Núcleo de identidades
│   │   ├── schemas/                  # DTOs: Validación de datos de entrada/salida
│   │   │   ├── __init__.py
│   │   │   ├── skills.py             # Esquemas de serialización de habilidades
│   │   │   └── user.py               # Esquemas de serialización de usuarios (Pydantic)
│   │   └── services/                 # Lógica de negocio dura
│   │       └── __init__.py
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
│   │   └── pages/                    # Vistas completas encapsuladas (Las naves)
│   │       ├── Login/
│   │       │   ├── Login.jsx         
│   │       │   └── Login.module.css  
│   │       ├── MentorDashboard/
│   │       │   └── MentorDashboard.jsx 
│   │       └── CompleteProfile/
│   │           └── CompleteProfile.jsx 
│   └── public/                       # Assets estáticos servidos directamente
│       ├── favicon.svg
│       └── icons.svg
│
└── database/                          # Inicialización de Base de Datos
    └── schema_init.sql               # Script DDL inyectado al contenedor Postgres
```

