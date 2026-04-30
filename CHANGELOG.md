# Changelog (Historial de Cambios)

Todas las modificaciones notables realizadas a este proyecto serán documentadas en este archivo.

## [30/04/2026] - Seguridad, Hardening y Tooling IA

Durante esta sesión, el objetivo principal fue mitigar vulnerabilidades críticas de seguridad detectadas en la auditoría inicial y preparar el entorno con herramientas automatizadas de IA para acelerar el desarrollo futuro.

### 🔒 Seguridad (Backend)
- **Eliminado:** Endpoint destructivo `/api/auth/admin/cleanup-database-2026` que permitía borrar la base de datos entera sin autenticación.
- **Mejora:** Migración de la dependencia de hash de contraseñas de `bcryptjs` a `bcrypt` nativo para mayor seguridad y rendimiento.
- **Añadido:** Sistema de **Rate Limiting** (Limitación de peticiones) en las rutas de `/api/auth` (máximo 10 intentos cada 15 minutos) para prevenir ataques de fuerza bruta.
- **Añadido:** Validación crítica en el arranque del servidor (`backend/src/index.ts`). El servidor ahora abortará la ejecución si no se provee la variable de entorno `JWT_SECRET`.
- **Modificado:** Eliminado el *fallback* inseguro que usaba `'your-secret-key'` por defecto en los tokens JWT si no existía la variable de entorno.

### ⚙️ Configuración y Entorno
- **Modificado:** Archivo `.gitignore` actualizado con reglas estrictas para bloquear cualquier archivo `.env` en todo el proyecto y evitar filtraciones de credenciales.

### 🤖 Integración de IA y Herramientas Agentic
- **Añadido:** Instalación global de los paquetes de **Antigravity Skills**:
  - `Essentials`
  - `Full-Stack Developer`
  - `QA & Testing`
  - `Security Developer`
- **Añadido:** Configuración de herramientas de **AITMPL** (`claude-code-templates`) en el directorio `.claude/` y `.mcp.json`:
  - Integración MCP para **PostgreSQL** (permite a la IA realizar consultas directas).
  - Agente `code-reviewer` para auditorías automáticas de commits.
  - Comando `/generate-tests` para creación rápida de pruebas automatizadas.

### 📝 Documentación
- **Añadido:** Este archivo `CHANGELOG.md` para llevar un registro histórico de los cambios realizados en el proyecto.

### 🏗️ Infraestructura y Arquitectura (Fase 2)
- **Mejora:** Transición de la inicialización inline de la base de datos (con queries directas en `database.ts`) a un flujo profesional de migraciones mediante `node-pg-migrate`.
- **Añadido:** Configuración base para pruebas automatizadas con **Jest** (Backend) y **Vitest + Testing Library** (Frontend).
- **Añadido:** Script inteligente (`backend/scripts/run-migrations.js`) que compila la URL de la base de datos leyendo las variables del entorno del sistema para facilitar los despliegues.

### 🛡️ Seguridad Avanzada (WebSockets y Tokens)
- **Añadido:** Sistema de rotación de tokens. Implementación del **Refresh Token** con validación y almacenamiento en base de datos. Se agregó el endpoint `/api/auth/refresh`.
- **Añadido:** Middleware global de autorización en **WebSockets** (`io.use()`).
- **Mejora:** Validación de identidad y pertenencia estricta en eventos de WebSocket (`update-location`, `toggle-visibility`, `join-vendor-room`). Ahora los clientes no pueden manipular la ubicación o visibilidad de otras tiendas que no les pertenecen.
