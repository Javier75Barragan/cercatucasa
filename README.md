# CercaYa 📍

CercaYa es una plataforma hiperlocal diseñada para conectar a las comunidades con vendedores locales y ambulantes en tiempo real. 

## 🚀 Características Principales

- **Mapa en Tiempo Real**: Encuentra vendedores cercanos con ubicación actualizada vía WebSockets.
- **Radar de Actividad**: Visualiza los recorridos recientes de los vendedores en las últimas 2 horas.
- **Categorías Inteligentes**: 17 categorías que cubren desde frutas y verduras hasta servicios municipales.
- **Alertas de Seguridad**: Reporte de incidentes y notificaciones de emergencia para la comunidad.
- **Dashboard para Vendedores**: Gestión de productos, horarios y visibilidad "En el Aire".

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express**
- **TypeScript**
- **PostgreSQL + PostGIS** (Geolocalización avanzada)
- **Socket.io** (Comunicación en tiempo real)
- **JWT** (Autenticación segura)

### Frontend
- **React + Vite**
- **Tailwind CSS** (Diseño Premium)
- **Zustand** (Gestión de estado)
- **Leaflet** (Mapas interactivos)
- **React Query** (Sincronización de datos)

## 📦 Instalación

### Requisitos Previos
- Node.js (v18+)
- PostgreSQL 14+ con extensión PostGIS

### Backend
1. Entrar en la carpeta backend: `cd backend`
2. Instalar dependencias: `npm install`
3. Configurar `.env` (ver `.env.example`)
4. Inicializar base de datos: `npm run dev` (ejecuta `initDB()`)

### Frontend
1. Entrar en la carpeta frontend: `cd frontend`
2. Instalar dependencias: `npm install`
3. Iniciar modo desarrollo: `npm run dev`

## 🔐 Seguridad

Este proyecto ha pasado por una auditoría de seguridad y cumple con los siguientes estándares:
- Validación estricta de secretos de entorno.
- Rate limiting en endpoints sensibles.
- Comunicación en tiempo real autenticada.
- Hashing de contraseñas con bcrypt.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
