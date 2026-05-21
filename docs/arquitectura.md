# Arquitectura de MentorMatch

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Documentación raíz (comandos Alembic, variables de entorno y despliegue)
├── docker-compose.yml                 # Orquestación de contenedores (backend, frontend y Postgres 16)
├── .gitignore                         # Exclusiones de Git (node_modules, venv, .env)
├── guia.md                            # Guía de usuario y lineamientos adicionales
│
├── docs/                              # Especificaciones de diseño y visión
│   ├── arquitectura.md                # Diseño de sistemas e infraestructura
│   ├── documentoVision.md             # Requerimientos de negocio
│   └── spec.md                        # SDD: Fuente única de verdad técnica
│
├── database/                          # Scripts de inicialización SQL
│   └── schema_init.sql                # DDL inicial
│
├── backend/                           # Capa Servidor (FastAPI + SQLAlchemy Async)
│   ├── main.py                        # Entrypoint: Inicialización de la App y Rutas
│   ├── requirements.txt               # Manifiesto de dependencias (asyncpg, alembic)
│   ├── .env.example                   # Plantilla de variables de entorno
│   ├── alembic.ini                    # Configuración central de migraciones
│   ├── alembic/                       # Directorio principal de Alembic
│   │   ├── env.py                     # Configuración asíncrona de migraciones
│   │   ├── script.py.mako             # Plantilla base para generar nuevas migraciones
│   │   └── versions/                  # Historial de esquemas (ej. init_async_tables)
│   └── app/                           # Código fuente backend
│       ├── api/                       # Endpoints y controladores REST (Async)
│       │   ├── admin.py               # Gestión RBAC y acciones de administrador
│       │   ├── auth.py                # Emisión JWT (Login/Signup)
│       │   ├── contratos.py           # Gestión y formalización de contratos mentor-mentee
│       │   ├── deps.py                # Inyectores de dependencias (get_db, roles)
│       │   ├── disponibilidad.py      # Lógica de bloques de tiempo y agendamiento
│       │   ├── paquetes.py            # CRUD de oferta comercial del Mentor
│       │   ├── profiles.py            # Controladores de perfiles de usuario
│       │   ├── sesiones.py            # Gestión de sesiones (incluye control de concurrencia de reservas)
│       │   └── skills.py              # Taxonomía y habilidades
│       ├── core/                      # Configuraciones base y seguridad
│       │   └── security.py            # Hashing de contraseñas y firma JWT
│       ├── db/                        # Capa de infraestructura de datos
│       │   └── database.py            # Inicialización de create_async_engine y AsyncSessionLocal
│       ├── models/                    # Modelos ORM mapeados a SQL
│       │   ├── associations.py        # Tablas intermedias relacionales
│       │   ├── main_models.py         # Entidades principales de negocio
│       │   └── usuarios.py            # Entidad core de autenticación y roles
│       ├── repositories/              # Patrón repositorio para acceso a datos
│       │   ├── mentee_repository.py   # Operaciones CRUD específicas para Mentees
│       │   ├── mentor_repository.py   # Operaciones CRUD específicas para Mentores
│       │   └── user_repository.py     # Operaciones CRUD globales de usuarios
│       ├── schemas/                   # Serialización y validación de datos (Pydantic)
│       │   ├── admin.py               # DTOs para la vista de administración
│       │   ├── mentee_profile.py      # DTOs para el perfil de Mentee
│       │   ├── mentor_profile.py      # DTOs para el perfil de Mentor
│       │   ├── paquete_schema.py      # DTOs para los paquetes ofrecidos
│       │   ├── sesion_schema.py       # DTOs para reserva de sesiones
│       │   ├── skills.py              # DTOs para manejo de habilidades
│       │   └── user.py                # DTOs de capa base de usuario
│       └── services/                  # Casos de uso y lógica de negocio pura
│           ├── auth_service.py        # Lógica central de autenticación y validación
│           └── profile_service.py     # Orquestación de creación/actualización de perfiles
│
├── frontend/                          # Capa Cliente (React + Vite)
│   ├── package.json                   # Definición de scripts NPM y dependencias
│   ├── package-lock.json              # Árbol exacto de versiones de dependencias
│   ├── vite.config.js                 # Configuración de compilación y servidor local Vite
│   ├── tailwind.config.js             # Configuración de utilidad CSS Tailwind
│   ├── postcss.config.js              # Procesador de CSS complementario
│   ├── eslint.config.js               # Reglas de validación estática de código
│   ├── index.html                     # Punto de entrada HTML del DOM virtual
│   ├── README.md                      # Instrucciones de arranque del entorno cliente
│   ├── public/                        # Archivos estáticos accesibles directamente
│   │   ├── favicon.svg                # Ícono principal de pestaña
│   │   └── icons.svg                  # Colección de vectores
│   └── src/                           # Directorio fuente del cliente
│       ├── main.jsx                   # Entrypoint de React y montura del árbol
│       ├── App.jsx                    # Enrutador principal y layout global
│       ├── index.css                  # Hoja de estilos principal y directivas Tailwind
│       ├── AuthContext.jsx            # Gestor global de sesión (Context API)
│       ├── ProtectedRoute.jsx         # Componente interceptor para rutas privadas
│       ├── assets/                    # Recursos empaquetados en tiempo de construcción
│       │   └── [imágenes y SVGs]      # hero.png, react.svg, vite.svg
│       ├── components/                # Bloques de construcción UI reutilizables
│       │   ├── MainLayout.jsx         # Estructura maestra visual
│       │   ├── MentorAvailabilityPanel.jsx # Panel interactivo de calendarios
│       │   ├── MentorSkillForm.jsx    # Formulario dinámico de competencias
│       │   └── Navbar.jsx             # Barra de navegación principal
│       ├── pages/                     # Vistas mapeadas a rutas
│       │   ├── AdminDashboard/        # Dashboard de administración y reportes
│       │   ├── AgendarSesion/         # Vista transaccional para agendar
│       │   ├── CompleteProfile/       # Flujo de onboarding primario
│       │   ├── Login/                 # Pantalla de acceso de usuarios
│       │   ├── Marketplace/           # Listado y motor de búsqueda de mentores
│       │   ├── MenteeCompleteProfile/ # Formulario de datos específicos para aprendices
│       │   ├── MenteeDashboard/       # Hub central de operaciones del Mentee
│       │   ├── MentorDashboard/       # Hub central de operaciones del Mentor
│       │   ├── MisContratos/          # Historial y gestión de servicios
│       │   ├── Paquetes/              # Configuración de servicios de venta
│       │   └── Register/              # Formulario de alta de usuario nuevo
│       └── services/                  # Abstracción de llamadas de red
│           ├── apiClient.js           # Configuración de Axios/Fetch e interceptores
│           ├── adminService.js        # Integración con endpoints de Admin
│           ├── authService.js         # Integración con endpoints de Auth
│           └── profileService.js      # Integración con endpoints de Perfil
│
└── images/                            # Activos visuales de documentación del sistema
    ├── editarperfilmentee.png         # Captura: Vista perfil mentee
    ├── editarperfilmentor.png         # Captura: Vista perfil mentor
    ├── loging.png                     # Captura: Login visual
    ├── panelAdmin.png                 # Captura: Interfaz de admin
    └── register.png                   # Captura: Formulario de registro visual

```

## Stack Tecnológico (Actualizado)

* **Backend:** Python 3, FastAPI (Async), SQLAlchemy (Async), Alembic (Migraciones), JWT.
* **Base de Datos:** PostgreSQL 16 accedida exclusivamente mediante `asyncpg`.
* **Frontend:** React 19, Vite, Tailwind CSS, React Router.

**Infraestructura:** Docker & Docker Compose para levantar en conjunto API y BD.

## Principios Arquitectónicos Clave

1. **I/O Totalmente Asíncrono:** Toda operación que impacta la base de datos utiliza `async def` y `await`.
2. **Migraciones Estrictas:** El control del DDL y los cambios de esquema en la base de datos están bajo el dominio absoluto de Alembic.
3. **Seguridad y Concurrencia Transaccional:** Se deben implementar bloqueos explícitos (como `with_for_update`) a nivel base de datos en controladores críticos (ej. `sesiones.py`) para evitar colisiones de usuarios reservando los mismos horarios.
4. **Código Limpio:** El código que avanza a producción (main branch) debe estar libre de sentencias de depuración como `print()` o `console.log()`.

