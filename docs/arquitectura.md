# Arquitectura de MentorMatch

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Documentación principal, enlaces a Sprints y analíticas
├── CONTRIBUTING.md                    # Guía de contribución para nuevos desarrolladores
├── docker-compose.yml                 # Orquestación de contenedores (backend, frontend y BD)
├── .gitignore                         # Exclusiones de Git (node_modules, venv, .env)
├── guia.md                            # Guía de usuario y lineamientos adicionales
├── LICENSE                            # Archivo de licencia del proyecto
│
├── docs/                              # Especificaciones de diseño y visión
│   ├── arquitectura.md                # Diseño de sistemas e infraestructura actual
│   ├── documentoVision.md             # Requerimientos de negocio y visión
│   └── spec.md                        # SDD: Fuente única de verdad técnica
│
├── database/                          # Scripts de inicialización SQL
│   └── schema_init.sql                # DDL inicial para el despliegue
│
├── backend/                           # Capa Servidor (FastAPI + SQLAlchemy Async)
│   ├── main.py                        # Entrypoint: Inicialización de la App y Rutas REST
│   ├── requirements.txt               # Manifiesto de dependencias principales
│   ├── requirements-test.txt          # Dependencias para el entorno de testing
│   ├── Dockerfile                     # Instrucciones de construcción de imagen Docker del backend
│   ├── pytest.ini                     # Configuración del entorno de pruebas unitarias
│   ├── alembic.ini                    # Configuración central de migraciones
│   ├── alembic/                       # Directorio principal de Alembic
│   │   ├── env.py                     # Configuración asíncrona de migraciones
│   │   ├── script.py.mako             # Plantilla base para generar nuevas migraciones
│   │   └── versions/                  # Historial de esquemas generados
│   │       ├── 2381b61d3b24_init_async_tables.py             # Migración: Creación de tablas iniciales
│   │       ├── 88d3bbb566e8_add_ventas_totales_and...py      # Migración: Métricas de mentores
│   │       ├── a1b2c3d4e5f6_add_inactivo_estado_and...py     # Migración: Estados de inactividad
│   │       ├── a2c3d4e5f6g7_add_estado_validacion_paquetes.py # Migración: Validación de paquetes
│   │       ├── c3d4e5f6g7h8_add_chat_counters_to_salas.py    # Migración: Contadores de chat
│   │       └── d4e5f6g7h8i9_add_carta_motivacion_and...py    # Migración: Solicitudes de becas
│   │
│   ├── tests/                         # Pruebas automatizadas (Pytest)
│   │   ├── conftest.py                # Fixtures globales para pruebas
│   │   ├── test_auditoria.py          # Tests de registros de auditoría
│   │   ├── test_auth.py               # Tests de autenticación JWT
│   │   ├── test_idempotencia.py       # Tests de protección contra duplicados (Stripe)
│   │   ├── test_paquetes.py           # Tests de gestión de servicios/paquetes
│   │   ├── test_profiles.py           # Tests de CRUD de perfiles
│   │   ├── test_resenas.py            # Tests del módulo de reseñas
│   │   ├── test_s3.py                 # Tests de la integración con almacenamiento S3
│   │   └── test_sesiones.py           # Tests del agendamiento y validación horaria
│   │
│   └── app/                           # Código fuente backend
│       ├── api/                       # Endpoints y controladores REST
│       │   ├── admin.py               # Gestión RBAC y acciones de administrador
│       │   ├── auth.py                # Emisión JWT (Login/Signup)
│       │   ├── chat.py                # Controladores de WebSockets para mensajería
│       │   ├── contratos.py           # Gestión y formalización de contratos mentor-mentee
│       │   ├── deps.py                # Inyectores de dependencias (get_db, roles)
│       │   ├── disponibilidad.py      # Lógica de bloques de tiempo
│       │   ├── paquetes.py            # CRUD de oferta comercial del Mentor
│       │   ├── profiles.py            # Controladores de perfiles de usuario
│       │   ├── resenas.py             # Emisión y listado de valoraciones
│       │   ├── sesiones.py            # Gestión de agendamientos de videollamadas
│       │   ├── skills.py              # Taxonomía y habilidades
│       │   └── webhooks.py            # Recepción de eventos externos (Stripe)
│       ├── core/                      # Configuraciones base y seguridad
│       │   ├── daily_client.py        # Integración con API de videollamadas
│       │   ├── s3_client.py           # Cliente asíncrono para manipulación en S3
│       │   └── security.py            # Hashing de contraseñas y firma JWT
│       ├── db/                        # Capa de infraestructura de datos
│       │   └── database.py            # Inicialización de AsyncSessionLocal
│       ├── models/                    # Modelos ORM mapeados a SQL
│       │   ├── associations.py        # Tablas intermedias relacionales
│       │   ├── main_models.py         # Entidades de negocio centrales (Paquetes, Contratos, etc.)
│       │   └── usuarios.py            # Entidad core de autenticación y roles
│       ├── repositories/              # Patrón repositorio para acceso a datos
│       │   ├── chat_repository.py     # Lógica de base de datos para salas y mensajes
│       │   ├── mentee_repository.py   # DB CRUD para Mentees
│       │   ├── mentor_repository.py   # DB CRUD para Mentores
│       │   └── user_repository.py     # DB CRUD global de usuarios
│       ├── schemas/                   # DTOs y validación de datos (Pydantic)
│       │   ├── admin.py               # Serialización de datos de administración
│       │   ├── chat_schema.py         # Serialización de mensajes
│       │   ├── mentee_profile.py      # Serialización del perfil de Mentee
│       │   ├── mentor_profile.py      # Serialización del perfil de Mentor
│       │   ├── paquete_schema.py      # Validación de servicios
│       │   ├── resena_schema.py       # Validación de reseñas
│       │   ├── sesion_schema.py       # Serialización de videollamadas
│       │   ├── skills.py              # Validación de habilidades
│       │   ├── upload_schema.py       # Subida de archivos / URLs pre-firmadas
│       │   └── user.py                # Serialización base de usuario
│       └── services/                  # Casos de uso y lógica de negocio
│           ├── admin_service.py       # Reglas de negocio del administrador
│           ├── auditoria_service.py   # Lógica de trazabilidad
│           ├── auth_service.py        # Validación estricta de sesión
│           ├── connection_manager.py  # Gestor de pool de WebSockets
│           ├── contrato_service.py    # Lógica de compra y becas
│           ├── paquete_service.py     # Orquestación de oferta comercial
│           ├── profile_service.py     # Orquestación de onboarding
│           ├── resena_service.py      # Lógica de promedios de calificación
│           └── sesion_service.py      # Control concurrencia de reservas
│
├── frontend/                          # Capa Cliente (React + Vite)
│   ├── package.json                   # Definición de scripts NPM y dependencias
│   ├── package-lock.json              # Árbol exacto de dependencias
│   ├── vite.config.js                 # Configuración de servidor local Vite
│   ├── tailwind.config.js             # Configuración de utilidad CSS Tailwind
│   ├── postcss.config.js              # Procesador de CSS
│   ├── eslint.config.js               # Reglas de código limpio
│   ├── playwright.config.js           # Entorno de pruebas E2E UI
│   ├── index.html                     # Punto de entrada HTML
│   ├── Dockerfile                     # Imagen Docker del frontend
│   ├── README.md                      # Instrucciones del entorno React
│   ├── public/                        # Archivos estáticos
│   │   ├── favicon.svg                # Ícono de pestaña
│   │   └── icons.svg                  # Vectores complementarios
│   ├── tests/                         # Pruebas automatizadas (Playwright)
│   │   └── e2e/auth.spec.js           # End-to-end tests para flujo de Login
│   │
│   └── src/                           # Código fuente React
│       ├── main.jsx                   # Montura principal de la app
│       ├── App.jsx                    # Enrutador base
│       ├── index.css                  # Estilos maestros (Tailwind imports)
│       ├── AuthContext.jsx            # Gestor de JWT a nivel aplicación
│       ├── ProtectedRoute.jsx         # Componente para bloquear rutas no autorizadas
│       ├── hooks/                     # Custom Hooks globales
│       │   ├── useAgendamiento.js     # Lógica central para calcular la disponibilidad horaria
│       │   └── useChat.js             # Gestor dinámico del estado del WebSocket
│       ├── assets/                    # Recursos empaquetados por Vite
│       │   └── [imágenes y SVGs]      # hero.png, react.svg, vite.svg
│       ├── components/                # Componentes reusables UI
│       │   ├── LoadingSpinner.jsx     # Cargador de red
│       │   ├── MainLayout.jsx         # Layout maestro de enrutamiento
│       │   ├── MentorAvailabilityPanel.jsx # Panel interactivo de gestión horaria
│       │   ├── MentorSkillForm.jsx    # Formulario dinámico de habilidades
│       │   ├── Navbar.jsx             # Barra de navegación interior (Privada)
│       │   ├── ParticlesBackground.jsx # Animación interactiva de partículas para fondos
│       │   └── Landing/               # Componentes específicos de la Landing Page
│       │       ├── Benefits.jsx       # Sección de beneficios
│       │       ├── CatalogPreview.jsx # Vista previa de mentores destacados (Carrusel)
│       │       ├── CTASection.jsx     # Bloque final Call-To-Action
│       │       ├── Footer.jsx         # Pie de página corporativo
│       │       ├── Hero.jsx           # Banner superior de entrada
│       │       ├── HowItWorks.jsx     # Flujo visual de funcionamiento
│       │       ├── Navbar.jsx         # Navegación del Landing Page
│       │       ├── Packages.jsx       # Tarjetas de exhibición de precios
│       │       └── Testimonials.jsx   # Prueba social y reseñas destacadas
│       │
│       ├── pages/                     # Controladores de vista por URL
│       │   ├── AdminDashboard/        # Dashboard de analíticas y moderación
│       │   ├── AgendarSesion/         # Lógica visual de selección de turnos
│       │   ├── Chat/                  # Interfaz gráfica de WebSockets
│       │   ├── CompleteProfile/       # Onboarding general de usuarios
│       │   ├── Landing/               # Ensamblador de la Landing Page
│       │   ├── Login/                 # Ventana de autenticación de usuario
│       │   ├── Marketplace/           # Catálogo buscador de servicios (Mentores)
│       │   ├── MenteeCompleteProfile/ # Flujo de registro del estudiante
│       │   ├── MenteeDashboard/       # Panel de control privado del estudiante
│       │   ├── MentorDashboard/       # Panel de control privado del mentor
│       │   ├── MisContratos/          # Historial de servicios activos y consumidos
│       │   ├── Paquetes/              # Gestión de la oferta económica del mentor
│       │   ├── PublicProfile/         # Escaparate público con habilidades del mentor
│       │   ├── Register/              # Ventana de creación de nuevas cuentas
│       │   └── SalaVideo/             # Contenedor iframe para integraciones (Daily.co)
│       │
│       └── services/                  # Capa de transporte al backend (Axios)
│           ├── apiClient.js           # Instancia Axios con interceptores JWT
│           ├── adminService.js        # API Call: Funciones de administrador
│           ├── authService.js         # API Call: Sesiones
│           ├── chatService.js         # API Call: REST fallback y carga de historial
│           └── profileService.js      # API Call: Gestión de cuentas
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

