# spec.md — MentorMatch
## Plataforma de Mentoría Online (Two-Sided Marketplace)
> **Metodología:** Spec-Driven Development (SDD).  
> **Este documento es la fuente única de verdad.** El código backend/frontend debe compilarse directamente a partir de las secciones, entidades, constraints e historias aquí descritas. No está permitido expandir el alcance, agregar tablas fantasmas ni ignorar las restricciones de tiempo (6 meses) y presupuesto (fase 1 limitada).

---

## 1. Visión General del Sistema

**MentorMatch** es una plataforma web de e-learning diseñada para operar como un **mercado bidireccional (two-sided marketplace)** que conecta directamente a personas que desean adquirir una habilidad específica (**Mentees**) con expertos (**Mentores**) que ofrecen enseñanza personalizada tarifada por hora.

*   **Problema que resuelve:** Los usuarios carecen de un canal confiable, seguro y de baja latencia para encontrar mentores verificados, agendar sesiones, procesar pagos y comunicarse en tiempo real (chat + videollamada) sin depender de programas académicos formales o cursos masivos (MOOC).
*   **Alcance (Fase 1):** La aplicación gestiona perfiles diferenciados (Mentee, Mentor, Administrador), taxonomía de habilidades categorizadas, motor de búsqueda y filtrado, paquetes de horas comercializables, contratos de mentoría, procesamiento de pagos a través de **pasarelas externas** (Stripe Connect / operadores locales), motor de agendamiento con control de concurrencia estricto, salas de chat 1 a 1, videollamadas integradas vía **API de terceros**, calificaciones de calidad, panel de auditoría administrativa y gestión de recibos de pago emitidos por la pasarela externa.
*   **Exclusiones explícitas (Fase 1):** No incluye cursos masivos (MOOC), formación académica formal, infraestructura propia de WebRTC/TURN/STUN, ni motor interno de facturación electrónica fiscal (SIN/LATAM). La emisión de comprobantes fiscales queda delegada a la pasarela de pago externa o a un SaaS de facturación integrado posteriormente.
*   **Paradigma arquitectónico:** Aplicación Web cliente-servidor con base de datos relacional **PostgreSQL**, identificadores universales **UUID v4** (`gen_random_uuid()`), extensión criptográfica **pgcrypto**, control de concurrencia mediante bloqueo pesimista a nivel de fila (`SELECT FOR UPDATE`), timestamps absolutos en **UTC** (`TIMESTAMP WITH TIME ZONE`) y comunicación en tiempo real vía **WebSockets (TCP)** para chat y API externa para videollamadas.
*   **Restricciones de proyecto:** Presupuesto limitado en primera fase. Plazo de desarrollo inicial: 6 meses. Dependencia estricta de pasarelas de pago externas; el backend **nunca** almacena ni transmite fondos reales.

---

## 2. Historias de Usuario por Etapa Operativa

### Etapa 1: Registro, Autenticación y Perfiles

*   **HU1 — Registro de cuenta base:** Como usuario, quiero registrarme con email y contraseña para obtener una identidad digital dentro del marketplace.
    *   *Criterios de Aceptación:* El sistema debe crear un registro en `Usuarios` con `id_usuario` UUID generado por `gen_random_uuid()`, `estado_cuenta` = `'activo'` y `fecha_creacion` = `CURRENT_TIMESTAMP`. El email debe ser único a nivel de base de datos (`UNIQUE`). La contraseña nunca se almacena en texto plano; el backend debe aplicar hashing con Argon2id o bcrypt antes de la persistencia.
*   **HU2 — Asignación de roles:** Como sistema, quiero asignar roles diferenciados (`mentee`, `mentor`, `administrador`) a cada usuario para controlar vectores de acceso basados en roles (RBAC).
    *   *Criterios de Aceptación:* La relación `Usuario_Roles` debe vincular `id_usuario` con `id_rol`. Un usuario puede tener múltiples roles, pero el perfil operativo se activa según el rol principal.
