# Arquitectura de MentorMatch 

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Documentación raíz (v0.2.0)
├── docker-compose.yml                 # Orquestación de contenedores (Postgres 16)
├── .gitignore                         # Exclusiones de Git (node_modules, venv, .env)
│
├── docs/                              # Especificaciones de diseño y visión
│   ├── arquitectura.md                # Diseño de sistemas (Actualizado)
│   ├── documentoVision.md             # Requerimientos de negocio
│   └── spec.md                        # SDD: Fuente única de verdad técnica
│
├── backend/                           # Capa Servidor (FastAPI + SQLAlchemy)
│   ├── main.py                        # Entrypoint: Inicialización de la App y Rutas
│   ├── requirements.txt               # Manifiesto de dependencias Python
│   ├── .env.example                   # Plantilla de inyección de entorno
│   └── app/
│       ├── api/                       # Controladores de Endpoints (Meseros HTTP)
│       │   ├── admin.py               # Gestión RBAC y purga de usuarios
│       │   ├── auth.py                # JWT Issuance (Login/Signup)
│       │   ├── deps.py                # Inyectores: get_db, dependencias de roles
│       │   ├── disponibilidad.py      # Motor de agendamiento (Días/Horas UTC)
│       │   ├── paquetes.py            # CRUD de oferta comercial del Mentor
│       │   ├── profiles.py            # Gestión de perfiles Mentee/Mentor
│       │   └── skills.py              # Taxonomía y declaración de habilidades
│       ├── core/                      # Seguridad y Criptografía
│       │   └── security.py            # Hashing (bcrypt) y firma JWT (PyJWT)
│       ├── db/                        # Capa de Persistencia
│       │   └── database.py            # Engine de SQLAlchemy y SessionLocal
│       ├── models/                    # Modelos ORM (Mapeo a tablas SQL)
│       │   ├── associations.py        # Tabla intermedia usuario_roles
│       │   ├── main_models.py         # Tablas de negocio (Perfiles, Disponibilidad, etc)
│       │   └── usuarios.py            # Entidad core de identidad (Usuarios, Roles)
│       ├── repositories/              # Capa de Acceso a Datos (Consultas SQL/I-O)
│       │   ├── mentee_repository.py   # Consultas específicas de Mentee
│       │   ├── mentor_repository.py   # Consultas específicas de Mentor
│       │   └── user_repository.py     # Consultas core de Usuarios y Roles
│       ├── schemas/                   # DTOs de Pydantic (Validación de carga útil)
│       │   ├── admin.py               # Validación de respuestas de administración
│       │   ├── mentee_profile.py      # Validación de perfiles Mentee
│       │   ├── mentor_profile.py      # Validación de perfiles Mentor
│       │   ├── paquete_schema.py      # Validación de paquetes comerciales
│       │   ├── skills.py              # Validación de habilidades y niveles
│       │   └── user.py                # Validación de Auth y Tokens
│       └── services/                  # Capa de Lógica de Negocio (Cerebro)
│           ├── admin_service.py       # Lógica de listado de usuarios para admins
│           ├── auth_service.py        # Orquestación de autenticación y registro
│           └── profile_service.py     # Orquestación de creación/edición de perfiles
│
├── frontend/                          # Capa Cliente (React 19 + Vite 8)
│   ├── vite.config.js                 # Configuración de compilación y Proxy API
│   ├── src/
│   │   ├── App.jsx                    # Enrutador principal (Definición de Layouts y Rutas)
│   │   ├── AuthContext.jsx            # State management global (Sesión, Token y Rol decodificado)
│   │   ├── ProtectedRoute.jsx         # Middleware de protección de rutas (RBAC visual)
│   │   ├── components/                # Bloques de UI reutilizables (Legos)
│   │   │   ├── MainLayout.jsx         # Wrapper base con Navbar persistente y Outlet de rutas
│   │   │   ├── Navbar.jsx             # Barra de navegación inteligente con RBAC (Capa Interfaz)
│   │   │   ├── MentorAvailabilityPanel.jsx # Gestión visual de horarios
│   │   │   └── MentorSkillForm.jsx    # Registro visual de habilidades
│   │   ├── pages/                     # Vistas completas e independientes
│   │   │   ├── AdminDashboard/        # Panel de control con tabla de usuarios
│   │   │   ├── CompleteProfile/       # Formulario del perfil profesional (Mentor)
│   │   │   ├── Login/                 # Interfaz de acceso
│   │   │   ├── MenteeCompleteProfile/ # Formulario de datos personales (Mentee)
│   │   │   ├── MenteeDashboard/       # Vista principal del aprendiz
│   │   │   ├── MentorDashboard/       # Vista principal del experto
│   │   │   ├── Paquetes/              # CRUD visual de paquetes
│   │   │   └── Register/              # Captura de nuevos usuarios (Signup)
│   │   └── services/                  # Abstracción de red (Fetch API / Axios)
│   │       ├── adminService.js        # Comunicación con /api/admin
│   │       ├── authService.js         # Comunicación con /api/auth
│   │       └── profileService.js      # Comunicación con /api/profiles
│
└── database/                          # Scripts de inicialización y migración SQL
    └── schema_init.sql                # DDL: Definición de tablas, índices y FKs
    
```