## Sistema de Diseño y Estilos (Frontend)

El frontend de MentorMatch está diseñado con un enfoque moderno, priorizando una Experiencia de Usuario (UX) premium e interactiva. Las decisiones de estilo y estética se basan en las siguientes tecnologías y convenciones:

1. **Framework Principal (Tailwind CSS):** 
   Utilizamos **Tailwind CSS** (configurado en `tailwind.config.js`) como base para todo el estilizado. Esto permite un desarrollo rápido mediante clases utilitarias, manteniendo un diseño consistente sin depender de librerías de componentes prefabricados (como Material UI), lo que garantiza un control total sobre la estética y el peso del bundle.

2. **Paleta de Colores (Design System):**
   - **Primary (`primary-X`):** Tonos azules (ej. `primary-600` basado en `#2563eb`). Es el color base de la marca, usado en botones primarios y acentos principales.
   - **Accent (`accent-X`):** Tonos turquesa/teal (ej. `accent-500` basado en `#14b8a6`). Se usa para complementar al primario, generando gradientes vibrantes y llamativos (`bg-gradient-to-r from-primary-600 to-accent-500`).
   - **Neutros (`slate-X`):** Grises azulados para fondos (`bg-slate-50`), textos y bordes sutiles, brindando una lectura agradable y limpia.

