# Arquitectura de MentorMatch 

## Estructura del Proyecto (Monorepo)

```text
MentorMatch/
│
├── README.md                          # Documentación raíz y guía de despliegue
├── docker-compose.yml                 # Orquestación de contenedores (PostgreSQL 16)
├── .gitignore                         # Exclusión de venv, node_modules y secretos (.env)
│
├── docs/                              # Documentación técnica y de negocio
│   ├── arquitectura.md                # Diseño de sistemas (Este archivo)
│   ├── documentoVision.md             # Requerimientos de alto nivel
│   └── spec.md                        # Fuente única de verdad (SDD)
│
├── backend/                           # Servidor API (FastAPI)
│   ├── main.py                        # Punto de entrada y registro de routers
│   ├── requirements.txt               # Dependencias de Python (FastAPI, SQLAlchemy, PyJWT)
│   ├── .env.example                   # Plantilla de variables de entorno
│   ├── app/
│   │   ├── api/                       # Controladores (Interfaz de Red)
│   │   │   ├── admin.py               # Gestión administrativa de usuarios
│   │   │   ├── auth.py                # Endpoints de Login y Registro
│   │   │   ├── deps.py                # Inyección de dependencias (Auth JWT y RBAC)
│   │   │   ├── disponibilidad.py      # CRUD de horarios de mentores
│   │   │   ├── paquetes.py            # Gestión de oferta comercial
│   │   │   ├── profiles.py            # Endpoints de perfiles Mentee/Mentor
│   │   │   └── skills.py              # Catálogo de habilidades
│   │   ├── core/                      # Lógica central del sistema
│   │   │   └── security.py            # Hashing (bcrypt) y firma de tokens JWT
│   │   ├── db/                        # Capa de datos
│   │   │   └── database.py            # Conexión al motor y sesión SQLAlchemy
│   │   ├── models/                    # Definición de tablas (SQLAlchemy ORM)
│   │   │   ├── associations.py        # Tablas intermedias (usuario_roles)
│   │   │   ├── main_models.py         # Entidades de negocio (Perfil, Contratos, Habilidades)
│   │   │   └── usuarios.py            # Entidad núcleo de identidad
│   │   ├── repositories/              # Abstracción de consultas (I/O Directo)
│   │   │   ├── mentee_repository.py   # Operaciones CRUD Mentee
│   │   │   ├── mentor_repository.py   # Operaciones CRUD Mentor
│   │   │   └── user_repository.py     # Lógica de persistencia de usuarios y roles
│   │   ├── schemas/                   # DTOs (Validación con Pydantic)
│   │   │   ├── admin.py               # Esquemas para el panel de administración
│   │   │   ├── mentee_profile.py      
│   │   │   ├── mentor_profile.py      
│   │   │   ├── paquete_schema.py      
│   │   │   ├── skills.py              
│   │   │   └── user.py                
│   │   └── services/                  # Lógica de Negocio (El Cerebro)
│   │       ├── admin_service.py       # Lógica de listado y formateo para administradores
│   │       ├── auth_service.py        # Procesos de autenticación y registro
│   │       └── profile_service.py     # Gestión de perfiles y zonas horarias
│
├── frontend/                          # Interfaz de Usuario (React 19 + Vite)
│   ├── src/
│   │   ├── App.jsx                    # Definición de rutas (React Router)
│   │   ├── AuthContext.jsx            # Estado global de autenticación
│   │   ├── ProtectedRoute.jsx         # RBAC: Guardia de rutas por rol
│   │   ├── components/                # UI Reutilizable
│   │   │   ├── MentorAvailabilityPanel.jsx # Gestión de horarios
│   │   │   └── MentorSkillForm.jsx         # Registro de habilidades
│   │   ├── pages/                     # Vistas de la aplicación
│   │   │   ├── AdminDashboard/        
│   │   │   ├── CompleteProfile/       
│   │   │   ├── Login/                 
│   │   │   ├── MenteeCompleteProfile/ 
│   │   │   ├── MenteeDashboard/       
│   │   │   ├── MentorDashboard/       
│   │   │   ├── Paquetes/              
│   │   │   └── Register/              
│   │   ├── services/                  # Capa de red (Fetch API abstraída)
│   │   │   ├── adminService.js        
│   │   │   ├── authService.js         
│   │   │   └── profileService.js      
│
└── database/
    └── schema_init.sql                # DDL de inicialización (Postgres)
```
