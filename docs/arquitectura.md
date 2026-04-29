# Arquitectura del Proyecto MentorMatch 🚀

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Guía de supervivencia e instalación
├── docker-compose.yml                 # Orquestación de infraestructura (Postgres)
├── .gitignore                         # Muro de fuego contra basura y binarios
│
├── docs/                              # Documentación del proyecto
│   ├── arquitectura.md               # Este archivo - Mapa exacto de nodos
│   ├── documentoVision.md            # Visión, alcance y objetivos de negocio
│   └── spec.md                       # SDD (Software Design Document) y diagramas
│
├── backend/                           # Servidor API (FastAPI + Python)
│   ├── app/
│   │   ├── api/                      # Controladores y Endpoints REST
│   │   │   ├── admin.py              # CRUD de administración de usuarios
│   │   │   ├── auth.py               # Lógica de Login/Signup y despacho de JWT
│   │   │   └── profiles.py           # Vistas de Mentees y Mentores
│   │   ├── core/                     # Núcleo de configuraciones
│   │   │   └── security.py           # Algoritmos criptográficos y firma de tokens
│   │   ├── db/                       # Capa de persistencia
│   │   │   └── database.py           # Motor de SQLAlchemy y lectura del .env
│   │   ├── models/                   # ORM: Tablas SQL mapeadas a clases Python
│   │   │   ├── associations.py       # Tablas intermedias (roles, habilidades)
│   │   │   ├── main_models.py        # Tablas de negocio (perfiles, paquetes, pagos)
│   │   │   └── usuarios.py           # Núcleo de identidades
│   │   ├── schemas/                  # DTOs: Validación de datos de entrada/salida (Pydantic)
│   │   │   └── user.py               # Esquemas de serialización de usuarios
│   │   └── services/                 # Lógica de negocio dura (desacoplada de las rutas)
│   ├── main.py                       # Orquestador principal y configuración ASGI
│   ├── requirements.txt              # Registro de dependencias de Python
│   ├── .env.example                  # Plantilla de variables de entorno públicas
│   └── .env                          # Variables de entorno reales (IGNORADO EN GIT)
│
├── frontend/                          # Interfaz de Usuario (React 19 + Vite)
│   ├── package.json                  # Dependencias de Node.js y scripts
│   ├── vite.config.js                # Builder y proxy de red
│   ├── tailwind.config.js            # Motor de estilos CSS utilitarios
│   ├── src/                          # Código fuente React
│   │   ├── main.jsx                  # Montaje del DOM
│   │   ├── App.jsx                   # Enrutador principal (React Router)
│   │   ├── AuthContext.jsx           # Estado global de sesión JWT
│   │   ├── ProtectedRoute.jsx        # Guardia de navegación por roles
│   │   ├── pages/                    # Vistas completas
│   │   │   ├── Login.jsx             # Formulario de acceso
│   │   │   ├── AdminDashboard.jsx    # Panel de control de administradores
│   │   │   ├── MenteeDashboard.jsx   # Área de alumnos
│   │   │   └── MentorDashboard.jsx   # Área de profesores
│   │   └── index.css                 # Variables globales y tailwind directives
│   └── public/                       # Assets estáticos (SVGs, favicons)
│
└── database/                          # Inicialización de Base de Datos
    └── schema_init.sql               # Script DDL inyectado al contenedor Postgres
```

## Propósito de Cada Capa

### 🔧 Capa Backend (El Cerebro)
* **API (`/api`)**: Su único trabajo es recibir la petición HTTP, verificar permisos y delegar la tarea. No debe contener lógica matemática ni consultas a la base de datos complejas.
* **Services (`/services`)**: La sala de máquinas. Si un Mentee reserva una hora y hay que descontar crédito, la matemática ocurre aquí.
* **Schemas (`/schemas`)**: El filtro de aduana. Garantiza que nadie envíe un texto donde debería ir un número de tarjeta de crédito, o que no filtremos el hash de una contraseña al cliente.

### 🎨 Capa Frontend (La Piel)
* Arquitectura SPA (Single Page Application) montada sobre Vite para tiempos de compilación HMR en milisegundos.
* Manejo de estado de sesión basado puramente en tokens JWT inyectados en los *headers* de las peticiones HTTP subsiguientes.

### 🗄️ Capa de Datos (La Memoria)
* Topología relacional estricta usando UUIDv4 nativos generados por el kernel de Postgres (`pgcrypto`) para mitigar vectores de ataque IDOR (Insecure Direct Object Reference).