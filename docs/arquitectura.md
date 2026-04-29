# Arquitectura del Proyecto MentorMatch

## Estructura del Proyecto

```
MentorMatch/
│
├── README.md                          # Guía general del proyecto
├── docker-compose.yml                 # Configuración de contenedores Docker
│
├── docs/                              # Documentación del proyecto
│   ├── arquitectura.md               # Este archivo - Estructura y propósito de directorios
│   ├── documentoVision.md            # Visión y objetivos del proyecto
│   └── spec.md                       # Especificaciones técnicas, y fuente de verdad (sdd)
│
├── backend/                           # API REST y lógica del servidor
│   ├── requirements.txt              # Dependencias de Python
│   ├── .env.example                  # Variables de entorno (ejemplo)
│   ├── .env                          # Variables de entorno (local)
│   └── venv/                         # Entorno virtual de Python
│
├── frontend/                          # Aplicación web (Vue/React/etc)
│   ├── package.json                  # Dependencias de Node.js
│   ├── package-lock.json             # Lock de dependencias
│   ├── index.html                    # HTML principal
│   ├── vite.config.js                # Configuración de Vite (builder)
│   ├── eslint.config.js              # Reglas de linting
│   ├── README.md                     # Documentación del frontend
│   ├── src/                          # Código fuente
│   │   ├── main.jsx                  # Punto de entrada
│   │   ├── App.jsx                   # Componente raíz
│   │   ├── App.css                   # Estilos globales
│   │   ├── index.css                 # Estilos base
│   │   └── assets/                   # Imágenes y recursos estáticos
│   └── public/                       # Archivos públicos estáticos
│
├── database/                          # Configuración de base de datos
│   └── schema_init.sql               # Script SQL para inicializar BD
│
└── .git/                             # Repositorio Git (historial de cambios)
```

## Propósito de Cada Directorio

### 📚 `/docs`
Documentación central del proyecto:
- **arquitectura.md** - Estructura y organización del código
- **documentoVision.md** - Visión, objetivos y requerimientos del negocio
- **spec.md** - Especificaciones técnicas detalladas, documento de verdad absoluta

### 🔧 `/backend`
Servidor API y lógica de negocio:
- Implementación en Python
- API REST para el frontend
- Gestión de datos y autenticación

### 🎨 `/frontend`
Interfaz de usuario web:
- Aplicación construida con Vite
- Componentes de React/Vue
- Estilos y assets

### 🗄️ `/database`
Esquemas y migraciones de base de datos:
- Scripts SQL para inicialización
- Definición de tablas y relaciones

### 🐳 `docker-compose.yml`
Orquestación de contenedores para desarrollo y producción
