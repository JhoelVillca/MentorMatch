# Guia para colaborar en MentorMatch

Este archivo es una referencia rapida para mantener el proyecto ordenado. Son practicas recomendadas para trabajar mejor. No son reglas estrictas, pero traten de seguirlas.

## 1. Nombres de las ramas (Sugerencia)
Para saber en que esta trabajando cada uno sin tener que adivinar, es buena idea usar prefijos sencillos al crear una rama nueva:
* `feat/` para cosas nuevas (ejemplo: `feat/pantalla-perfil`)
* `fix/` para arreglar errores (ejemplo: `fix/boton-roto`)
* `chore/` para tareas de mantenimiento o actualizar cosas (ejemplo: `chore/actualizar-readme`)

## 2. Mensajes de Commit
Intenten que los mensajes de commit nos digan que paso sin tener que leer todo el codigo. Un formato util y directo es:
* `feat: agrega formulario de registro`
* `fix: resuelve problema de doble reserva`
* `docs: actualiza el documento de arquitectura`

## 3. Pull Requests (Revision entre nosotros)
Cuando tengas tu parte lista y quieras unirla a la rama principal, deberias seguir estos puntos:
* Asegurate de que el proyecto corre bien localmente antes de subirlo.
* Es muy recomendable que alguien mas le de un vistazo rapido a los cambios antes de fusionarlos. Para que no rompan lo que ya funciona.
* Trata de no mezclar demasiadas cosas distintas en un solo Pull Request. Si es muy grande, es mas dificil de revisar para los demas.

## 4. Como levantar el proyecto en tu maquina
Para tener el entorno local funcionando sin problemas:
1. Clona el repositorio.
2. Copia el archivo `.env.example` y nombralo `.env`, luego llena los datos necesarios.
3. Te recomendamos usar Docker (`docker compose up -d --build`) para levantar todo (base de datos, backend, frontend) de forma limpia y rapida.