3. **Principios de Estética Moderna:**
   - **Glassmorphism:** Uso de fondos semitransparentes con desenfoque (`backdrop-blur-md`, `bg-white/10`) en barras de navegación, modales y tarjetas superpuestas sobre fondos complejos o gradientes.
   - **Profundidad y Sombras:** Uso de sombras muy suaves y difusas (`shadow-sm`, sombra configurada `shadow-card`) para despegar los elementos del fondo de manera sutil.
   - **Bordes y Formas:** Uso intensivo de bordes muy redondeados (`rounded-xl`, `rounded-2xl`, `rounded-3xl`) que transmiten amigabilidad y frescura.
   - **Microinteracciones:** Todo elemento clicable o interactivo cuenta con transiciones fluidas (`transition-all duration-300`), efectos al pasar el ratón (`hover:`) y ligeros efectos de pulsación (`active:scale-[0.98]`) para que la aplicación se sienta rápida y viva.

4. **Hoja de Estilos Global (`src/index.css`):**
   Aunque Tailwind es la base, utilizamos la hoja de estilos global para:
   - Configurar utilidades base usando las directivas `@tailwind`.
   - Modificar la **Barra de Desplazamiento (Scrollbar)** en navegadores basados en webkit (`::-webkit-scrollbar`) para que el scroll del navegador sea coherente con la estética minimalista del proyecto.
   - Definir animaciones complejas (keyframes) que Tailwind no cubre por defecto (ej. fade in, escalados personalizados).

5. **Iconografía y Tipografía:**
   - **Iconografía:** Usamos **Lucide React** de manera exclusiva. Sus trazos limpios e integrables combinan a la perfección con la interfaz moderna.
   - **Tipografía:** Dependemos de las fuentes modernas del sistema (a través de la familia predeterminada `sans` de Tailwind) como Inter, Roboto o system-ui.