*   **HU3 — Creación de perfil Mentee:** Como aprendiz, quiero configurar mi nombre completo, biografía corta y zona horaria preferida para organizar las sesiones en mi horario local.
    *   *Criterios de Aceptación:* El sistema debe crear un registro en `Perfil_Mentee` vinculado 1 a 1 con `Usuarios.id_usuario`. La `zona_horaria_preferida` defaultea a `'UTC'` si no se especifica.
*   **HU4 — Creación y verificación de perfil Mentor:** Como mentor, quiero crear un perfil con biografía profesional, URL de LinkedIn, URL de video de presentación y estado de verificación, para atraer estudiantes y generar confianza.
    *   *Criterios de Aceptación:* El sistema debe crear un registro en `Perfil_Mentor` con `estado_verificacion` = `'pendiente'` por defecto. El perfil no es públicamente visible en el catálogo hasta que un `Administrador` cambie el estado a `'verificado'`.
*   **HU5 — Registro de Administrador:** Como administrador del sistema, quiero tener un panel de control con niveles de privilegio y departamento asignado para gestionar verificaciones, transacciones y seguridad.
    *   *Criterios de Aceptación:* El registro en `Administradores` requiere un `id_usuario` único vinculado a `Usuarios` y un `nivel_privilegio` entero ≥ 1.

### Etapa 2: Catálogo, Taxonomía y Búsqueda

*   **HU6 — Gestión de categorías y habilidades:** Como administrador, quiero crear categorías de habilidades y habilidades específicas dentro de cada categoría, para estructurar el descubrimiento de mentores.
    *   *Criterios de Aceptación:* Las tablas `Categorias_Habilidad` y `Habilidades` deben mantener una relación 1 a N. `nombre_categoria` y `nombre_habilidad` son únicos (`UNIQUE`).
*   **HU7 — Autoevaluación de habilidades del Mentor:** Como mentor, quiero registrar las habilidades que domino, indicando años de experiencia y nivel de dominio.
    *   *Criterios de Aceptación:* La tabla `Mentor_Habilidades` vincula un `id_mentor` con un `id_habilidad`. `anios_experiencia` ≥ 0. `nivel_dominio` ∈ `('basico', 'intermedio', 'avanzado', 'experto')`.
*   **HU8 — Publicación de paquetes comerciales:** Como mentor, quiero crear paquetes de horas totales con un precio fijo para que los estudiantes me contraten.
    *   *Criterios de Aceptación:* La tabla `Paquetes_Mentor` almacena `cantidad_horas_totales` > 0 y `precio_total` ≥ 0. El campo `estado_activo` defaultea a `TRUE`. Cada paquete pertenece a exactamente un mentor.
*   **HU9 — Descubrimiento de mentores:** Como mentee, quiero buscar mentores filtrando por habilidad, precio, disponibilidad y zona horaria, para encontrar la mejor coincidencia.
    *   *Criterios de Aceptación:* El motor de búsqueda debe utilizar índices compuestos y responder en < 200 ms. Los paquetes mostrados deben tener `estado_activo = TRUE` y el mentor debe tener `estado_verificacion = 'verificado'`.

### Etapa 3: Contratación y Pagos (Pasarela Externa)

*   **HU10 — Adquisición de paquete (contrato):** Como mentee, quiero comprar un paquete de horas de un mentor.
    *   *Criterios de Aceptación:* Al iniciar la compra, se crea un `Contrato_Mentoria` en estado `'pendiente_pago'`. El sistema debe verificar que el mentee no tenga un contrato activo duplicado para el mismo paquete en el mismo instante (bloqueo pesimista o restricción lógica).
*   **HU11 — Procesamiento de pagos externos:** Como sistema, quiero delegar el procesamiento financiero a pasarelas externas (Stripe Connect / operadores locales), registrando únicamente el estado y la referencia externa.
    *   *Criterios de Aceptación:* La tabla `Transacciones_Pago` registra `monto_pagado`, `moneda` (default `'USD'`), `estado_pago` y `id_pasarela_externa` (único para prevenir duplicados por reintentos de webhook). El backend **no** retiene fondos ni implementa lógica de escrow interna; la pasarela externa maneja la preautorización, captura y dispersión (ej. Stripe Connect Destination Charges). El backend solo actualiza `estado_pago` y almacena `id_pasarela_externa` tras recibir el webhook.
