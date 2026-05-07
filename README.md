# CercaYa 📍

> **Conectando comunidades hiperlocales en tiempo real.**

CercaYa es una plataforma avanzada diseñada para visibilizar la economía informal y los servicios públicos, permitiendo a los ciudadanos rastrear vendedores ambulantes, comercios locales y servicios de emergencia mediante una interfaz de mapa premium y comunicación en tiempo real.

---

## ✨ Características Destacadas

### 🗺️ Mapa Hiperlocal Pro
Visualización en tiempo real de marcadores dinámicos. Diferenciación visual entre vendedores independientes y flotas de servicios públicos (basura, correo, gas).

### 📡 Radar de Actividad (Ghost Tracking)
¿Te perdiste al vendedor de frutas? El **Radar Panel** te muestra quién pasó cerca de tu ubicación en las últimas 2 horas, permitiéndote contactarlos incluso si ya no están en tu calle.

### 🚀 Modo "En el Aire"
Los vendedores controlan su visibilidad con un solo toque. Privacidad y control total sobre cuándo y dónde ser encontrados.

### 🛡️ SOS & Gestión de Incidentes
Sistema integrado para reportar emergencias ciudadanas directamente a las autoridades locales con geolocalización precisa.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Node.js, Express, TypeScript, PostgreSQL + PostGIS |
| **Real-Time** | Socket.io (WebSockets) |
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand |
| **Geodata** | Leaflet, Haversine Formula |
| **Seguridad** | JWT (Dual-token), Zod, Helmet, Express-Rate-Limit |

---

## 🔐 Seguridad & Auditoría

Este proyecto ha sido sometido a una auditoría de seguridad rigurosa (Mayo 2026), alcanzando un **Score de Seguridad de 9.2/10**.

- **Protección de Datos:** Validación estricta con **Zod** para prevenir inyecciones SQL y XSS.
- **Blindaje de API:** Rate limiting configurado para prevenir ataques de fuerza bruta en login y registro.
- **Gestión de Secretos:** Sistema de rotación periódica de `JWT_SECRET` y credenciales de DB.
- **WebSockets Seguros:** Autenticación obligatoria mediante Handshake JWT para todas las conexiones de Socket.io.
- **Infraestructura:** Encabezados de seguridad HTTP automáticos mediante **Helmet**.

---

## 📦 Instalación y Despliegue

### Requisitos
- Node.js v18+
- PostgreSQL 14+ con la extensión **PostGIS** instalada.

### Configuración Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/cercaya.git
   cd cercaya
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env # Configura tus credenciales aquí
   npm run migrate      # Ejecuta las migraciones de base de datos
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🗺️ Mapa de Rutas (API)

| Endpoint | Descripción |
| :--- | :--- |
| `POST /api/auth/login` | Inicio de sesión con Rate Limiting |
| `GET /api/vendors/nearby` | Búsqueda geoespacial de vendedores |
| `POST /api/incidents` | Reporte de emergencias en tiempo real |
| `GET /api/vendors/me` | Dashboard administrativo del vendedor |

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

---
*Hecho con ❤️ para transformar la conexión local.*
