# MentorMatch

Plataforma de mentoria online que conecta aprendices con expertos. Backend async con FastAPI, frontend en React 19, base de datos PostgreSQL 16.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router
- **Backend:** Python 3.11, FastAPI (Async), SQLAlchemy (Async), JWT, asyncpg
- **Base de Datos:** PostgreSQL 16 con pgcrypto
- **Infraestructura:** Docker & Docker Compose

---

## Despliegue Rapido (Evaluacion)

Requisito unico: tener **Docker Desktop** instalado y corriendo.

### 1. Clonar el repositorio

```bash
git clone https://github.com/JhoelVillca/MentorMatch.git
cd MentorMatch
```

### 2. Configurar el entorno

```bash
cp backend/.env.example backend/.env
```

El archivo `.env` ya tiene credenciales funcionales para Docker. El unico campo que deberias cambiar es `SECRET_KEY` si quieres mayor seguridad:

```bash
openssl rand -hex 32
```

Pega el resultado en la linea `SECRET_KEY=` del `.env`.

### 3. Levantar el sistema

```bash
docker compose up -d --build
```

Ese unico comando construye las imagenes, inicializa la base de datos con el esquema completo y los datos de prueba, y levanta los tres servicios.

### 4. Accesos

| Servicio | URL |
|---|---|
| Plataforma Web | http://localhost:5173 |
| Documentacion API (Swagger) | http://localhost:8000/docs |

### 5. Usuarios de prueba

La contrasena para todos es `123456`.

| Rol | Email |
|---|---|
| Administrador | admin@test.com |
| Mentor Verificado | mentor@test.com |
| Mentee | mentee@test.com |

### 6. Detener el sistema

```bash
docker compose down
```

Para destruir tambien los datos persistentes (reset completo):

```bash
docker compose down -v
```

---

## Desarrollo Local (sin Docker)

Para contribuir al proyecto sin contenedores, necesitas PostgreSQL 16, Python 3.11 y Node 20 instalados localmente.

### Backend

```bash
cd backend
python -m venv venv

# Windows (Git Bash)
source venv/Scripts/activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

Edita `backend/.env` y cambia:

```bash
POSTGRES_HOST=127.0.0.1
DATABASE_URL=postgresql+asyncpg://mentormatch_user:mentormatch_pass@127.0.0.1:5432/mentormatch
```

Levanta solo la base de datos con Docker:

```bash
docker compose up -d db
```

Luego arranca el backend:

```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Accede en http://localhost:5173

---

## Flujo de Contribucion

### 1. Sincronizar con main

```bash
git checkout main
git pull origin main
```

### 2. Crear rama de trabajo

```bash
git checkout -b <tipo>/<nombre-descriptivo>
```

| Prefijo | Cuando usarlo | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad | `feature/chat-async` |
| `fix/` | Corregir un error | `fix/doble-booking` |
| `refactor/` | Reorganizar codigo sin cambiar comportamiento | `refactor/aislar-servicio-pagos` |
| `chore/` | Infraestructura, configuracion, dependencias | `chore/docker-hardening` |
| `docs/` | Documentacion | `docs/actualizar-guia` |

### 3. Cambios en base de datos

Si modificas archivos en `backend/app/models/`, genera la migracion con Alembic:

```bash
cd backend
alembic revision --autogenerate -m "descripcion-del-cambio"
alembic upgrade head
```

Regla de oro: nunca modifiques el esquema a mano ni uses `db.create_all()`. Todo cambio estructural va por Alembic, o tu companero no tendra tus cambios.

### 4. Commit y Pull Request

```bash
git add .
git commit -m "<tipo>: descripcion breve en minusculas"
git push -u origin <nombre-de-tu-rama>
```

Sigue el estandar **Conventional Commits**. Ejemplos:

```
feat: agregar endpoint de busqueda de mentores
fix: corregir validacion de zona horaria en perfil mentee
refactor: aislar logica de contratos en capa de servicio
chore: actualizar docker-compose con healthcheck en db
```

Abre el Pull Request en GitHub. El administrador revisara y hara el merge a main.

### 5. Limpieza post-merge

```bash
git checkout main
git pull origin main
git branch -d <nombre-de-tu-rama>
git fetch -p
```

---

## Resolucion de Conflictos de Merge

Cuando dos personas modifican las mismas lineas en ramas distintas:

```bash
# Desde tu rama de trabajo
git pull origin main
```

Git marcara los archivos en conflicto. Abrelos en VS Code — veras los bloques `<<<<<<< HEAD` y `>>>>>>> main`. Resuelve manualmente, guarda y cierra el conflicto:

```bash
git add .
git commit -m "fix: resolver conflicto de fusion en main"
git push
```

---

## Reglas para el Backend Async

El sistema es 100% asincrono. Cada endpoint que toca la base de datos debe seguir este patron sin excepcion:

| Correcto | Incorrecto |
|---|---|
| `async def mi_endpoint(...):` | `def mi_endpoint(...):` |
| `db: AsyncSession = Depends(get_db)` | `db: Session = Depends(get_db)` |
| `await db.execute(select(...))` | `db.query(Model).filter(...)` |
| `await db.commit()` | `db.commit()` sin await |

La logica de negocio vive en `app/services/`, no en los routers. Los routers son despachadores HTTP, nada mas.
