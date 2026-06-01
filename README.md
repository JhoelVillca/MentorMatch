# MentorMatch

## 👥 Integrantes

* Villca Villca Jhoel Mauricio
* Herrera David Jesus
* Condori Carmona Fernando Favian

## 📌 Sprints de Desarrollo

* [Sprint 1: Core Auth & RBAC](https://www.google.com/search?q=%23)
* [Sprint 2: Agendamiento y Bloqueos Concurrentes](https://www.google.com/search?q=%23)
* [Sprint 3: WebSockets y Pasarela Stripe](https://www.google.com/search?q=%23)

--- 

![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-15.1.0-008CDD?style=for-the-badge&logo=stripe&logoColor=white)

Marketplace bidireccional de e-learning que conecta mentees con mentores verificados. Arquitectura orientada a la concurrencia, alta disponibilidad y separacion de responsabilidades (SoC).

## 🚀 Arquitectura y Core Features

* **Sistema de Roles (RBAC):** Control de acceso estricto en frontend (rutas protegidas) y backend (middlewares de validacion JWT).
* **Agendamiento Concurrente:** Prevencion de double-booking en base de datos mediante bloqueos pesimistas (`SELECT FOR UPDATE`).
* **Comunicacion Asincrona:** Chat bidireccional en tiempo real utilizando WebSockets.
* **Procesamiento de Pagos:** Integracion con webhooks de Stripe para gestion transaccional.
* **Aislamiento de Entornos:** Flujo de integracion basado en proteccion de ramas (`main` para desarrollo estable, `production` para despliegues).

## 🛠 Tech Stack

* **Backend:** Python 3.11.x, FastAPI, SQLAlchemy (Asyncpg), Alembic, Pydantic, JWT, Bcrypt.
* **Frontend:** Node.js 20.x, React 19, Vite, TailwindCSS 4.
* **Base de Datos:** PostgreSQL 16.x.
* **SaaS e Integraciones:** Stripe (Pagos), Daily.co (WebRTC Video).

## 🌍 Entornos y Deploy

El despliegue se gestiona a traves de Render, sincronizado estrictamente con la rama `production`.

* **Frontend UI:** [https://mentormatch-ui.onrender.com/](https://mentormatch-ui.onrender.com/)
* **Backend API:** [https://mentormatch-api-fwl1.onrender.com](https://mentormatch-api-fwl1.onrender.com)
* **API Docs (Swagger):** [https://mentormatch-api-fwl1.onrender.com/docs](https://mentormatch-api-fwl1.onrender.com/docs)

## 💻 Quickstart (Setup Local)

### Opcion A: Despliegue con Docker (Recomendado)
Levanta toda la infraestructura en contenedores aislados.

1. Clona el repositorio.
2. Copia `.env.example` a `.env` y configura tus variables locales.
3. Ejecuta el orquestador:
```bash
docker-compose up -d --build

```

*Nota: El script `database/schema_init.sql` se inyectara automaticamente en el volumen de Postgres para sembrar la base de datos.*

### Opcion B: Entorno Nativo / Hibrido

Si necesitas debuggear procesos directo en el host. Requiere **Python 3.11.x** y **Node.js 20.x LTS**.

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000

```

**Frontend:**

```bash
cd frontend
npm install
npm run dev

```

## 🔐 Credenciales de Prueba (Seeder)

El init de la base de datos genera estos usuarios por defecto con la contrasena `123456`:

* **Admin:** `admin@test.com`
* **Mentor:** `mentor@test.com`
* **Mentee:** `mentee@test.com`

## 💳 Testing de Webhooks (Stripe Local)

Para procesar eventos transaccionales en localhost, necesitas redirigir el trafico usando el CLI de Stripe.

Abre una terminal y ejecuta:

```bash
stripe listen --forward-to localhost:8000/webhooks/stripe
```

Asegurate de copiar el `webhook signing secret` (empieza con `whsec_`) e inyectarlo en tu archivo `.env` local.
