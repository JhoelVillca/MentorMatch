# Arquitectura de MentorMatch

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Documentación raíz (v0.3.0 - Async)
├── docker-compose.yml                 # Orquestación de contenedores (Postgres 16)
├── .gitignore                         # Exclusiones de Git (node_modules, venv, .env)
│
├── docs/                              # Especificaciones de diseño y visión
│   ├── arquitectura.md                # Diseño de sistemas (Actualizado con Async)
│   ├── documentoVision.md             # Requerimientos de negocio
│   └── spec.md                        # SDD: Fuente única de verdad técnica
│
├── backend/                           # Capa Servidor (FastAPI + SQLAlchemy Async)
│   ├── main.py                        # Entrypoint: Inicialización de la App y Rutas
│   ├── requirements.txt               # Manifiesto con asyncpg, alembic
│   ├── .env.example                   # Plantilla de inyección de entorno
│   ├── alembic.ini                    # Configuración de Alembic
│   ├── alembic/                       # Scripts de migración y versionado de esquema
│   │   ├── env.py                     # Configuración asíncrona de migraciones
│   │   ├── script.py.mako             # Plantilla para nuevas migraciones
│   │   └── versions/                  # Historial de cambios de esquema
│   └── app/
│       ├── api/                       # Controladores de Endpoints (Async)
│       │   ├── admin.py               # Gestión RBAC y purga de usuarios
│       │   ├── auth.py                # JWT Issuance (Login/Signup)
│       │   ├── deps.py                # Inyectores: get_db, dependencias de roles (Async)
│       │   ├── disponibilidad.py      # Motor de agendamiento (Async)
│       │   ├── paquetes.py            # CRUD de oferta comercial del Mentor (Async)
│       │   ├── profiles.py            # Gestión de perfiles (Async)
│       │   └── skills.py              # Taxonomía y declaración de habilidades (Async)
│       ├── core/                      # Seguridad y Criptografía
│       │   └── security.py            # Hashing (bcrypt) y firma JWT (PyJWT)
│       ├── db/                        # Capa de Persistencia
│       │   └── database.py            # create_async_engine, AsyncSessionLocal
│       ├── models/                    # Modelos ORM (Mapeo a tablas SQL)
│       │   ├── associations.py        # Tabla intermedia usuario_roles
│       │   ├── main_models.py         # Tablas de negocio (con fecha_creacion, etc)
│       │   └── usuarios.py            # Entidad core de identidad (Usuarios, Roles)
│       ├── repositories/              # Capa de Acceso a Datos (Async)
│       │   ├── mentee_repository.py   # async def / await db.execute
│       │   ├── mentor_repository.py   # async def / await db.execute
│       │   └── user_repository.py     # async def / await db.execute
│       ├── schemas/                   # DTOs de Pydantic (Validación)
│       │   ├── admin.py
│       │   ├── mentee_profile.py
│       │   ├── mentor_profile.py
│       │   ├── paquete_schema.py
│       │   ├── skills.py
│       │   └── user.py
│       └── services/                  # Capa de Lógica de Negocio (Async)
│           ├── admin_service.py
│           ├── auth_service.py        # async def authenticate_user
│           └── profile_service.py     # async def upsert_mentor_profile
│
├── frontend/                          # Capa Cliente (React 19 + Vite 8)
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── AuthContext.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── components/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── MentorAvailabilityPanel.jsx
│   │   │   └── MentorSkillForm.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard/
│   │   │   ├── CompleteProfile/
│   │   │   ├── Login/
│   │   │   ├── MenteeCompleteProfile/
│   │   │   ├── MenteeDashboard/
│   │   │   ├── MentorDashboard/
│   │   │   ├── Paquetes/
│   │   │   └── Register/
│   │   └── services/
│   │       ├── adminService.js
│   │       ├── authService.js
│   │       └── profileService.js
│
└── database/                          # Scripts de inicialización SQL
    └── schema_init.sql                # DDL inicial (Alembic toma el control luego)
```

## Stack Tecnológico (Actualizado)

* **Backend:** Python 3, FastAPI (Async), SQLAlchemy (Async), Alembic (Migraciones), JWT, asyncpg.
* **Base de Datos:** PostgreSQL 16 (con UUIDs nativos vía `pgcrypto`), accedida exclusivamente mediante `asyncpg`.
* **Frontend:** React 19, Vite, Tailwind CSS, React Router.
* **Infraestructura:** Docker & Docker Compose.

## Principios Arquitectónicos Clave

1.  **I/O Totalmente Asíncrono:** Toda operación que toca la base de datos (desde `repositories/` hasta `api/`) usa `async def` y `await`. No hay `db.query()` ni `psycopg2`.
2.  **Migraciones Profesionales:** El esquema de la base de datos es gestionado **exclusivamente** por Alembic. `Base.metadata.create_all()` no existe en producción.
3.  **URL Forzada a Asyncpg:** El sistema automáticamente convierte `postgresql://` en `postgresql+asyncpg://` para garantizar el driver correcto.
4.  **Transacciones Explícitas:** Todo `db.commit()`, `db.refresh()`, y `db.flush()` debe llevar `await`.
