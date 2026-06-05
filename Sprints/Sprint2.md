# Reporte de Sprint 2: Gestión de Productos y Servicios (Paquetes de Mentoría)

Este documento detalla el cumplimiento de los requerimientos solicitados para el Sprint 2 del proyecto **MentorMatch**, enfocado en la gestión del núcleo del negocio: la creación, edición y validación de los servicios ofrecidos en la plataforma (Paquetes de Mentoría). Todo el desarrollo se enmarcó estrictamente bajo la metodología **Spec-Driven Development (SDD)**.

---

## 1. Alcance y Requerimientos Cumplidos

### A. Modelo de Datos

Se diseñó e implementó la entidad `Paquetes_Mentor` (que representa el "Producto/Servicio" en el dominio de MentorMatch). Este modelo es totalmente consistente con el Sprint 1 y soporta los siguientes requerimientos:

- **Atributos principales:** `titulo_paquete` (VARCHAR), `cantidad_horas_totales` (INT > 0), `precio_total` (DECIMAL 10,2 ≥ 0), y `fecha_creacion`.
- **Relación Jerárquica:** El paquete está asociado unívocamente al Ofertante mediante una relación `Many-to-One` usando la llave foránea `id_mentor` (que apunta al `Perfil_Mentor` verificado).
- **Estado de Validación:** La visibilidad del paquete está controlada a través de una máquina de estados conjunta. El atributo `estado_activo` (Booleano) maneja la activación por parte del Ofertante, mientras que la validación administrativa de la calidad del servicio recae sobre el `estado_verificacion` del `Perfil_Mentor` (`pendiente`, `verificado`, `rechazado`). Un paquete jamás será visible si la validación del administrador no ha sido otorgada.

### B. Historias de Usuario (Backlog Ejecutado)

El sistema soporta plenamente los flujos de trabajo solicitados a través de las siguientes Historias de Usuario implementadas en nuestra arquitectura SPA (React) + API (FastAPI):

- **HU-01: Registro de Producto/Servicio (Ofertante):** El Mentor (Ofertante) puede acceder a la vista "Mis Paquetes" (`PaquetesPage.jsx`) y crear un nuevo servicio definiendo su título, horas y costo. Por regla de negocio de SDD, aunque se cree con éxito, no es público hasta superar los filtros de visibilidad.
- **HU-02: Edición o Eliminación de Producto/Servicio (Ofertante):** En su mismo panel, el Mentor puede actualizar el precio o las horas de su oferta. Se implementó la lógica para que las ediciones actualicen los registros de forma transaccional mediante `SQLAlchemy` (CRUD completo).
- **HU-03: Validación de Contenido (Administrador):** A través del `AdminDashboard.jsx`, el Administrador audita a los ofertantes en estado "Pendiente". Al presionar "Verificar", el Administrador aprueba en cascada los servicios asociados a dicho perfil, haciéndolos visibles de inmediato en el Catálogo Público (`Marketplace.jsx`).

### C. Especificaciones de Comportamiento (Enfoque SDD)

Para adherir a la metodología **Spec-Driven Development**, el código fue escrito obedeciendo el contrato estricto definido en `docs/spec.md`.

Las especificaciones formales (Specs) que guiaron este Sprint se definieron mediante el esquema Gherkin clásico:

*   **Spec HU-01 (Creación):** 
    *   *Dado que* soy un "Mentor" autenticado.
    *   *Cuando* lleno el formulario de creación de paquete con "Título", "Horas" y "Precio", y envío la solicitud.
    *   *Entonces* el sistema guarda el paquete en la base de datos (PostgreSQL).
    *   *Y* la visibilidad depende del estado de validación.

*   **Spec HU-03 (Validación Administrativa):** 
    *   *Dado que* soy un "Administrador".
    *   *Cuando* visualizo la lista de auditoría.
    *   *Entonces* veo solo perfiles/paquetes en estado "Pendiente".
    *   *Y cuando* presiono "Aprobar".
    *   *Entonces* cambia su estado a verificado/aprobado y los servicios se listan en el motor de búsqueda de los Mentees.

---

## 2. Criterios de Aceptación Técnicos

El Sprint 2 se ha superado demostrando solidez técnica en dos frentes obligatorios:

1. **Cobertura de Specs:** El código de Backend (`api/paquetes.py` y `repositories/paquetes_repository.py`) incluye validaciones estrictas (`Pydantic Models`) que rechazan datos incompletos o maliciosos. Las consultas del catálogo (`Marketplace`) aplican filtros que cruzan el `estado_activo = TRUE` con el `estado_verificacion = 'verificado'`, cumpliendo la especificación al pie de la letra.
2. **Persistencia Transaccional:** Todos los paquetes se almacenan con identificadores únicos (`UUID v4`), y las operaciones monetarias se restringen a tipos decimales de alta precisión (`DECIMAL(10,2)`) para evitar errores de coma flotante. La persistencia es segura, asíncrona y está alojada en la base de datos de desarrollo.