*   **HU12 — Activación del contrato:** Como sistema, quiero activar automáticamente un contrato una vez que la transacción de pago es exitosa.
    *   *Criterios de Aceptación:* Cuando `Transacciones_Pago.estado_pago` pasa a `'completado'`, el `Contrato_Mentoria.estado_contrato` debe transicionar a `'activo'` de forma atómica dentro de una transacción ACID.
*   **HU13 — Recibo externo visible:** Como mentee, quiero descargar el recibo o comprobante generado por la pasarela de pagos externa desde mi panel de contratos.
    *   *Criterios de Aceptación:* El campo `Transacciones_Pago.url_recibo_externo` debe almacenar la URL pública del recibo devuelta por la pasarela (ej. Stripe `receipt_url`). El frontend debe renderizar un enlace a esta URL. El backend no genera el recibo; solo lo referencia.

### Etapa 4: Agendamiento, Comunicación y Ejecución de Sesiones

*   **HU14 — Definición de disponibilidad del Mentor:** Como mentor, quiero definir rangos horarios semanales recurrentes en UTC para que los mentees agenden dentro de mis franjas disponibles.
    *   *Criterios de Aceptación:* `Disponibilidad_Mentor` almacena `dia_semana` ∈ [1,7], `hora_inicio_utc` y `hora_fin_utc` con la restricción `CHECK (hora_inicio_utc < hora_fin_utc)`.
*   **HU15 — Reserva de sesiones sin colisiones (anti double-booking):** Como mentee, quiero reservar una sesión dentro de un contrato activo basándome en la disponibilidad del mentor, sin permitir que otro usuario reserve el mismo bloque horario.
    *   *Criterios de Aceptación:* El sistema debe usar **bloqueo pesimista** (`SELECT FOR UPDATE`) sobre las filas de disponibilidad o de sesiones existentes al verificar solapamientos. El kernel de la base de datos debe aislar la transacción para evitar condiciones de carrera (race conditions / lost updates). La sesión creada en `Sesiones` debe cumplir `CHECK (fecha_hora_inicio_utc < fecha_hora_fin_utc)`.
*   **HU16 — Sala de chat 1 a 1:** Como usuario (mentee o mentor), quiero un canal de comunicación privado para coordinar detalles de la mentoría.
    *   *Criterios de Aceptación:* La tabla `Salas_Chat` impone `UNIQUE (id_mentee, id_mentor)`; solo puede existir una sala por par. Los mensajes se almacenan en `Mensajes_Chat` con `leido` = `FALSE` por defecto.
*   **HU17 — Videollamada integrada (API externa):** Como usuario, quiero iniciar una videollamada segura en el momento exacto programado de la sesión.
    *   *Criterios de Aceptación:* El campo `Sesiones.url_videollamada` debe apuntar a una sala generada por una **API externa** (ej. Zoom API, Daily.co, Google Meet API). El backend no implementa infraestructura propia de WebRTC, TURN ni STUN. La transición de estado de `'programada'` → `'en_curso'` debe ocurrir al iniciar la llamada.
*   **HU18 — Seguimiento de horas consumidas:** Como sistema, quiero rastrear cuántas horas del paquete contratado se han consumido.
    *   *Criterios de Aceptación:* El campo `Contratos_Mentoria.horas_consumidas` debe incrementarse de forma atómica tras cada sesión finalizada, sin permitir valores negativos (`CHECK (horas_consumidas >= 0)`).

### Etapa 5: Calidad, Reseñas y Auditoría

*   **HU19 — Emisión de reseñas:** Como mentee, quiero calificar y comentar la experiencia con mi mentor una vez completado el contrato.
    *   *Criterios de Aceptación:* `Resenas_Mentor` vincula 1 a 1 con `id_contrato` (no se permite más de una reseña por contrato). `calificacion_estrellas` ∈ [1,5].
