# ✅ Checklist - Deploy CercaYa

Usa esta lista para verificar cada paso del despliegue.

---

## 📋 Pre-Deploy

- [ ] Tienes cuenta en GitHub
- [ ] Tienes cuenta en [Railway](https://railway.app/)
- [ ] Tienes cuenta en [Vercel](https://vercel.com/)
- [ ] El código está en un repositorio de GitHub
- [ ] `.gitignore` está configurado (no subir `.env`)

---

## 🗄️ Railway - Base de Datos

- [ ] Crear proyecto en Railway
- [ ] Agregar PostgreSQL database
- [ ] Copiar `DATABASE_URL` (External Connection String)
- [ ] Verificar que PostGIS esté disponible

---

## 🔧 Railway - Backend

- [ ] Conectar repositorio de GitHub
- [ ] Configurar `Root Directory`: `backend`
- [ ] Agregar variables de entorno:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `DATABASE_URL=postgresql://...`
  - [ ] `JWT_SECRET=...` (mínimo 32 caracteres)
  - [ ] `JWT_EXPIRES_IN=7d`
  - [ ] `CORS_ORIGIN=https://...` (URL de Vercel)
- [ ] Verificar que build completó exitosamente
- [ ] Copiar URL del backend (ej: `https://cercaya-backend-production.up.railway.app`)

---

## 🎨 Vercel - Frontend

- [ ] Importar repositorio desde GitHub
- [ ] Configurar `Root Directory`: `frontend`
- [ ] Framework preset: `Vite`
- [ ] Agregar variable de entorno:
  - [ ] `VITE_API_URL=https://...` (URL del backend en Railway)
- [ ] Deploy exitoso
- [ ] Copiar URL del frontend (ej: `https://cercaya.vercel.app`)

---

## 🔗 Post-Deploy

- [ ] Actualizar `CORS_ORIGIN` en Railway con la URL de Vercel
- [ ] Esperar redeploy automático de Railway
- [ ] Probar health check: `https://backend-url/health`
- [ ] Probar frontend en navegador
- [ ] Probar registro de usuario
- [ ] Probar WebSocket (debe mostrar "🟢 WebSocket conectado" en consola)

---

## 🧪 Tests de Verificación

### Backend

```bash
# Health check
curl https://backend-url.railway.app/health

# Registro
curl -X POST https://backend-url.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'

# Login
curl -X POST https://backend-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Frontend

- [ ] Abre la URL de Vercel en tu navegador
- [ ] Abre DevTools (F12) → Console
- [ ] Verifica que no hay errores de CORS
- [ ] Verifica que WebSocket conecta (mensaje "🟢 WebSocket conectado")
- [ ] Navega a registro/login
- [ ] Registra un usuario de prueba

---

## 🔐 Seguridad

- [ ] `JWT_SECRET` es único y seguro (32+ caracteres aleatorios)
- [ ] `NODE_ENV=production` está configurado
- [ ] `.env` no está en el repositorio
- [ ] CORS solo permite tu dominio de Vercel

---

## 📊 Monitoreo

### Railway
- [ ] Revisar logs en Railway Dashboard
- [ ] Verificar uso de CPU/Memoria
- [ ] Configurar alertas si es necesario

### Vercel
- [ ] Revisar Analytics
- [ ] Verificar velocidad de carga
- [ ] Monitorear errores de build

---

## 🎯 Dominio Personalizado (Opcional)

- [ ] Comprar dominio (ej: `cercaya.com`)
- [ ] Configurar DNS en Vercel
- [ ] Configurar dominio personalizado en Railway
- [ ] Actualizar `CORS_ORIGIN` con nuevo dominio
- [ ] Actualizar `VITE_API_URL` con nuevo dominio

---

## 📝 Notas del Deploy

| Fecha | URL Backend | URL Frontend | Notas |
|-------|-------------|--------------|-------|
| | | | |

---

*Marca cada casilla conforme completas los pasos*
