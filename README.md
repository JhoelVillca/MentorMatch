# MentorMatch 

## Descripción
Plataforma de e-learning que se enfoca en dar mentoria a alguien que desea aprender alguna habilidad o aprender sobre un tema a los que denominamos **mentee** y aquellos que dan **mentor** que recibiran pagos de mentee a cambio de su mentoria.

## Stack Tecnológico 
* **Frontend:** React 19, Vite, Tailwind CSS, React Router.
* **Backend:** Python 3, FastAPI, SQLAlchemy, JWT.
* **Base de Datos:** PostgreSQL 16 (con UUIDs nativos vía `pgcrypto`).
* **Infraestructura:** Docker & Docker Compose.

## Guía de Instalación Rápida (Para Mortales)

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
