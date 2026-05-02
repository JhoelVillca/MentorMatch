<img width="812" height="804" alt="image" src="https://github.com/user-attachments/assets/33a7d5cc-1dda-4892-9f5a-a4dc2682b136" /># MentorMatch 

## Descripción
Plataforma de e-learning que se enfoca en dar mentoria a alguien que desea aprender alguna habilidad o aprender sobre un tema a los que denominamos **mentee** y aquellos que dan **mentor** que recibiran pagos de mentee a cambio de su mentoria.

## Stack Tecnológico 
* **Frontend:** React 19, Vite, Tailwind CSS, React Router.
* **Backend:** Python 3, FastAPI, SQLAlchemy, JWT.
* **Base de Datos:** PostgreSQL 16 (con UUIDs nativos vía `pgcrypto`).
* **Infraestructura:** Docker & Docker Compose.

## Estructura del Proyecto
Para conocer la estructura completa de directorios y el propósito de cada archivo importante, consulta [docs/arquitectura.md](docs/arquitectura.md).

## Documentación
- [Arquitectura y Estructura](docs/arquitectura.md) - Organización de directorios y archivos
- [Documento de Visión](docs/documentoVision.md) - Objetivos y requerimientos del proyecto
- [Especificaciones Técnicas](docs/spec.md) - Detalles técnicos y requerimientos, fuente de verdad (spec drive dev)

## Guia de instalacion

### 1. Levantar la Base de Datos
Se debe tener instalado Docker desktop y corriendo. y en la terminal dentro de la carpeta principal (donde se encuentra docker-compose.yml) ejecutas:

```bash
docker compose up -d
```

*Esto descargará Postgres y ejecutará automáticamente el script `database/schema_init.sql`.*

### 2. Configurar el Backend (API)
```bash
cd backend
```
```bash
python -m venv venv
```
```bash
source venv/Scripts/activate
```
```bash
cp .env.example .env
```
rejusten .env de acuerdo a sus credenciales...

```bash
pip install -r requirements.txt
```
```bash
uvicorn main:app --reload
```
*La API corriendo en: http://localhost:8000*

### 3. Configurar el Frontend (React)
Abre otra terminal:
```bash
cd frontend
```
```bash
npm install
```
```bash
npm run dev
```
*La interfaz va a estar corriendo en: http://localhost:5173*


--- 
## Guía Estándar de Colaboración en el Repositorio

### 1. Clonación e Inicio

Clonar el repositorio en tu máquina local.
```bash
git clone https://github.com/JhoelVillca/MentorMatch.git
```

Ingresar al directorio raíz del proyecto.
```bash
cd MentorMatch
```

**Ojo:** Asegúrate de tener la aplicación de Docker (Docker Desktop) abierta y corriendo en tu sistema antes del siguiente paso.

Levantar la infraestructura de contenedores en segundo plano.
```bash
docker compose up -d
```

### 2. Configuración del Backend

Ingresar al directorio del backend.
```bash
cd backend
```

Crear el entorno virtual para aislar las dependencias de Python del resto de tu sistema.
```bash
python -m venv venv
```

Activar el entorno virtual (Usuarios de **Windows** usando Git Bash).
```bash
source venv/Scripts/activate
```
**Ojo:** Si usas **Linux o macOS**, el comando de activación es diferente: `source venv/bin/activate`.

Instalar los requerimientos del proyecto.
```bash
pip install -r requirements.txt
```

Retornar al directorio principal.
```bash
cd ..
```

### 3. Configuración del Frontend

Ingresar al directorio del frontend.
```bash
cd frontend
```

Instalar las dependencias de Node.js.
```bash
npm install
```

Retornar al directorio principal.
```bash
cd ..
```

### 4. Estándares de Ramas y Control de Versiones
Asegurense de estar en el main, El main es Sagrado, nunca toquen codigo aqui.
```bash
git checkout main
```

Descargar la última versión del código desde el servidor.
```bash
git pull origin main
```

Crear una nueva rama para tu tarea y cambiar a ella automáticamente.
```bash
git checkout -b <tipo>/<nombre-descriptivo>
```

**Ojo:** No uses nombres aleatorios para las ramas. Debes seguir esta convención:

| Prefijo de Rama | Cuándo usarlo | Ejemplo |
| :--- | :--- | :--- |
| `feature/` | Para agregar nuevas características o pantallas. | `feature/login-ui` |
| `fix/` | Para solucionar errores o bugs en el código. | `fix/error-conexion-bd` |
| `docs/` | Para actualizar documentación o README. | `docs/guia-instalacion` |

Abrir el proyecto en Visual Studio Code.
```bash
code .
```


y te pones a hacer tu parte.

### 5. Ejecución del Entorno de Desarrollo

**Ojo:** Necesitas dos terminales abiertas al mismo tiempo para correr tanto como el backend como el frontend.

En la Terminal 1 (Ubicada en `MentorMatch/backend` con el entorno virtual activado), iniciar el servidor:
```bash
uvicorn main:app --reload
```

En la Terminal 2 (Ubicada en `MentorMatch/frontend`), iniciar la interfaz:
```bash
npm run dev
```

### 6. Guardar y Subir Cambios (Commits)

en `MentorMatch/` revisen el estado para ver todo lo que modificaron con
```bash
git status
``` 

En la terminal en `MentorMatch/`, preparar todos los archivos modificados.
```bash
git add .
```

Empaquetar los cambios en el historial local usando **Conventional Commits**.
```bash
git commit -m "<tipo>: <descripción breve en minúsculas>"
```

**Ojo:** El mensaje del commit debe seguir estrictamente este estándar:

| Tipo de Commit | Significado | Ejemplo de Comando |
| :--- | :--- | :--- |
| `feat:` | Nueva funcionalidad. | `git commit -m "feat: implementado CRUD de productos"` |
| `fix:` | Corrección de un bug. | `git commit -m "fix: corregido cálculo de descuentos"` |
| `style:` | Formateo de código (espacios, comas), no afecta la lógica. | `git commit -m "style: formateo de código en la vista perfil"` |
| `refactor:` | Reestructuración de código sin agregar funciones ni arreglar bugs. | `git commit -m "refactor: optimización de la consulta SQL"` |

Subir tu rama local al repositorio remoto en GitHub.
```bash
git push -u origin <nombre-de-tu-rama>
```

despues del comando, la terminal mostrará un enlace. haz click y te mandara a GitHub para abrir un **Pull Request**. pongan una descripción técnica y detallada de lo que modificaste o hiziste y haz clic en "Create Pull Request". 

### 7. Limpieza post-aprobación

Una vez que tu código haya sido revisado y fusionado yo le dare el boton de merge en GitHub, haces esto en tu terminal local:

Cambiar de vuelta a la rama principal.
```bash
git checkout main
```

Actualizar tu repositorio local con los cambios ya fusionados.
```bash
git pull origin main
```

Eliminar tu rama de trabajo localmente (ya no la necesitas).
```bash
git branch -d <nombre-de-tu-rama>
```

Purgar tu árbol de referencias local para eliminar el rastro de la rama remota borrada.
```bash
git fetch -p
```
