## Descripción

Plataforma de e-learning enfocada en conectar a estudiantes (**mentees**) que desean aprender una habilidad con expertos (**mentores**) que ofrecen enseñanza personalizada a cambio de una tarifa. **El backend opera con I/O asíncrono** para máxima concurrencia y rendimiento.

## Stack Tecnológico

* **Frontend:** React 19, Vite, Tailwind CSS, React Router.
* **Backend:** Python 3, FastAPI (Async), SQLAlchemy (Async), Alembic, JWT, asyncpg.
* **Base de Datos:** PostgreSQL 16 (con UUIDs nativos vía `pgcrypto`).
* **Infraestructura:** Docker & Docker Compose.

## Documentación

* [Arquitectura y Estructura](./docs/arquitectura.md) - Organización de directorios y archivos.
* [Documento de Visión](./docs/documentoVision.md) - Objetivos y requerimientos del proyecto.
* [Especificaciones Técnicas](./docs/spec.md) - Detalles técnicos y reglas de negocio.

---

## FASE 1: Guía de Instalación y Despliegue Local

Ejecuta esta secuencia estrictamente en este orden **la primera vez** que configures el proyecto en tu máquina.

### 1. Clonación del Repositorio

Descarga el código fuente a tu máquina.

```bash
git clone https://github.com/JhoelVillca/MentorMatch.git
```

Ingresa al directorio raíz del proyecto.

```bash
cd MentorMatch
```

### 2. Definición del Entorno (Crítico)

**Ojo:** El sistema no funcionará sin credenciales, y si usas claves por defecto, funciona, pero es mejor usar esto.

Copia la plantilla para crear tu archivo local:

```bash
cp backend/.env.example backend/.env
```

Genera una clave criptográfica segura para las sesiones de usuario ejecutando esto en tu terminal (si tienes huevos):

```bash
openssl rand -hex 32
```

*(Copia la cadena de 64 caracteres que te devolverá la terminal).* 

Abre tu editor de código y edita el archivo `backend/.env`.

1. Busca la línea `SECRET_KEY=una_clave_secreta_muy_larga_y_segura`.
2. Reemplaza ese valor por la cadena que acabas de copiar.
3. Si ya tienes PostgreSQL instalado en tu máquina, cambia `POSTGRES_PORT=5432` a `POSTGRES_PORT=5433` y ajusta el puerto en la `DATABASE_URL` para evitar colisiones y agrega las configuraciones al que desees. y guardalos

* **Nota:** Para desarrollo local, las credenciales falsas (`tu_usuario_aqui`) funcionan perfectamente. pero mejor si lo cambias.

### 3. Aprovisionamiento de la Base de Datos

Asegúrate de tener la aplicación **Docker Desktop** abierta. Luego, levanta la base de datos inyectando el archivo que acabamos de crear.

```bash
docker compose --env-file backend/.env up -d
```

*Espera a que la terminal diga `Started`. Esto significa que el contenedor está corriendo en segundo plano.*

### 4. Configuración del Backend (API)

Ingresa a la carpeta del servidor.

```bash
cd backend
```

Crea un "entorno virtual". Esto es una burbuja aislada para que las librerías de este proyecto no rompan el Python de tu computadora.

```bash
python -m venv venv
```

Activa la burbuja (Entorno Virtual) en **Windows** usando Git Bash:

```bash
source venv/Scripts/activate
```

*(Si usas **Linux/macOS**, el comando es: `source venv/bin/activate`)*

Instala las librerías necesarias.

```bash
pip install -r requirements.txt
```

**🔥 CRÍTICO: Ejecuta las migraciones de base de datos (Alembic)**

Antes de encender el servidor, necesitas construir las tablas en PostgreSQL. Esto NO es automático:

```bash
alembic upgrade head
```

*Este comando lee todos los scripts de migración y aplica el esquema completo de la base de datos.*

Enciende el motor del backend (ahora 100% asíncrono):

```bash
uvicorn main:app --reload
```