*   **HU20 — Reporte de reseñas:** Como administrador, quiero marcar reseñas como reportadas para revisión de moderación.
    *   *Criterios de Aceptación:* El campo `Resenas_Mentor.reportada` defaultea a `FALSE` y puede ser actualizado por un administrador.
*   **HU21 — Auditoría administrativa:** Como administrador, quiero que cada acción crítica (baneos, verificaciones, modificaciones de estado) quede registrada en una tabla de auditoría inmutable.
    *   *Criterios de Aceptación:* `Auditoria_Administrativa` registra `id_admin`, `accion_realizada`, `tabla_afectada`, `id_registro_afectado` y `fecha_accion` = `CURRENT_TIMESTAMP`.

---

## 3. Modelo de Clases UML (Dominio)

```text
+------------------------+       +------------------------+
|      Usuario           |       |         Rol            |
+------------------------+       +------------------------+
| id_usuario: UUID (PK)  | 1   * | id_rol: UUID (PK)      |
| email: VARCHAR(255) UQ |-------| nombre_rol: VARCHAR    |
| password: VARCHAR(255) |       | descripcion_rol: TEXT  |
| estado_cuenta: VARCHAR |       +------------------------+
| fecha_creacion: TIMESTZ|
| ultimo_acceso: TIMESTZ |
+------------------------+
       | 1
       |
   1   v                    1
+-------------------+  +-----------------------+
| Perfil_Mentee     |  |   Perfil_Mentor       |
+-------------------+  +-----------------------+
| id_mentee: UUID   |  | id_mentor: UUID (PK)  |
| nombre: VARCHAR   |  | nombre: VARCHAR       |
| zona_horaria: VAR |  | biografia: TEXT       |
| bio_corta: TEXT   |  | url_video: VARCHAR    |
+-------------------+  | estado_verif: VARCHAR |
      | 1              | url_linkedin: VARCHAR |
      |                +-----------------------+
      |                        | 1
      |                        |
      |                        v *
      |             +-----------------------+
      |             | Mentor_Habilidad      |
      |             +-----------------------+
      |             | anios_exp: INT        |
      |             | nivel_dominio: VARCHAR|
      |             +-----------------------+
      |                        | *
      |                        v 1
      |             +-----------------------+
      |             |      Habilidad        |
      |             +-----------------------+
      |             | id_habilidad: UUID    |
      |             | nombre: VARCHAR (UQ)  |
      |             | validada: BOOLEAN     |
      |             +-----------------------+
      |                        ^ 1
      |                        |
      |             +-----------------------+
      |             | Categorias_Habilidad  |
      |             +-----------------------+
      |             | id_categoria: UUID    |
      |             | nombre: VARCHAR (UQ)  |
      |             +-----------------------+
      |
      | *                                        v 1
      |                                +-------------------------+
      +------------------------------->|  Contrato_Mentoria      |
                                       +-------------------------+
                                       | id_contrato: UUID (PK)  |
                                       | estado_contrato: VARCHAR|
                                       | horas_consumidas: INT   |
                                       | fecha_adquisicion: TIMES|
                                       +-------------------------+
                                             | 1
                                             |
                    +-------------------+    |    +-------------------------+
                    |  Disponibilidad   | *  |    |      Sesion             |
                    +-------------------+ <--|    +-------------------------+
                    | dia_semana: INT   |    |    | id_sesion: UUID (PK)    |
                    | hora_inicio: TIME |    |    | inicio_utc: TIMESTZ     |
                    | hora_fin: TIME    |    |    | fin_utc: TIMESTZ        |
                    +-------------------+    |    | estado_sesion: VARCHAR  |
                                             |    | url_video: VARCHAR      |
                                             |    | notas_internas: TEXT    |
                                             |    +-------------------------+
                                             |
                                             | 1
                                             v *
                                       +-------------------------+
                                       |  Transacciones_Pago     |
                                       +-------------------------+
                                       | id_transaccion: UUID    |
                                       | monto_pagado: DECIMAL   |
                                       | moneda: VARCHAR(3)      |
                                       | estado_pago: VARCHAR    |
                                       | id_pasarela: VARCHAR(UQ)|
                                       | url_recibo: VARCHAR(500)|
                                       | fecha_proc: TIMESTZ     |
                                       +-------------------------+
                                             | 1
                                             |
                                             v 1
                                       +-------------------------+
                                       |    Resenas_Mentor       |
                                       +-------------------------+
                                       | id_resena: UUID (PK)    |
                                       | calificacion: INT [1,5] |
                                       | comentario: TEXT        |
                                       | fecha_pub: TIMESTZ      |
                                       | reportada: BOOLEAN      |
                                       +-------------------------+

+------------------------+       +------------------------+
|    Salas_Chat          | 1   * |    Mensajes_Chat       |
+------------------------+------+------------------------+
| id_sala: UUID (PK)     |      | id_mensaje: UUID (PK)  |
| id_mentee: FK          |      | id_sala: FK            |
| id_mentor: FK          |      | id_remitente: FK       |
| fecha_creacion: TIMESTZ|      | contenido: TEXT        |
| UNIQUE(mentee, mentor) |      | leido: BOOLEAN         |
+------------------------+      | fecha_envio: TIMESTZ   |
                                +------------------------+

+------------------------+
|  Administradores       |
+------------------------+
| id_admin: UUID (PK)    |
| id_usuario: FK (UQ)    |
| nivel_privilegio: INT  |
| departamento: VARCHAR  |
+------------------------+
        | 1
        v *
+------------------------+
| Auditoria_Admin       |
+------------------------+
| id_auditoria: UUID    |
| id_admin: FK (NULL OK)|
| accion: VARCHAR       |
| tabla_afectada: VARCHAR|
| id_registro: UUID     |
| fecha_accion: TIMESTZ |
+------------------------+
```
```markdown
**Usuarios** (**id_usuario**, email, password, estado_cuenta, fecha_creacion, ultimo_acceso)

**Roles** (**id_rol**, nombre_rol, descripcion_rol)

**Usuario_Roles** (**id_usuario**, **id_rol**)

**Administradores** (**id_admin**, **id_usuario**, nivel_privilegio, departamento_asignado)

**Perfil_Mentee** (**id_mentee**, **id_usuario**, nombre_completo, zona_horaria_preferida, biografia_corta)

**Perfil_Mentor** (**id_mentor**, **id_usuario**, nombre_completo, biografia_profesional, url_video_presentacion, estado_verificacion, url_linkedin)

**Categorias_Habilidad** (**id_categoria**, nombre_categoria, descripcion)

**Habilidades** (**id_habilidad**, **id_categoria**, nombre_habilidad, validada_por_admin)

**Mentor_Habilidades** (**id_mentor**, **id_habilidad**, anios_experiencia, nivel_dominio)

**Paquetes_Mentor** (**id_paquete**, **id_mentor**, titulo_paquete, cantidad_horas_totales, precio_total, estado_activo, fecha_creacion)

**Contratos_Mentoria** (**id_contrato**, **id_mentee**, **id_paquete**, estado_contrato, fecha_adquisicion, horas_consumidas)

**Transacciones_Pago** (**id_transaccion**, **id_contrato**, monto_pagado, moneda, estado_pago, id_pasarela_externa, fecha_procesamiento, url_recibo_externo)

**Disponibilidad_Mentor** (**id_disponibilidad**, **id_mentor**, dia_semana, hora_inicio_utc, hora_fin_utc)

**Sesiones** (**id_sesion**, **id_contrato**, fecha_hora_inicio_utc, fecha_hora_fin_utc, estado_sesion, url_videollamada, notas_internas)

**Resenas_Mentor** (**id_resena**, **id_contrato**, calificacion_estrellas, comentario_texto, fecha_publicacion, reportada)

**Auditoria_Administrativa** (**id_auditoria**, **id_admin**, accion_realizada, tabla_afectada, id_registro_afectado, fecha_accion)

**Salas_Chat** (**id_sala**, **id_mentee**, **id_mentor**, fecha_creacion)

**Mensajes_Chat** (**id_mensaje**, **id_sala**, **id_remitente**, contenido_texto, leido, fecha_envio)
```

