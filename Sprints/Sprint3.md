# Reporte de Sprint 3: Búsqueda, Solicitudes y Flujos de Confirmación

Este documento detalla cómo la plataforma **MentorMatch** implementa y satisface los requerimientos exigidos para el Sprint 3, enfocándose en la experiencia de descubrimiento del demandante (Mentee) y el ciclo de vida de la solicitud de un servicio (Paquete de Mentoría).

---

## 1. Búsqueda de Productos o Servicios (Catálogo)

**Requerimiento:** *El demandante realiza la búsqueda de su necesidad utilizando diversas opciones de filtro.*

**Implementación en MentorMatch:**
Se ha desarrollado un motor de búsqueda avanzado (`Marketplace.jsx`) conectado al endpoint `/api/paquetes/buscar` que permite a los Mentees (Demandantes) descubrir paquetes de mentoría (Servicios) bajo un diseño corporativo moderno (Tailwind CSS).
- **Filtros Dinámicos:** El buscador permite filtrar en tiempo real (mediante *Debounce* para no saturar el servidor) por **Título o Nombre del Mentor**, **Precio Máximo**, **Habilidad Específica** (ej. React, Python) y **Nivel de Dominio** (Básico, Intermedio, Avanzado, Experto).
- **Métricas de Calidad:** Las tarjetas de resultados exhiben automáticamente la **Calificación Promedio** (`calificacion_promedio`) calculada a partir de reseñas previas (los "mejor calificados") y muestran una insignia de validación que garantiza la calidad del ofertante.

---

## 2. Solicitar Producto o Servicio (Aplicación a Beca/Contrato)

**Requerimiento:** *Selección de un producto que permita al ofertante aceptar/rechazar. Se deben registrar datos que permitan evaluar la solicitud.*

**Implementación en MentorMatch:**
Además del flujo de compra directa (procesada externamente vía Stripe), hemos implementado un sistema de **"Solicitud de Beca"** que modela exactamente este requerimiento de aceptación asíncrona.
- **Formulario de Solicitud:** Cuando el Demandante selecciona un paquete y hace clic en "Solicitar Beca", se despliega un modal donde es obligatorio redactar una **Carta de Motivación** (`carta_motivacion`). 
- **Evaluación Cualitativa:** Este texto (los "datos requeridos para evaluar") se envía mediante el endpoint `POST /api/contratos/aplicar-beca`, creando un Contrato en estado "Pendiente" y asociando la carta para que el Mentor (Ofertante) pueda evaluar por qué el demandante merece el servicio.

---

## 3. Confirmación de la Solicitud (Panel del Ofertante)

**Requerimiento:** *Permitir al ofertante visualizar las solicitudes para las ofertas de productos que ha registrado y gestionarlas.*

**Implementación en MentorMatch:**
El ecosistema del Mentor está preparado para revisar el buzón de solicitudes entrantes y emitir un veredicto.
- **Visualización:** Mediante el endpoint `GET /api/contratos/solicitudes`, el Ofertante puede ver todos los contratos/becas que los Demandantes han solicitado sobre sus paquetes, incluyendo la lectura de la carta de motivación.
- **Aceptación o Rechazo:** El Mentor utiliza los endpoints `PATCH /api/contratos/{id_contrato}/aceptar` y `PATCH /api/contratos/{id_contrato}/rechazar` para cambiar el estado del contrato.
- **Flujo Concluido:** Si la solicitud es aceptada, el contrato se activa atómicamente en la base de datos (PostgreSQL), permitiendo a ambas partes iniciar su relación de mentoría y comunicarse a través del módulo de Chat en tiempo real que posee la plataforma.

---

## 4. Entregables y Despliegue

**Despliegue en Producción (Render):**
Tal como se exige, el proyecto completo (Base de Datos PostgreSQL, Backend en FastAPI y Frontend en React) se encuentra orquestado y desplegado en la nube pública mediante **Render**.

**Enlace de Producción:**


* **Frontend UI:** [https://mentormatch-ui.onrender.com/](https://mentormatch-ui.onrender.com/)
* **Backend API:** [https://mentormatch-api-fwl1.onrender.com](https://mentormatch-api-fwl1.onrender.com)
* **API Docs (Swagger):** [https://mentormatch-api-fwl1.onrender.com/docs](https://mentormatch-api-fwl1.onrender.com/docs)


*Nota para revisión: Todo el código fuente de estas funcionalidades se encuentra consolidado en el repositorio de GitHub para su evaluación técnica, garantizando el cumplimiento de la arquitectura SPA y RESTful API.*
