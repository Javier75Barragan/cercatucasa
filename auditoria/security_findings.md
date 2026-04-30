# Hallazgos de Seguridad - CercaYa

**Fecha:** 2026-04-29
**Clasificación:** CONFIDENCIAL

---

## Vulnerabilidades Críticas

### 1. CREDENTIALS_EXPOSED_ENV (CVSS: 9.1)

**Descripción:** Credenciales de base de datos y secretos JWT expuestos en archivo `.env`

**Ubicación:** `backend/.env`

**Evidencia:**
```
DB_PASSWORD=Bafer1975
JWT_SECRET=super_secreto_cercaya_2026
```

**Impacto:**
- Acceso no autorizado a la base de datos
- Falsificación de tokens JWT
- Suplantación de identidad de usuarios

**Remediación:**
```bash
# 1. Eliminar el archivo .env del repositorio
git rm --cached backend/.env

# 2. Agregar al .gitignore
echo "backend/.env" >> .gitignore

# 3. Rotar credenciales inmediatamente
#    - Cambiar contraseña de PostgreSQL
#    - Generar nuevo JWT_SECRET (min 32 caracteres aleatorios)

# 4. Crear .env.example seguro
cat > backend/.env.example << EOF
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cercaya
DB_USER=postgres
DB_PASSWORD=<tu_contraseña_segura>
JWT_SECRET=<secreto_generado_seguro>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
EOF
```

---

### 2. UNPROTECTED_ADMIN_ENDPOINT (CVSS: 10.0)

**Descripción:** Endpoint de administración que permite truncar toda la base de datos sin autenticación

**Ubicación:** `backend/src/routes/auth.ts:276-294`

**Evidencia:**
```typescript
router.post('/admin/cleanup-database-2026', asyncHandler(async (_req, res) => {
  console.log('🧹 Limpieza de producción iniciada...');
  await query(`TRUNCATE TABLE incidents, contact_requests, reviews, notification_alerts, products, vendor_locations, vendors, users CASCADE;`);
  res.json({ success: true, message: 'Base de datos de producción limpia' });
}));
```

**Impacto:**
- Eliminación completa de todos los datos
- Pérdida total de información de usuarios, vendedores, productos
- Interrupción total del servicio

**Remediación Inmediata:**

Opción A - Eliminar la ruta:
```typescript
// ELIMINAR completamente las líneas 276-294 de backend/src/routes/auth.ts
```

Opción B - Proteger con autenticación y verificación de entorno:
```typescript
router.post('/admin/cleanup-database-2026',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Esta operación no está permitida en producción'
      });
    }

    // Requerir confirmación explícita
    const { confirm } = req.body;
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Se requiere confirmación explícita'
      });
    }

    console.log('🧹 Limpieza de base de datos solicitada por:', req.user.email);
    await query(`TRUNCATE TABLE incidents, contact_requests, reviews, notification_alerts, products, vendor_locations, vendors, users CASCADE;`);
    res.json({ success: true, message: 'Base de datos limpia' });
  })
);
```

---

### 3. WEAK_JWT_SECRET_FALLBACK (CVSS: 7.5)

**Descripción:** El middleware de autenticación usa un secret por defecto débil

**Ubicación:** `backend/src/middleware/auth.ts:14`

**Evidencia:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

**Impacto:**
- Si JWT_SECRET no está configurado, cualquier atacante puede firmar tokens
- Autenticación bypass completa

**Remediación:**
```typescript
// Validar que JWT_SECRET esté configurado
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET no está configurado');
  console.error('   Configure la variable de entorno JWT_SECRET con un valor seguro (min 32 caracteres)');
  process.exit(1);
}

// Validar longitud mínima
if (JWT_SECRET.length < 32) {
  console.error('❌ ERROR: JWT_SECRET debe tener al menos 32 caracteres');
  process.exit(1);
}
```

---

### 4. MISSING_INPUT_VALIDATION (CVSS: 6.5)

**Descripción:** Validación insuficiente de datos de entrada en múltiples endpoints

**Ubicaciones afectadas:**
- `backend/src/routes/auth.ts` - Registro de usuario
- `backend/src/routes/vendors.ts` - Creación de vendedores
- `backend/src/routes/products.ts` - Creación de productos
- `backend/src/routes/incidents.ts` - Reporte de incidentes

**Ejemplo vulnerable:**
```typescript
// En vendors.ts, línea 50-65
const {
  name,
  description,
  type,
  category,
  subcategories = [],
  phone,
  whatsapp,
  email,
  website,
  address,
  schedule,
  latitude,
  longitude,
  accuracy = 10,
} = req.body;
```

**Remediación con Zod:**
```typescript
import { z } from 'zod';

const CreateVendorSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['ambulant', 'store', 'pharmacy', 'service']),
  category: z.string().min(2).max(100),
  subcategories: z.array(z.string()).default([]),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().max(500).optional(),
  schedule: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).nullable(),
    tuesday: z.object({ open: z.string(), close: z.string() }).nullable(),
    wednesday: z.object({ open: z.string(), close: z.string() }).nullable(),
    thursday: z.object({ open: z.string(), close: z.string() }).nullable(),
    friday: z.object({ open: z.string(), close: z.string() }).nullable(),
    saturday: z.object({ open: z.string(), close: z.string() }).nullable(),
    sunday: z.object({ open: z.string(), close: z.string() }).nullable(),
  }).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(1000).default(10),
});

// En el endpoint:
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const validatedData = CreateVendorSchema.parse(req.body);
  // ... usar validatedData
}));
```

---

### 5. WEBSOCKET_AUTH_BYPASS (CVSS: 5.3)

**Descripción:** Las conexiones WebSocket no validan adecuadamente el token

**Ubicación:** `backend/src/services/websocket.ts`

**Evidencia:**
```typescript
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  // No hay validación de token en la conexión
```

**Remediación:**
```typescript
import { verifyToken } from '../middleware/auth';

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = verifyToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}, Usuario: ${socket.user.email}`);
  // ...
});
```

---

## Checklist de Remediación

### Crítico (24-48 horas)
- [ ] Eliminar `backend/.env` del repositorio
- [ ] Rotar DB_PASSWORD
- [ ] Rotar JWT_SECRET
- [ ] Eliminar o proteger endpoint `/admin/cleanup-database-2026`
- [ ] Agregar validación de JWT_SECRET al iniciar

### Alto (1 semana)
- [ ] Implementar validación con Zod en todos los endpoints
- [ ] Agregar autenticación WebSocket
- [ ] Implementar rate limiting en auth endpoints
- [ ] Agregar `.env` al `.gitignore`

### Medio (1 mes)
- [ ] Implementar refresh tokens
- [ ] Agregar logging de auditoría
- [ ] Configurar HTTPS en producción
- [ ] Implementar httpOnly cookies para tokens

---

*Documento confidencial - Solo para uso interno*
