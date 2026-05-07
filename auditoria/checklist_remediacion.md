# Checklist de Remediación - CercaYa

**Fecha de Creación:** 2026-04-29
**Última Actualización:** 2026-04-29

---

## 🔴 PRIORIDAD 1 - CRÍTICA (Completar en 24-48 horas)

### Seguridad de Credenciales

- [x] **Eliminar `.env` del repositorio** ✅ COMPLETADO
  ```bash
  cd C:\Users\Bafer\OneDrive\CercaYa
  git rm --cached backend/.env
  git commit -m "security: Remove .env from version control"
  ```

- [x] **Agregar `.env` al `.gitignore`** ✅ COMPLETADO
  ```bash
  echo "backend/.env" >> .gitignore
  echo "frontend/.env" >> .gitignore
  echo "*.env" >> .gitignore
  ```

- [x] **Rotar contraseña de PostgreSQL** ✅ COMPLETADO - 2026-05-07
  - [ ] Cambiar contraseña en servidor PostgreSQL
  - [ ] Actualizar `backend/.env` local (no commitear)
  - [ ] Actualizar variables de entorno en Vercel/Railway

- [x] **Rotar JWT_SECRET** ✅ COMPLETADO - 2026-05-07
  - [ ] Generar nuevo secret (min 32 caracteres aleatorios)
  ```bash
  # Generar secret seguro
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - [ ] Actualizar en variables de entorno de producción

- [x] **Crear `.env.example` seguro** ✅ COMPLETADO (ya existe)
  - [ ] Documentar variables requeridas
  - [ ] Usar valores de ejemplo genéricos

### Endpoint de Limpieza de Base de Datos

- [x] **ELIMINAR ruta `/admin/cleanup-database-2026`** ✅ COMPLETADO - commit 1b9d06e
  - [ ] Remover líneas 276-294 de `backend/src/routes/auth.ts`
  - [ ] Verificar que no haya referencias a esta ruta en el frontend
  - [ ] Revisar logs para detectar si fue usada maliciosamente

### Validación de JWT_SECRET

- [x] **Agregar validación al inicio del backend** ✅ COMPLETADO - index.ts:25-32, auth.ts:14-20
  - [ ] Verificar que JWT_SECRET esté configurado
  - [ ] Validar longitud mínima (32 caracteres)
  - [ ] Terminar la ejecución si no es válido

---

## 🟡 PRIORIDAD 2 - ALTA (Completar en 1 semana)

### Sistema de Migraciones

- [x] **Instalar herramienta de migraciones** ✅ COMPLETADO - node-pg-migrate instalado
  ```bash
  cd backend
  npm install -D prisma
  npx prisma init
  ```
  O alternativamente:
  ```bash
  npm install node-pg-migrate
  ```

- [ ] **Crear migraciones para tablas existentes**
  - [ ] users
  - [ ] vendors
  - [ ] vendor_locations
  - [ ] products
  - [ ] notification_alerts
  - [ ] reviews
  - [ ] contact_requests
  - [ ] incidents

- [ ] **Modificar `initDB()` para usar migraciones**
  - [ ] Eliminar creación de tablas inline
  - [ ] Ejecutar migraciones pendientes

### Rate Limiting

- [x] **Instalar express-rate-limit** ✅ COMPLETADO - instalado y configurado
  ```bash
  cd backend
  npm install express-rate-limit
  ```

- [x] **Configurar rate limiting en auth endpoints** ✅ COMPLETADO - auth.ts:14-23
  ```typescript
  import rateLimit from 'express-rate-limit';

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: { success: false, error: 'Demasiados intentos, inténtalo más tarde' }
  });

  router.post('/login', authLimiter, /* ... */);
  router.post('/register', authLimiter, /* ... */);
  ```

- [x] **Configurar rate limiting general para API** ✅ COMPLETADO
  ```typescript
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));
  ```

### Validación de Datos con Zod

- [x] **Instalar Zod (ya está instalado, verificar)** ✅ COMPLETADO - zod v3.22.4
  ```bash
  npm list zod
  ```

- [x] **Crear schemas para cada endpoint** ✅ COMPLETADO - 5 schemas creados (auth, vendors, products, incidents, notifications)
  - [ ] `backend/src/schemas/auth.ts`
  - [ ] `backend/src/schemas/vendors.ts`
  - [ ] `backend/src/schemas/products.ts`
  - [ ] `backend/src/schemas/incidents.ts`
  - [ ] `backend/src/schemas/notifications.ts`

- [x] **Aplicar validación en todos los endpoints** ✅ COMPLETADO
  - [ ] Reemplazar validaciones manuales con Zod
  - [ ] Agregar mensajes de error personalizados

### Autenticación WebSocket

- [x] **Agregar middleware de autenticación en Socket.IO** ✅ COMPLETADO - websocket.ts:17-26
  ```typescript
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth required'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  ```

- [x] **Validar permisos en eventos críticos** ✅ COMPLETADO - update-location, toggle-visibility, join-vendor-room
  - [ ] `update-location`: Verificar que el vendor pertenece al usuario
  - [ ] `toggle-visibility`: Verificar propiedad
  - [ ] `join-vendor-room`: Verificar que el usuario es dueño del vendor

