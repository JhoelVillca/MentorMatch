## MentorMatch - Guía de Despliegue Rápido (Evaluación)

Sistema empaquetado mediante contenedores Docker para garantizar una ejecución inmutable y sin fricción.

### 1. Requisitos Previos
* Docker y Docker Compose instalados en su máquina.

### 2. Configuración de Entorno
En la raíz del proyecto, copie la plantilla de variables de entorno del backend:
\`\`\`bash
cp backend/.env.example backend/.env
\`\`\`
*(Opcional: Modifique POSTGRES_PORT en el `.env` si el puerto 5432 ya está ocupado en su máquina local).*

### 3. Ejecución del Sistema
Levante la infraestructura completa (Base de datos PostgreSQL, Backend FastAPI y Frontend React) con un solo comando:
\`\`\`bash
docker compose up -d --build
\`\`\`

### 4. Accesos
* **Plataforma Web (Frontend):** http://localhost:5173
* **Documentación API (Swagger):** http://localhost:8000/docs

### 5. Usuarios de Prueba (Pre-cargados)
El sistema incluye datos semilla automáticos. La contraseña para todos es \`123456\`
* Administrador: \`admin@test.com\`
* Mentor Verificado: \`mentor@test.com\`
* Mentee Base: \`mentee@test.com\`

Para detener el sistema: \`docker compose down\`