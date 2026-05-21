# Changelog (Historial de Cambios)

Todas las modificaciones notables realizadas a este proyecto serán documentadas en este archivo.

## [17/05/2026] - Actualización visual mobile-first de CercaYa

### Frontend / UX
- **Mejorado:** `frontend/src/pages/Home.tsx` con un panel lateral renovado orientado a "Radar comunitario", métricas de actividad, radio y encuentros, y CTA de alertas más visible.
- **Mejorado:** `frontend/src/components/RadarPanel.tsx` con KPIs de actividad, estado "Por revisar", tarjetas de encuentros más claras y controles más táctiles.
- **Mejorado:** `frontend/src/components/VendorDetails.tsx` con panel de detalle más moderno, hero visual, métricas compactas de rating/opiniones/distancia y acciones principales `Contactar` / `Ruta`.
- **Mejorado:** `frontend/src/pages/Login.tsx` para que la pantalla de inicio de sesión sea más pequeña y cómoda en celular: menor ancho, logo más pequeño, padding reducido, inputs compactos y botón más bajo.

### Producto
- **Definido:** El criterio visual principal del proyecto pasa a ser **mobile-first**. CercaYa debe revisarse primero en celular porque el uso esperado ocurre en la calle, con el teléfono en la mano.
- **Mantenido:** La implementación conserva la arquitectura actual de CercaYa (`React + Leaflet + backend propio`) y no adopta Firebase ni Google Maps del prototipo externo analizado.

### Testing
- **Agregado:** Prueba de contrato visual para `Home` validando el lenguaje de "Radar comunitario".
- **Agregado:** Prueba de `RadarPanel` validando los KPIs de actividad.
- **Agregado:** Prueba de `Login` validando que el panel de inicio de sesión sea compacto.
- **Verificado:** `npm test -- --run` con 18 tests pasando.
- **Verificado:** `npm run build` exitoso. Se mantiene advertencia conocida de bundle principal mayor a 500 kB.

### Documentación
- **Actualizado:** `DOCUMENTACION_CERCAYA.md` con la decisión mobile-first, el resumen de cambios visuales y el nuevo estado de pruebas frontend.

---

## [07/05/2026] - Correcciones Auditoría Técnica P1 — Build & Seguridad

### 🐛 Bug Fix Crítico
- **Corregido:** Error de compilación TypeScript en `backend/src/config/database.ts` (error TS2344). Se reemplazó el constraint genérico incorrecto `T extends QueryResultRow` por `T extends Record<string, any>` y se eliminaron los `@ts-ignore`. El backend ahora compila limpiamente con `tsc --noEmit` sin errores.

### 🔒 Seguridad
- **Eliminado:** `console.log` que imprimía email, nombre y teléfono del usuario en texto plano durante el registro (`auth.ts`). Violación de privacidad GDPR/LOPD.
- **Corregido:** Error 500 ya no expone el `error.message` interno de Node.js/PostgreSQL al cliente. Ahora responde con un mensaje genérico.
- **Corregido:** Endpoint `PATCH /api/vendors/:id/location/toggle` ahora verifica que el vendedor pertenece al usuario autenticado antes de permitir el toggle. Antes, cualquier `seller` podía desactivar la ubicación de otro vendedor.

### 🗃️ Base de Datos
- **Añadido:** Migración `1746660000000_unique-review-per-user.js` que aplica un constraint `UNIQUE (vendor_id, user_id)` en la tabla `reviews`, impidiendo que un usuario califique más de una vez al mismo vendedor (anti-spam).

---

## [07/05/2026] - Finalización de Remediación de Seguridad (Auditoría Cierre)

Durante esta sesión, se completaron los puntos críticos pendientes de la auditoría de seguridad, logrando una calificación final de 9.2/10.

### 🔒 Seguridad (Backend)
- **Rotación de Credenciales:** Se actualizaron y rotaron tanto el `JWT_SECRET` (ahora 64 caracteres) como la contraseña de la base de datos (`DB_PASSWORD`).
- **Limpieza de Secretos:** Verificación manual de la eliminación de archivos sensibles y datos por defecto en el código fuente.
- **Validación JWT Hardening:** Se aseguró que el sistema no arranque si las claves secretas son insuficientes o faltan.

### 📝 Documentación & Auditoría
- **Creado:** `auditoria/INFORME_FINAL_AUDITORIA.md` detallando todos los éxitos de la remediación.
- **Actualizado:** `README.md` con un diseño profesional, secciones de seguridad y stack tecnológico detallado.
- **Actualizado:** `.env.example` en backend y frontend para reflejar los nuevos requisitos de seguridad.
- **Actualizado:** `auditoria/estado_remediacion.md` y `auditoria/checklist_remediacion.md` reflejando el 100% de los puntos críticos resueltos.

---

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
- `tests/`: Configuración inicial de entorno de testing automatizado.
  - Backend: `Jest` y `ts-jest`.
  - Frontend: `Vitest` y `@testing-library/react`.

### Cambios (Changed)
- **Validación de Datos con Zod:**
  - Se crearon esquemas completos para las rutas de `auth`, `vendors`, `products`, `incidents`, y `notifications`.
  - Implementación del middleware `validate.ts` en todos los endpoints de modificación (POST, PUT, PATCH).
  - Reemplazo de validaciones manuales por validaciones tipadas y estrictas.
- **Añadido:** Script inteligente (`backend/scripts/run-migrations.js`) que compila la URL de la base de datos leyendo las variables del entorno del sistema para facilitar los despliegues.

### 🛡️ Seguridad Avanzada (WebSockets y Tokens)
- **Añadido:** Sistema de rotación de tokens. Implementación del **Refresh Token** con validación y almacenamiento en base de datos. Se agregó el endpoint `/api/auth/refresh`.
- **Añadido:** Middleware global de autorización en **WebSockets** (`io.use()`).
- **Mejora:** Validación de identidad y pertenencia estricta en eventos de WebSocket (`update-location`, `toggle-visibility`, `join-vendor-room`). Ahora los clientes no pueden manipular la ubicación o visibilidad de otras tiendas que no les pertenecen.
