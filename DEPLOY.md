# 🚀 Guía de Despliegue - Railway + Vercel

Esta guía te llevará paso a paso para desplegar **CercaYa** en producción.

---

## 📋 Resumen de la Arquitectura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend        │         │   Database      │
│   Vercel        │────────▶│   Railway        │────────▶│   Railway       │
│   (React/Vite)  │  REST   │   (Node.js)      │  Postgres│   (PostgreSQL) │
│                 │  WebSocket│   + Socket.io  │         │   + PostGIS     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 🗄️ Paso 1: Configurar Base de Datos en Railway

### 1.1 Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app/)
2. Inicia sesión con GitHub
3. Click en **"New Project"**

### 1.2 Crear Base de Datos PostgreSQL

1. Click en **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway creará automáticamente una DB con:
   - Usuario
   - Contraseña
   - Host
   - Puerto
   - URL de conexión

### 1.3 Obtener Connection String

1. Click en tu servicio PostgreSQL
2. Ve a la pestaña **"Connection"**
3. Copia el **External Connection String** (se ve como: `postgresql://postgres:password@host:port/dbname`)

> ⚠️ **Importante:** Railway maneja automáticamente la extensión PostGIS. Si no está disponible, crea un servicio nuevo y selecciona "PostgreSQL with PostGIS".

---

## 🔧 Paso 2: Configurar Backend en Railway

### 2.1 Crear Servicio Backend

1. En tu proyecto Railway, click **"New"** → **"GitHub Repo"**
2. Conecta tu repositorio de CercaYa
3. Selecciona solo la carpeta `backend` (o el repo completo si está separado)

### 2.2 Configurar Variables de Entorno

En Railway, ve a la pestaña **"Variables"** y agrega:

```bash
NODE_ENV=production
PORT=3000

# Pega el connection string de la DB
DATABASE_URL=postgresql://postgres:xxxxx@host.railway.internal:5432/cercaya

# JWT Secret (genera uno nuevo y seguro)
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio_min_32_caracteres
JWT_EXPIRES_IN=7d

# CORS - URL de Vercel (la pondrás después)
CORS_ORIGIN=https://cercaya.vercel.app
```

### 2.3 Configurar Docker

Railway detectará automáticamente el `Dockerfile` en `backend/`. Si no:

1. Ve a **"Settings"** → **"Build"**
2. En **"Root Directory"** pon: `backend`
3. Railway usará el Dockerfile automáticamente

### 2.4 Desplegar

1. Railway empezará a buildear automáticamente
2. Espera a que termine (~2-5 minutos)
3. Cuando veas **"Deployed"**, tu backend está online

### 2.5 Obtener URL del Backend

1. Ve a **"Settings"** → **"Domains"**
2. Railway te da una URL tipo: `https://cercaya-backend-production.up.railway.app`
3. **Copia esta URL** - la necesitarás para Vercel

---

## 🎨 Paso 3: Configurar Frontend en Vercel

### 3.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com/)
2. Inicia sesión con GitHub

### 3.2 Importar Repositorio

1. Click en **"Add New Project"**
2. Importa tu repositorio de GitHub
3. En **"Framework Preset"** selecciona **"Vite"**

### 3.3 Configurar Build

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3.4 Configurar Variables de Entorno

En Vercel, ve a **"Settings"** → **"Environment Variables"** y agrega:

```bash
VITE_API_URL=https://cercaya-backend-production.up.railway.app
```

> ⚠️ **Importante:** Reemplaza la URL con la de tu backend en Railway.

### 3.5 Desplegar

1. Click en **"Deploy"**
2. Espera el build (~1-3 minutos)
3. ¡Listo! Tu frontend está en `https://cercaya.vercel.app`

---

## 🔗 Paso 4: Configurar CORS y WebSocket

### 4.1 Actualizar CORS en Railway

1. Vuelve a Railway
2. En **Variables**, actualiza `CORS_ORIGIN`:

```bash
CORS_ORIGIN=https://cercaya.vercel.app
```

3. Railway redeployará automáticamente

### 4.2 Configurar WebSocket para Producción

El código ya está configurado para WebSocket en Railway. Socket.io detecta automáticamente:

- HTTP → WebSocket en desarrollo
- HTTPS → Secure WebSocket en producción

---

## 🧪 Paso 5: Verificar Despliegue

### 5.1 Health Check del Backend

Abre en tu navegador:
```
https://cercaya-backend-production.up.railway.app/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2026-04-15T...",
  "service": "CercaYa API",
  "version": "1.0.0"
}
```

### 5.2 Probar Frontend

Abre:
```
https://cercaya.vercel.app
```

### 5.3 Probar API

```bash
# Probar registro
curl -X POST https://cercaya-backend-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Probar vendors cercanos (requiere lat/lng reales)
curl "https://cercaya-backend-production.up.railway.app/api/vendors/nearby?lat=4.7110&lng=-74.0721&radius=500"
```

---

## 📝 Paso 6: Configurar Dominio Personalizado (Opcional)

### En Vercel (Frontend)

1. Ve a **"Settings"** → **"Domains"**
2. Agrega tu dominio: `cercaya.com`
3. Sigue las instrucciones para configurar DNS

### En Railway (Backend)

1. Ve a **"Settings"** → **"Domains"**
2. Agrega un dominio personalizado
3. Configura los DNS según instrucciones

---

## 🔐 Paso 7: Seguridad en Producción

### Variables Críticas a Verificar

| Variable | Valor Seguro |
|----------|--------------|
| `JWT_SECRET` | Mínimo 32 caracteres aleatorios |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Solo tu dominio de Vercel |

### Generar JWT Secret Seguro

```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y pégalo en Railway.

---

## 🚨 Troubleshooting

### Error: CORS en Frontend

**Síntoma:** Mensajes de error sobre CORS en la consola del navegador.

**Solución:**
1. Verifica que `CORS_ORIGIN` en Railway sea exactamente tu URL de Vercel
2. Asegúrate de que no haya trailing slash: `https://cercaya.vercel.app` ✅

### Error: Database Connection

**Síntoma:** Backend no inicia, error de conexión a DB.

**Solución:**
1. Verifica que `DATABASE_URL` sea correcto en Railway
2. Asegúrate de que PostgreSQL esté corriendo
3. Verifica que PostGIS esté habilitado

### Error: WebSocket no conecta

**Síntoma:** Frontend muestra "WebSocket disconnected".

**Solución:**
1. Socket.io debería funcionar automáticamente en Railway
2. Verifica que el frontend use la URL correcta del backend
3. Revisa que HTTPS esté habilitado (Vercel lo hace automático)

---

## 📊 Monitoreo

### Railway Dashboard

- Logs en tiempo real
- Uso de CPU/Memoria
- Estado del deploy

### Vercel Dashboard

- Analytics de tráfico
- Velocidad de carga
- Errores de build

---

## 💰 Costos Estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Railway | Hobby | $5/mes (DB) + $0 (backend si <500hrs) |
| Vercel | Hobby | Gratis |
| **Total** | | **~$5-10 USD/mes** |

---

## 🔄 Deploy Continuo

Ambos servicios hacen **auto-deploy** cuando haces push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

- Railway detectará cambios en `backend/`
- Vercel detectará cambios en `frontend/`
- Ambos desplegarán automáticamente

---

## 📞 Soporte

- Railway: [railway.app/discord](https://discord.gg/railway)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

---

*¡Listo! Tu CercaYa está en producción 🎉*