*Tu terminal quedará bloqueada mostrando logs. La API ahora vive en: [http://127.0.0.1:8000](http://127.0.0.1:8000)*

### 5. Configuración del Frontend (React)

Abre una **nueva pestaña o ventana en tu terminal** (deja el backend corriendo en la primera).
Asegúrate de estar en la raíz de `MentorMatch/` y entra al frontend.

```bash
cd frontend
```

Instala los paquetes de la interfaz. *Este paso puede tardar un minuto.*

```bash
npm install
```

Enciende la interfaz.

```bash
npm run dev
```

*Abre tu navegador en: http://localhost:5173*

---

## FASE 2: Rutina Diaria de Colaboración

Una vez que tienes el proyecto instalado, esta es la rutina obligatoria para escribir código nuevo.

### 1. Sincronización Base

La rama `main` es el código de producción. **Nunca** escribas código directamente aquí.

Asegúrate de estar en la rama principal:

```bash
git checkout main
```

Descarga las últimas actualizaciones que hayan subido tus compañeros:

```bash
git pull origin main
```

### 2. Creación de tu Rama de Trabajo

Crea una copia paralela (rama) exclusiva para lo que vas a programar.

```bash
git checkout -b <tipo>/<nombre-descriptivo>
```

**Ojo:** Usa esta convención estricta para el `<tipo>`:

| Prefijo | Cuándo usarlo | Ejemplo |
| --- | --- | --- |
| `feature/` | Para agregar nuevas pantallas o funcionalidades. | `feature/chat-async` |
| `fix/` | Para arreglar un error que rompe el sistema. | `fix/doble-booking` |
| `docs/` | Para modificar texto, manuales o el README. | `docs/actualizar-guia` |

### 3. Desarrollo y Cambios en Base de Datos

Abre tu editor, programa, guarda tus archivos y prueba que todo funcione localmente.

```bash
code .
```

**Si modificaste los modelos de la base de datos** (archivos en `backend/app/models/`), tienes que generar una migración con Alembic. No hay atajos:

```bash
cd backend
alembic revision --autogenerate -m "nombre-descriptivo-del-cambio"
alembic upgrade head
```

**Regla de oro:** Nunca modifiques la base de datos a mano (ni con SQL directo ni con `db.create_all()`). Siempre vía Alembic. Si no, tu compañero no tendrá tus cambios y todo explotará.

### 4. Guardar Cambios (Commits)

Revisa qué archivos modificaste:

```bash
git status
```

Prepara todos los archivos modificados para ser guardados:

```bash
git add .
```

Empaqueta tus cambios con un mensaje claro siguiendo el estándar **Conventional Commits**:

```bash
git commit -m "<tipo>: <descripción breve en minúsculas>"
```

*Ejemplo: `git commit -m "feat: agregada validacion de email en login"`*

### 5. Subir al Servidor (Pull Request)

Sube tu rama a GitHub:

```bash
git push -u origin <nombre-de-tu-rama>
```

La terminal te dará un enlace HTTP. Haz clic (o cópialo en tu navegador). Te llevará a GitHub para crear un **Pull Request (PR)**. Llena la descripción explicando qué hiciste y envíalo.

### 6. Revisión y Aprobación

**Espera.** El administrador revisará tu código.

* Si hay errores, te dejará comentarios en GitHub. Deberás volver a tu código, arreglarlo, hacer `git add .`, `git commit` y `git push` de nuevo.
* Si todo está perfecto, el administrador hará el **Merge** (fusión) a la rama `main`.

### 7. Limpieza Local (Post-Merge)

Una vez que el administrador fusionó tu código en GitHub, debes limpiar tu máquina.

Regresa a la rama principal:

```bash
git checkout main
```

Descarga el código fusionado (que ahora incluye tu trabajo y el de otros):

```bash
git pull origin main
```

Borra tu rama local (ya cumplió su propósito):

```bash
git branch -d <nombre-de-tu-rama>
```

Limpia la caché de ramas viejas:

```bash
git fetch -p
```

---

## FASE 3: Protocolo de Colisiones (Conflictos de Merge)

**¿Qué es un conflicto?** Ocurre cuando tú y otro compañero modifican exactamente la misma línea del mismo archivo en ramas distintas. El sistema operativo no puede adivinar qué versión es la correcta, así que pausa el proceso y te pide intervención manual.

Si al intentar actualizar tu código recibes un mensaje de **"Merge conflict"**, haz lo siguiente:

**1. Trae los cambios conflictivos a tu rama:**
Asegúrate de estar en tu rama de trabajo (ej. `feature/login`) e intenta traer lo que hay en main:

```bash
git pull origin main
```

*La terminal te dirá en rojo qué archivos tienen conflictos (CONFLICT: Merge conflict in...).*

**2. Abre Visual Studio Code:**
Abre los archivos marcados con conflicto. Verás bloques de código rodeados por `<<<<<<< HEAD` y `>>>>>>> main`.

**3. Resuelve la colisión:**
VS Code te dará botones encima del conflicto:

* *Accept Current Change* (Mantener lo tuyo)
* *Accept Incoming Change* (Mantener lo de tu compañero)
* *Accept Both Changes* (Mantener ambos)

Haz clic en la opción correcta (o borra los símbolos y ajusta el código manualmente). Guarda el archivo.

**4. Sella la resolución:**
Una vez resueltos todos los archivos, dile a Git que el conflicto terminó:

```bash
git add .
```

```bash
git commit -m "fix: resuelto conflicto de fusion en main"
```

```bash
git push
```

*Listo. Tu Pull Request en GitHub ahora estará libre de conflictos y listo para ser aprobado.*

---

## ⚠️ ADVERTENCIA PARA DESARROLLADORES (BACKEND ASYNC)

**El sistema es 100% asíncrono.** Si agregas un nuevo endpoint (o modificas uno existente), sigue estas reglas como un mantra:

| ✅ **SÍ debes hacer** | ❌ **NUNCA hagas esto** |
| --- | --- |
| `async def mi_endpoint(...):` | `def mi_endpoint(...):` (si toca DB) |
| `db: AsyncSession = Depends(get_db)` | `db: Session = Depends(get_db)` |
| `await db.execute(select(...))` | `db.query(Model).filter(...)` |
| `await db.commit()` | `db.commit()` sin await |
| Usar `asyncpg` como driver | Usar `psycopg2` directamente |

**Si tu endpoint no toca la base de datos** (ej. leer un archivo estático), puede ser `def` normal. Pero si ves `db`, tiene que ser `async`.
