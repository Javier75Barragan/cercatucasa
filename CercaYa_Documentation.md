# CercaYa - Documentación Maestra del Proyecto
*Versión 1.0 (Alpha) - Abril 2026*

Este documento es el **"Archivo Maestro"** de nuestra aplicación. Sirve como registro oficial de todo lo que la app hace, cómo está construida y cuáles son las reglas de negocio, ideal para presentárselo a futuros inversores, desarrolladores o socios comerciales.

---

## 1. Visión del Producto
**CercaYa** es un *Marketplace* geolocalizado en tiempo real diseñado para conectar a vecinos con vendedores ambulantes, locales físicos y empresas de servicios públicos (basuras, correo, gas) mediante una interfaz premium y altamente interactiva de mapas.

## 2. Pila Tecnológica (Arquitectura)
*   **Frontend (Vitrina Visual):** React 18, Vite, Tailwind CSS (arquitectura Glassmorphism oscura), React-Leaflet (Mapas), Zustand (Manejo de estados globales estables) y Lucide Icons.
*   **Backend (Cerebro):** Node.js con Express, Typescript. Protección perimetral manejada con variables de entorno y middlewares de validación nativos.
*   **Red en Tiempo Real:** Socket.io (Permite ver el movimiento instantáneo).
*   **Base de Datos (Almacén):** PostgreSQL. Manejo relacional de vendedores, reseñas y ubicaciones.

## 3. Funcionalidades Principales (Core Features)

### 3.1. Mapa de Ecosistema Interactivo
El corazón de la app es un mapa (estilo Waze/Uber) donde flotan marcadores personalizados. Diferenciamos mediante tamaños de icono y bordes destellantes a Vendedores Pequeños de Empresas de Servicio Público.
*   **Auto-ubicación:** Detecta por GPS el centro de gravedad del usuario y pinta un radar a su alrededor (Ej: 200 a 1000 metros).
*   **Búsqueda Rápida:** Botones de enrutamiento al clic en los marcadores con Google Maps nativo.

### 3.2. Panel de Inteligencia & Rastreo
*   **Radar Fantasma (Panel):** Guarda un registro temporal de los negocios móviles ("Vendedores ambulantes") que pasaron cerca de casa en las últimas horas, incluso si ya no están allí. Permite ver el sello de "Visto hace 12 mins".
*   **Rastreo en Vivo Módulo B2B (Nuevo):** Si el vendedor pertenece a una categoría tipo Flota (Mensajería, Gas, Basura), disponemos del botón "📍 Rastrear en Vivo". Este dibuja una **Línea de Conexión Dinámica** que enlaza al usuario con el camión, encuadrando automáticamente la cámara de la pantalla a nivel de mapa para no perder la entrega de vista.

### 3.3. Ecosistema de Confianza (Reputación)
*   **Calificaciones:** Sistema de clasificación estricta de 1 a 5 estrellas programado en React. Los perfiles solo muestran reputaciones con alta participación.
*   **Verificación:** Un `Tick Azul` (como en X/Twitter) que confirma vendedores que aportaron documentación.

### 3.4. Motor de Leads (Conversión de Ventas Rápida)
*   Integración directa de `wa.me/` generadora de Links en un clic hacia WhatsApp Business con texto pre-llenado "Vi tu perfil en CercaYa...".
*   Tarjetas de usuario hiper-optimizadas con botones flotantes para contacto inmediato, diseñadas paramétricamente en tarjetas de cristal opaco (`glassmorphism`).

## 4. Estrategia de Crecimiento & Monetización
*(Planeación Comercial)*

1.  **Suscripciones para Vendedores Pro:** Por $X usd, el comercio sobresale visualmente en el mapa y en el cajón magnético de búsqueda B2B.
2.  **Soluciones Corporativas Flotilla:** Vender el SAAS a camiones de residuos, recolección y proveedores logísticos masivos, reduciéndoles sus quejas operativas y dando valor directo a la comunidad.
3.  **Sistema "Ping" Patrocinado:** Micro-Transacciones que le permiten a la cafetería/negocio local "sacudir" masivamente el teléfono de los vecinos a 1 km a la redonda cuando lanza o remata mercancía.

## 5. Medidas Centrales de Seguridad
*Implementaciones a ser empujadas a Producción:*
*   **Express-Rate-Limit:** Bloquea los ataques continuos o robots rusos limitando las entradas fallidas de inicios de sesión.
*   **CORS y Helmet:** Restricción rígida desde qué páginas web (nuestra app) la base de datos acepta información HTTP.
*   **Zod Data Protection:** Blindaje de base de datos de inyecciones XSS, impidiendo que hackers metan scripts de código disfrazado en nombres de usuario y descripciones.