---

## 4. Reglas de Negocio Críticas

1. **Unicidad de identidad y claves:** Todas las entidades core utilizan UUID v4 generados por `gen_random_uuid()` como clave primaria. Está **prohibido** usar secuencias enteras autoincrementales para cualquier entidad del dominio.
2. **Encriptación de capa de persistencia:** La base de datos debe tener habilitada la extensión `pgcrypto`. Las contraseñas de usuario nunca persisten en texto plano; el hashing (Argon2id / bcrypt) ocurre en el backend antes del INSERT/UPDATE.
3. **Zona horaria absoluta UTC:** Todo el modelo temporal opera bajo UTC (`TIMESTAMP WITH TIME ZONE`, `hora_inicio_utc`, `hora_fin_utc`). La conversión a hora local del usuario ocurre exclusivamente en la capa de presentación utilizando `zona_horaria_preferida` del Mentee.
4. **Integridad cronológica estricta:** En `Disponibilidad_Mentor` y `Sesiones`, la hora/fecha de inicio debe ser estrictamente menor a la de fin: `CHECK (hora_inicio_utc < hora_fin_utc)` y `CHECK (fecha_hora_inicio_utc < fecha_hora_fin_utc)`.
5. **Restricción de valores económicos y temporales:**
   *   `Paquetes_Mentor.cantidad_horas_totales` > 0.
   *   `Paquetes_Mentor.precio_total` ≥ 0 (tipo `DECIMAL(10,2)`).
   *   `Contratos_Mentoria.horas_consumidas` ≥ 0.
   *   Todo dinero se almacena en `DECIMAL(10,2)`; está **prohibido** usar tipos de punto flotante (`FLOAT`, `REAL`, `DOUBLE PRECISION`) para montos financieros.
