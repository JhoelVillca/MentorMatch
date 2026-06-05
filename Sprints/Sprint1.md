# Reporte de Sprint 1: Gestión de Usuarios y Arquitectura Base

Este documento detalla el cumplimiento de los requerimientos solicitados para el Sprint 1 del proyecto **MentorMatch**, justificando cómo la implementación actual satisface (y supera) los criterios de evaluación.

---

## 1. Prototipo Inicial: Caso de Uso "Gestión de Usuarios" (CRUD y Login)

El sistema ha superado con éxito la implementación del requerimiento de gestión de cuentas, proporcionando un ecosistema robusto de autenticación y manejo de perfiles.

**Cumplimiento del requerimiento:**
- **Autenticación (Login):** Se implementó un sistema seguro basado en JSON Web Tokens (JWT). El usuario puede iniciar sesión proporcionando sus credenciales (correo y contraseña encriptada) y el sistema responde con un token de acceso y validación de su rol (Mentee, Mentor o Admin).
- **Creación (Create):** Se implementó el Registro de Usuarios. El sistema permite registrar una nueva cuenta con encriptación de contraseña (usando algoritmos modernos como bcrypt) y asignación inmediata de un rol dentro del ecosistema.
- **Lectura (Read):** Funcionalidad para que el usuario consulte su información de perfil. La plataforma recupera la información específica del usuario logueado en base a su token.
- **Actualización (Update):** Existen endpoints dedicados (como `CompleteProfile` y `MentorSkillForm`) que permiten a los usuarios enriquecer sus perfiles, añadir habilidades taxonómicas, establecer disponibilidad horaria e información personal.
- **Eliminación y Gestión Avanzada:** A nivel administrativo, el rol "Admin" puede auditar y gestionar el estado de aprobación/verificación de cuentas de mentores en la plataforma.

---

## 2. Desarrollo del Backend (Lenguaje y Base de Datos)

La arquitectura backend del proyecto se construyó utilizando tecnologías modernas, asíncronas y altamente escalables.

**Cumplimiento del requerimiento:**
- **Lenguaje:** **Python (3.x)**.
- **Framework Web:** **FastAPI**. Elegido por su altísimo rendimiento, soporte nativo para asincronismo (`async/await`) y autogeneración de documentación interactiva (Swagger/OpenAPI).
- **ORM y Base de Datos:** Se utiliza **PostgreSQL** como motor relacional primario. La conexión y las consultas se manejan a través de **SQLAlchemy (AsyncSession)**, lo que permite consultas atómicas y seguras contra vulnerabilidades como SQL Injection, garantizando a la vez alta concurrencia.
- **Seguridad y Capas:** La lógica de negocio está separada en controladores (Routers) y servicios. La seguridad de las contraseñas se asegura con `passlib` (bcrypt) y la gestión de sesiones mediante `PyJWT`.

---

## 3. Desarrollo del Frontend (JavaScript y Frameworks)

La interfaz de usuario y la experiencia visual (UI/UX) han sido desarrolladas como una Single Page Application (SPA) responsiva y moderna.

**Cumplimiento del requerimiento:**
- **Lenguaje Base:** **JavaScript (ES6+)** y **JSX**.
- **Framework Principal:** **React.js**. Se utilizó React bajo el entorno de construcción super rápido de **Vite**, asegurando modularización mediante componentes funcionales y Hooks (`useState`, `useEffect`, `useContext`).
- **Enrutamiento:** **React Router DOM**. Administra la navegación entre múltiples vistas sin recargar la página, soportando tanto rutas públicas (Landing Page, Catálogo) como rutas privadas protegidas por tokens (Dashboards, Chat).
- **Estilos y Diseño Visual:** El framework **Tailwind CSS**. Se configuró un *Design System* a medida en `tailwind.config.js` que proporciona paletas de colores corporativas (`primary`, `accent`), diseños minimalistas, efectos glassmorphism (`backdrop-blur`) y total responsividad en pantallas móviles y de escritorio.
- **Integración con Backend:** Se centralizaron las peticiones al servidor en una instancia dedicada de Axios/Fetch (`apiClient.js`), la cual inyecta automáticamente el Token JWT de autorización en los headers de cada petición.
