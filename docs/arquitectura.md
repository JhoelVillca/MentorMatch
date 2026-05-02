# Arquitectura de MentorMatch 

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Guía de instalación
├── docker-compose.yml                 # Orquestación en docker para  Postgres
├── .gitignore                         # el gitignore
│
├── docs/                              # Documentación del proyecto
│   ├── arquitectura.md               # Este archivo
│   ├── documentoVision.md            # donde definimos que queremos
│   └── spec.md                       # SDD (Spec Driven Development) para seguir la metodologia
│
├── backend/                           # Servidor API (FastAPI + Python)
│   ├── app/
│   │   ├── __init__.py               # Marcador de paquete Python
│   │   ├── api/                      # Controladores y Endpoints REST
│   │   │   ├── __init__.py
│   │   │   ├── admin.py              # CRUD de administración de usuarios
│   │   │   ├── auth.py               # Lógica de Login/Signup, roles y JWT
│   │   │   └── profiles.py           # Vistas de Mentees y Mentores
│   │   ├── core/                     # Núcleo de configuraciones
│   │   │   ├── __init__.py
│   │   │   └── security.py           # Algoritmos criptográficos y firma de tokens
│   │   ├── db/                       # Capa de persistencia
│   │   │   ├── __init__.py
│   │   │   └── database.py           # Motor de SQLAlchemy y lectura del .env
│   │   ├── models/                   # ORM: Tablas SQL mapeadas a clases Python
│   │   │   ├── __init__.py
│   │   │   ├── associations.py       # Tablas intermedias (roles, habilidades)
│   │   │   ├── main_models.py        # Tablas de negocio (perfiles, paquetes, sesiones)
│   │   │   └── usuarios.py           # Núcleo de identidades
│   │   ├── schemas/                  # DTOs: Validación de datos de entrada/salida
│   │   │   ├── __init__.py
│   │   │   └── user.py               # Esquemas de serialización (Pydantic)
│   │   └── services/                 # Lógica de negocio dura (desacoplada de las rutas)
│   │       └── __init__.py
│   ├── main.py                       # Orquestador principal y configuración ASGI
│   ├── requirements.txt              # Registro de dependencias de Python
│   ├── .env.example                  # Plantilla de variables de entorno públicas
│   └── .env                          # Variables de entorno reales (IGNORADO EN GIT)
│
├── frontend/                          # Interfaz de Usuario (React 19 + Vite)
│   ├── eslint.config.js              # Reglas de linting estático
│   ├── index.html                    # Entrypoint del DOM
│   ├── package.json                  # Dependencias de Node.js y scripts
│   ├── package-lock.json             # Árbol de dependencias determinista (bloqueado)
│   ├── README.md                     # Documentación específica del frontend
│   ├── vite.config.js                # Builder y proxy de red (CORS bypass)
│   ├── src/                          # Código fuente React
│   │   ├── App.jsx                   # Enrutador principal (React Router)
│   │   ├── AuthContext.jsx           # Estado global de sesión y persistencia JWT
│   │   ├── index.css                 # Variables globales
│   │   ├── main.jsx                  # Montaje del DOM (inyección en root)
│   │   ├── ProtectedRoute.jsx        # Guardia de navegación por roles (RBAC)
│   │   ├── assets/                   # Recursos multimedia compilables por Vite
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   └── pages/                    # Vistas completas encapsuladas
│   │       └── Login/
│   │           ├── Login.jsx         # Formulario de acceso y redirección dinámica
│   │           └── Login.module.css  # Estilos aislados (Modules)
│   └── public/                       # Assets estáticos servidos directamente
│       ├── favicon.svg
│       └── icons.svg
│
└── database/                          # Inicialización de Base de Datos
    └── schema_init.sql               # Script DDL inyectado al contenedor Postgres
```