6. **Anti double-booking y control de concurrencia:** El agendamiento de sesiones debe resolverse mediante **bloqueo pesimista** (`SELECT FOR UPDATE`) a nivel de fila en PostgreSQL. El código de la aplicación debe ejecutar la verificación de solapamientos dentro de una transacción explícita (`BEGIN ... COMMIT`) para evitar anomalías de lectura no repetible y lost updates bajo alta carga concurrente.
7. **Unicidad de salas de chat:** Solo existe una `Sala_Chat` por par único (Mentee, Mentor). La base de datos garantiza esto mediante `UNIQUE (id_mentee, id_mentor)`.
8. **Unicidad de reseñas:** Una reseña (`Resenas_Mentor`) se vincula 1 a 1 con un `Contrato_Mentoria`. No se permiten múltiples reseñas por contrato.
9. **Idempotencia de pagos:** El campo `Transacciones_Pago.id_pasarela_externa` posee restricción `UNIQUE` para evitar duplicación de transacciones provocada por reintentos de webhooks asíncronos de pasarelas de pago.
10. **Delegación estricta de pagos:** El backend **nunca** retiene fondos, implementa escrow interno ni ejecuta lógica de dispersión de capital. Toda la topología financiera (preautorización, captura, reembolso, comisión de plataforma, depósito en garantía) se ejecuta exclusivamente en la pasarela externa (ej. Stripe Connect con Destination Charges). El backend únicamente almacena `id_pasarela_externa`, `estado_pago`, `monto_pagado` y `url_recibo_externo`.
11. **Verificación antes de visibilidad:** Un mentor con `estado_verificacion != 'verificado'` no debe aparecer en los resultados de búsqueda ni sus paquetes ser contratables, aunque `Paquetes_Mentor.estado_activo = TRUE`.
12. **Videollamada externa:** El sistema no implementa infraestructura propia de WebRTC, servidores TURN/STUN ni negociación SDP. La URL de videollamada (`Sesiones.url_videollamada`) debe provenir de una API de terceros (Zoom, Daily.co, Google Meet) generada por el backend a través de la API REST del proveedor.
13. **Auditoría inmutable:** La tabla `Auditoria_Administrativa` debe poblarse por triggers o por lógica explícita del backend en cada operación de moderación crítica (baneo, verificación, reembolso forzado). El campo `id_admin` permite `NULL` (si el actor es un sistema automatizado), pero `accion_realizada` y `tabla_afectada` son `NOT NULL`.

