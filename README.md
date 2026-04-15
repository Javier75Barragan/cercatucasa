# CercaYa 🗺️

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com)

Aplicación que conecta vendedores ambulantes, tiendas de barrio y servicios locales con clientes cercanos en tiempo real.

---

**📚 Documentación:**

- [📊 Análisis del Proyecto](./ANALISIS_PROYECTO.md)
- [🚀 Guía de Deploy](./DEPLOY.md)
- [✅ Checklist Deploy](./CHECKLIST_DEPLOY.md)

## Características ✨

- 📍 **Mapa en tiempo real** con vendedores activos en tu zona
- 🔍 **Filtros por categoría** (verduras, lácteos, farmacia, mensajería, etc.)
- 🔔 **Alertas inteligentes** para notificarte cuando pase un vendedor específico
- 💬 **Contacto directo** vía WhatsApp
- 📊 **Panel de vendedor** para gestionar visibilidad y productos
- ⚡ **Actualizaciones en tiempo real** usando WebSocket

## Stack Tecnológico 🛠️

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + PostGIS
- Socket.io (WebSockets)
- JWT (autenticación)
- bcrypt (hashing)

### Frontend
- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- React Query
- Leaflet (mapas)
- Socket.io-client

## Instalación 🚀

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+

### 1. Clonar y configurar

```bash
cd CercaYa
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
database:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cercaya
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=tu_secreto_jwt
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

### 4. Iniciar la aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

La app estará disponible en `http://localhost:5173`

## Estructura del Proyecto 📁

```
CercaYa/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración DB
│   │   ├── middleware/     # Auth, errores
│   │   ├── routes/         # API routes
│   │   ├── services/       # WebSocket, etc.
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API calls
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints 🌐

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Perfil del usuario

### Vendedores
- `GET /api/vendors/nearby?lat=&lng=&radius=` - Vendedores cercanos
- `GET /api/vendors/:id` - Detalle de vendedor
- `POST /api/vendors` - Crear vendedor
- `POST /api/vendors/:id/location` - Actualizar ubicación
- `PATCH /api/vendors/:id/location/toggle` - Activar/desactivar visibilidad

### Productos
- `GET /api/products/vendor/:id` - Productos del vendedor
- `POST /api/products` - Crear producto

### Notificaciones
- `GET /api/notifications/alerts` - Alertas del usuario
- `POST /api/notifications/alerts` - Crear alerta
- `POST /api/notifications/check` - Verificar vendedores cercanos

## WebSocket Events 🔌

- `join-location` - Unirse a sala de ubicación
- `update-location` - Actualizar posición del vendedor
- `toggle-visibility` - Cambiar visibilidad
- `nearby-vendors` - Recibir vendedores cercanos
- `vendor-location-updated` - Ubicación actualizada
- `vendor-visibility-changed` - Visibilidad cambiada

## Categorías Soportadas 📋

- 🥬 Frutas y Verduras
- 🥛 Lácteos
- 🥖 Panadería
- 🥩 Carnicería
- 💊 Farmacia
- 🛒 Abarrotes
- 📦 Mensajería
- 🔧 Ferretería
- 📝 Papelería
- 🧽 Productos de limpieza

## Licencia 📄

MIT

---

## 🚀 Deploy en Producción

Para desplegar CercaYa en Railway + Vercel, sigue la [Guía de Deploy](./DEPLOY.md).

### Variables de Entorno Requeridas

**Backend (Railway):**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secreto_seguro
CORS_ORIGIN=https://cercaya.vercel.app
```

**Frontend (Vercel):**
```bash
VITE_API_URL=https://cercaya-backend-production.up.railway.app/api
```

---

Hecho con ❤️ para conectar comunidades locales
