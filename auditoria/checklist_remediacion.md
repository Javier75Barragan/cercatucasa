# Checklist de Remediación - CercaYa

**Fecha de Creación:** 2026-04-29
**Última Actualización:** 2026-04-29

---

## 🔴 PRIORIDAD 1 - CRÍTICA (Completar en 24-48 horas)

### Seguridad de Credenciales

- [ ] **Eliminar `.env` del repositorio**
  ```bash
  cd C:\Users\Bafer\OneDrive\CercaYa
  git rm --cached backend/.env
  git commit -m "security: Remove .env from version control"
  ```

- [ ] **Agregar `.env` al `.gitignore`**
  ```bash
  echo "backend/.env" >> .gitignore
  echo "frontend/.env" >> .gitignore
  echo "*.env" >> .gitignore
  ```

- [ ] **Rotar contraseña de PostgreSQL**
  - [ ] Cambiar contraseña en servidor PostgreSQL
  - [ ] Actualizar `backend/.env` local (no commitear)
  - [ ] Actualizar variables de entorno en Vercel/Railway

- [ ] **Rotar JWT_SECRET**
  - [ ] Generar nuevo secret (min 32 caracteres aleatorios)
  ```bash
  # Generar secret seguro
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - [ ] Actualizar en variables de entorno de producción

- [ ] **Crear `.env.example` seguro**
  - [ ] Documentar variables requeridas
  - [ ] Usar valores de ejemplo genéricos

### Endpoint de Limpieza de Base de Datos

- [ ] **ELIMINAR ruta `/admin/cleanup-database-2026`**
  - [ ] Remover líneas 276-294 de `backend/src/routes/auth.ts`
  - [ ] Verificar que no haya referencias a esta ruta en el frontend
  - [ ] Revisar logs para detectar si fue usada maliciosamente

### Validación de JWT_SECRET

- [ ] **Agregar validación al inicio del backend**
  - [ ] Verificar que JWT_SECRET esté configurado
  - [ ] Validar longitud mínima (32 caracteres)
  - [ ] Terminar la ejecución si no es válido

---

## 🟡 PRIORIDAD 2 - ALTA (Completar en 1 semana)

### Sistema de Migraciones

- [ ] **Instalar herramienta de migraciones**
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

- [ ] **Instalar express-rate-limit**
  ```bash
  cd backend
  npm install express-rate-limit
  ```

- [ ] **Configurar rate limiting en auth endpoints**
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

- [ ] **Configurar rate limiting general para API**
  ```typescript
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));
  ```

### Validación de Datos con Zod

- [ ] **Instalar Zod (ya está instalado, verificar)**
  ```bash
  npm list zod
  ```

- [ ] **Crear schemas para cada endpoint**
  - [ ] `backend/src/schemas/auth.ts`
  - [ ] `backend/src/schemas/vendors.ts`
  - [ ] `backend/src/schemas/products.ts`
  - [ ] `backend/src/schemas/incidents.ts`
  - [ ] `backend/src/schemas/notifications.ts`

- [ ] **Aplicar validación en todos los endpoints**
  - [ ] Reemplazar validaciones manuales con Zod
  - [ ] Agregar mensajes de error personalizados

### Autenticación WebSocket

- [ ] **Agregar middleware de autenticación en Socket.IO**
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

- [ ] **Validar permisos en eventos críticos**
  - [ ] `update-location`: Verificar que el vendor pertenece al usuario
  - [ ] `toggle-visibility`: Verificar propiedad
  - [ ] `join-vendor-room`: Verificar que el usuario es dueño del vendor

### Refresh Tokens

- [ ] **Implementar sistema de refresh tokens**
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

- [ ] **Crear tests de rutas**
  - [ ] `backend/src/routes/__tests__/auth.test.ts`
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

- [ ] **Implementar logging estructurado**
  ```bash
  npm install winston
  ```

- [ ] **Configurar Sentry para errores**
  ```bash
  npm install @sentry/node
  ```

- [ ] **Configurar health checks**
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
| Crítica | 8 | 0 | 8 | 0% |
| Alta | 25 | 0 | 25 | 0% |
| Media | 20 | 0 | 20 | 0% |
| **TOTAL** | **53** | **0** | **53** | **0%** |

### Historial de Cambios

| Fecha | Cambio | Completado |
|-------|--------|------------|
| 2026-04-29 | Creación del checklist | ✅ |

---

## Notas

- Los items críticos deben completarse antes de cualquier deploy a producción
- Los items de testing son esenciales para prevenir regresiones
- La documentación debe actualizarse con cada cambio significativo

---

*Última actualización: 2026-04-29*