---

## 5. Glosario de Estados

Las siguientes máquinas de estado están implementadas como restricciones (`CHECK`) a nivel de base de datos y no deben modificarse sin migración explícita:

*   **Usuario (`Usuarios.estado_cuenta`):**
    *   `activo` (default) — cuenta operativa.
    *   `suspendido` — temporalmente inhabilitada por administrador o sistema.
    *   `baneado` — inhabilitación permanente por violación de políticas.

*   **Mentor (`Perfil_Mentor.estado_verificacion`):**
    *   `pendiente` (default) — perfil creado, pendiente de revisión administrativa.
    *   `verificado` — aprobado por un administrador; visible en el catálogo.
    *   `rechazado` — documentación o perfil no cumple estándares; no puede publicar paquetes.

*   **Paquete (`Paquetes_Mentor.estado_activo`):**
    *   `TRUE` (default) — visible y contratable.
    *   `FALSE` — oculto del catálogo (pausa comercial o agotamiento).

*   **Contrato de Mentoría (`Contratos_Mentoria.estado_contrato`):**
    *   `pendiente_pago` (default) — creado, esperando confirmación de pago.
    *   `activo` — pago confirmado, horas disponibles para agendar.
    *   `completado` — todas las horas consumidas o fecha de vigencia alcanzada.
    *   `cancelado` — cancelado por usuario o por fallo de pago; activa política de reembolso según reglas de negocio.

*   **Pago / Transacción (`Transacciones_Pago.estado_pago`):**
    *   `procesando` (default) — orden enviada a la pasarela, esperando webhook.
    *   `completado` — fondos capturados o preautorización confirmada.
    *   `fallido` — rechazo por pasarela, fondos insuficientes o fraude.
    *   `reembolsado` — devolución total o parcial ejecutada.

*   **Sesión Agendada (`Sesiones.estado_sesion`):**
    *   `programada` (default) — fecha futura confirmada dentro del contrato activo.
    *   `en_curso` — videollamada iniciada o marcada como iniciada por el sistema/usuario.
    *   `finalizada` — sesión completada, horas debitadas del contrato.
    *   `ausente` (no-show) — mentee o mentor no se presentó; activa regla de preautorización/penalización (gestionada por pasarela externa).
    *   `cancelada` — anulada antes de su inicio según política de cancelación.

*   **Mensaje (`Mensajes_Chat.leido`):**
    *   `FALSE` (default) — mensaje no visualizado por el destinatario.
    *   `TRUE` — mensaje marcado como leído.

*   **Reseña (`Resenas_Mentor.reportada`):**
    *   `FALSE` (default) — reseña pública normal.
    *   `TRUE` — marcada por un administrador para revisión de moderación; puede ocultarse del frontend.

---

## 6. Notas para Inyección de Contexto a IA