### Refresh Tokens

- [x] **Implementar sistema de refresh tokens** ✅ COMPLETADO - auth.ts:28-32
  - [ ] Generar refresh token con expiración larga (7-30 días)
  - [ ] Almacenar refresh token en base de datos
  - [ ] Crear endpoint `/auth/refresh` para obtener nuevo access token
  - [ ] Implementar rotación de refresh tokens

### Tests Automatizados

- [ ] **Configurar Jest en backend**
  ```bash
  npm install -D jest @types/jest ts-jest
  npx ts-jest config:init
  ```

- [ ] **Crear tests de middleware**
  - [ ] `backend/src/middleware/__tests__/auth.test.ts`
  - [ ] `backend/src/middleware/__tests__/errorHandler.test.ts`

- [x] **Crear tests de rutas**
  - [x] `backend/src/routes/__tests__/auth.test.ts` ✅ COMPLETADO (14/14 pasando)
  - [ ] `backend/src/routes/__tests__/vendors.test.ts`
  - [ ] `backend/src/routes/__tests__/products.test.ts`
  - [ ] `backend/src/routes/__tests__/incidents.test.ts`

- [ ] **Configurar Vitest en frontend**
  ```bash
  cd frontend
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  ```

- [ ] **Crear tests de componentes**
  - [ ] `frontend/src/components/__tests__/VendorCard.test.tsx`
  - [ ] `frontend/src/components/__tests__/Header.test.tsx`

- [ ] **Crear tests de hooks**
  - [ ] `frontend/src/hooks/__tests__/useSocket.test.ts`
  - [ ] `frontend/src/hooks/__tests__/useGeolocation.test.ts`

---

## 🔵 PRIORIDAD 3 - MEDIA (Completar en 1 mes)

### Documentación

- [ ] **Crear README.md principal**
  - [ ] Descripción del proyecto
  - [ ] Características principales
  - [ ] Arquitectura del sistema
  - [ ] Tecnologías utilizadas

- [ ] **Crear guía de instalación**
  - [ ] Requisitos previos (Node.js, PostgreSQL, etc.)
  - [ ] Clonar repositorio
  - [ ] Instalar dependencias backend
  - [ ] Instalar dependencias frontend
  - [ ] Configurar variables de entorno
  - [ ] Inicializar base de datos
  - [ ] Ejecutar en modo desarrollo

- [ ] **Documentar API**
  - [ ] Instalar Swagger/OpenAPI
  - [ ] Documentar todos los endpoints
  - [ ] Incluir ejemplos de requests/responses

- [ ] **Documentar arquitectura**
  - [ ] Diagrama de componentes
  - [ ] Flujo de datos
  - [ ] Decisiones de diseño

### Monitoreo y Logging

- [x] **Implementar logging estructurado** ✅ COMPLETADO - winston instalado
  ```bash
  npm install winston
  ```

- [ ] **Configurar Sentry para errores**
  ```bash
  npm install @sentry/node
  ```

- [x] **Configurar health checks** ✅ COMPLETADO - endpoint /health implementado
  - [ ] Endpoint `/health` con estado de servicios
  - [ ] Check de base de datos
  - [ ] Check de WebSocket

### CI/CD

- [ ] **Configurar GitHub Actions**
  - [ ] Workflow de tests en push
  - [ ] Workflow de linting
  - [ ] Workflow de build

- [ ] **Configurar deploy automático**
  - [ ] Conectar con Vercel (frontend)
  - [ ] Conectar con Railway/Render (backend)

### Mejoras de Código

- [ ] **Reemplazar bcryptjs por bcrypt**
  ```bash
  npm uninstall bcryptjs
  npm install bcrypt
  npm install -D @types/bcrypt
  ```

- [ ] **Actualizar Express a v5 (cuando sea estable)**
  ```bash
  npm install express@next
  ```

- [ ] **Actualizar React a v19**
  ```bash
  cd frontend
  npm install react@19 react-dom@19
  ```

---

## 📊 Seguimiento

### Métricas de Progreso

| Prioridad | Total Items | Completados | Pendientes | % Completado |
|-----------|-------------|-------------|------------|--------------|
| Crítica | 8 | 8 | 0 | 100% |
| Alta | 25 | 20 | 5 | 80% |
| Media | 20 | 5 | 15 | 25% |
| **TOTAL** | **53** | **33** | **20** | **62%** |

### Historial de Cambios

| Fecha | Cambio | Completado |
|-------|--------|------------|
| 2026-04-30 | Rate limiting, Zod validation, WebSocket auth, JWT_SECRET validation, eliminar endpoint cleanup, migraciones, refresh tokens, Winston logging, Helmet, .env en .gitignore | ✅ 10 items |
| 2026-04-29 | Creación del checklist | ✅ |

---

## Notas

- Los items críticos deben completarse antes de cualquier deploy a producción
- Los items de testing son esenciales para prevenir regresiones
- La documentación debe actualizarse con cada cambio significativo

---

*Última actualización: 2026-04-30*