*   **Obligatorio — PK UUID y pgcrypto:** Todas las entidades deben usar UUID generados por `gen_random_uuid()`. La extensión `pgcrypto` debe existir en el esquema de PostgreSQL. No está permitido reemplazar UUIDs por enteros autoincrementales bajo ninguna circunstancia.
*   **Obligatorio — Timestamps UTC:** Todo campo temporal del dominio backend usa `TIMESTAMP WITH TIME ZONE` en UTC. El frontend es responsable de la localización usando `Perfil_Mentee.zona_horaria_preferida`. No almacenar horas locales en la base de datos.
*   **Obligatorio — DECIMAL para dinero:** Todo campo monetario (`precio_total`, `monto_pagado`) usa `DECIMAL(10,2)`. Prohibido `FLOAT`, `REAL` o `DOUBLE PRECISION` para cualquier cálculo o almacenamiento financiero.
*   **Obligatorio — ON DELETE RESTRICT en trazabilidad crítica:** No modificar las restricciones de borrado en `Contratos_Mentoria`, `Transacciones_Pago`, `Categorias_Habilidad` ni `Habilidades` a `CASCADE`. La integridad referencial debe preservar el historial financiero y transaccional. Solo `Usuarios`, `Perfil_Mentor`, `Perfil_Mentee`, `Salas_Chat`, `Mensajes_Chat`, `Disponibilidad_Mentor` y `Sesiones` permiten `ON DELETE CASCADE`.
*   **Obligatorio — Bloqueo pesimista en reservas:** La creación de sesiones debe implementarse con `SELECT FOR UPDATE` sobre la disponibilidad del mentor y las sesiones existentes dentro de una transacción serializable o con aislamiento cuidadoso, para prevenir double-booking. No confiar en validaciones a nivel de aplicación solamente.
*   **Obligatorio — Chat único por par:** La restricción `UNIQUE (id_mentee, id_mentor)` en `Salas_Chat` es inmutable. No permitir que la lógica de negocio cree múltiples salas para el mismo par.
*   **Obligatorio — Idempotencia pasarela:** El campo `id_pasarela_externa` en `Transacciones_Pago` es `UNIQUE` y no nulo en transacciones confirmadas. Todo endpoint de webhook debe primero intentar insertar/upsert usando este identificador para evitar duplicados. El backend no debe implementar lógica de flujo de caja (escrow, retención, dispersión); delegar todo a la pasarela externa.
*   **Obligatorio — Estados como CHECK constraints:** Los valores de estado (`estado_cuenta`, `estado_verificacion`, `estado_contrato`, `estado_pago`, `estado_sesion`, `nivel_dominio`) están restringidos por `CHECK` a nivel de base de datos. Cualquier lógica de transición de estado en el backend debe respetar este enum; ampliar un estado requiere migración DDL.
*   **Obligatorio — Índices estratégicos:** Los índices definidos (`idx_usuarios_email`, `idx_sesiones_fechas`, `idx_contratos_mentee`, `idx_contratos_paquete`, `idx_paquetes_mentor`, `idx_mensajes_historial`) son obligatorios para garantizar los SLAs de latencia (< 200 ms en búsqueda). No omitir su creación.
*   **Obligatorio — Videollamada externa:** No generar código para servidores TURN/STUN, negociación SDP ni protocolos UDP de bajo nivel. La arquitectura de videollamada consiste en: (1) backend llama API REST del proveedor externo para crear una sala, (2) almacena la URL en `Sesiones.url_videollamada`, (3) frontend redirige al usuario a esa URL o incrusta el iframe/widget del proveedor.
*   **Obligatorio — Recibos externos:** No generar módulos de serialización XML, firmas RSA, ni consumo de SOAP gubernamental. El recibo/comprobante fiscal es responsabilidad de la pasarela externa. El backend solo recibe `url_recibo_externo` desde el webhook y lo persiste en `Transacciones_Pago` para consulta del usuario.
*   **Obligatorio — Verificación antes de visibilidad:** Un mentor con `estado_verificacion != 'verificado'` no debe aparecer en los resultados de búsqueda ni sus paquetes ser contratables, aunque `Paquetes_Mentor.estado_activo = TRUE`.
*   **Obligatorio — Auditoría inmutable:** La tabla `Auditoria_Administrativa` debe poblarse por triggers o por lógica explícita del backend en cada operación de moderación crítica (baneo, verificación, reembolso forzado). El campo `id_admin` permite `NULL` (si el actor es un sistema automatizado), pero `accion_realizada` y `tabla_afectada` son `NOT NULL`.
