# Resumen App 2026 — CercaYa (Revisión Kiro)

**Fecha:** Junio 2026  
**Elaborado por:** Kiro (Revisión técnica y estratégica)  
**Propósito:** Referencia para procesos, estrategia y toma de decisiones del producto

---

## 1. Qué es CercaYa

CercaYa es un marketplace hiperlocal en tiempo real para la economía informal latinoamericana. Conecta a clientes con vendedores ambulantes y tiendas de barrio que aparecen en un mapa cuando están activos cerca de su ubicación.

**Propuesta de valor central:** El vendedor activa su visibilidad ("En el Aire") y aparece en el mapa de los clientes cercanos en tiempo real. Cuando se desactiva, desaparece. Sin fricciones, sin documentos legales requeridos.

**Mercado objetivo:** Latinoamérica. Colombia como mercado inicial. Aproximadamente 7 millones de vendedores informales solo en Colombia. La economía informal representa el 50-60% del empleo en la región.

**Ventaja competitiva:** No existe competidor directo con estas características combinadas. Rappi, iFood y Glovo solo trabajan con negocios formales establecidos. CercaYa es la primera plataforma para la economía informal hiperlocal con ubicación en tiempo real verdadero.

---

## 2. Stack Tecnológico

### Backend
- Node.js + Express + TypeScript
- PostgreSQL 14+ con fórmula de Haversine para distancias geográficas
- Socket.io (WebSockets para tiempo real)
- JWT (autenticación), bcrypt (hashing), cookies httpOnly para refresh tokens
- Zod (validación de inputs), Helmet (headers seguros), rate limiting
- Winston (logging estructurado)
- Swagger (documentación API auto-generada)
- Railway (despliegue)

### Frontend
- React + TypeScript + Vite
- Tailwind CSS (diseño glassmorphism)
- Zustand (estado global), React Query (caché de API)
- Leaflet (mapas interactivos)
- Socket.io-client (conexión tiempo real)

### Infraestructura
- Migraciones de DB versionadas (5 migraciones aplicadas)
- CI/CD con GitHub Actions
- Dockerfile disponible

---

## 3. Funcionalidades Implementadas

### Roles de usuario
| Rol | Acceso |
|-----|--------|
| `customer` | Mapa, búsqueda, favoritos, reportar incidentes |
| `seller` | Todo de customer + dashboard de negocio, activar visibilidad |
| `authority` | Dashboard de autoridades, gestión de incidentes |
| `admin` | Acceso total |

### Backend — Rutas operativas
- **Auth:** registro, login, refresh token, perfil (`/api/auth`)
- **Vendors:** crear negocio, editar perfil, ubicación, toggle visibilidad, calificar, vendedores cercanos, por categoría (`/api/vendors`)
- **Products:** crear y listar productos por vendedor (`/api/products`)
- **Incidents:** reportar incidente (anónimo o autenticado), ver cercanos, actualizar estado, historial (`/api/incidents`)
- **Notifications:** alertas de vendedores cercanos (`/api/notifications`)
- **Upload:** subida de imágenes (`/api/upload`)

### WebSocket — Eventos activos
| Evento | Descripción |
|--------|-------------|
| `join-location` | Cliente se une a sala geográfica |
| `update-location` | Vendedor actualiza su posición |
| `toggle-visibility` | Vendedor activa/desactiva visibilidad |
| `nearby-vendors` | Server envía vendedores activos cercanos |
| `vendor-location-updated` | Broadcast de posición actualizada |
| `incident-alert` | Alerta de incidente a vendedores y autoridades cercanas |
| `join-authority-room` | Autoridad se une a sala global de emergencias |
| `join-vendor-room` | Vendedor se une a sala personal para recibir alertas |

### Frontend — Pantallas y componentes
- `Home.tsx` — Pantalla principal con mapa
- `VendorDashboard.tsx` — Panel del vendedor (stats, ubicación, productos)
- `AuthorityDashboard.tsx` — Panel de autoridades (incidentes en tiempo real)
- `Profile.tsx` — Perfil de usuario
- `Alerts.tsx` — Alertas del usuario
- `Map.tsx` — Mapa Leaflet interactivo
- `MapFilters.tsx` — Filtros por categoría, tipo, radio
- `RadarPanel.tsx` — Vendedores vistos en las últimas 2 horas
- `IncidentPanel.tsx` / `IncidentReportForm.tsx` — Reporte de incidentes
- `VendorCard.tsx` / `VendorDetails.tsx` — Tarjeta y detalle de vendedor

### Categorías soportadas (19)
Comidas rápidas, restaurantes, frutas y verduras, lácteos, panadería, carnicería, farmacia, abarrotes, mensajería, ferretería, papelería, limpieza, recolección de basura, entrega de recibos, telecomunicaciones, agua potable, gas domiciliario, servicios municipales, otros.

---

## 4. Estado Actual del Proyecto (Junio 2026)

**Estado recomendado:** Candidato a beta controlada. No apto para producción general todavía.

### Por área
| Área | Estado | Observación |
|------|--------|-------------|
| Backend build | ✅ OK | Compila limpio, TypeScript sin errores |
| Backend tests | ⚠️ Parcial | Solo auth (14 tests). Faltan vendors, products, incidents, WebSocket |
| Frontend build | ✅ OK | Compila, advertencia de bundle > 500 kB |
| Frontend tests | ❌ Insuficiente | Test de humo (`expect(true).toBe(true)`), no valida nada real |
| Seguridad | ✅ Sólida | Auditada en 3 fases, calificación 9.8/10 |
| Tiempo real (WebSocket) | ✅ Implementado | No tiene tests automatizados |
| UX / Producto | ⚠️ Parcial | Botón "Ajustar filtros" sin acción, estado vacío mejorable |
| E2E | ❌ Pendiente | No existe ninguna prueba end-to-end |
| Documentación | ✅ Buena | Múltiples documentos de auditoría y análisis |

---

## 5. Lo que Está Bien Hecho

- Arquitectura sólida y separada por responsabilidades
- WebSockets autenticados con JWT, sistema de salas geográficas elegante
- UPSERT atómico para ubicaciones de vendedores (una sola query, no 3)
- Validación estricta de inputs con Zod en todos los endpoints
- Seguridad de nivel producción: Helmet, rate limiting, cookies httpOnly, validación de secretos al arranque
- Logging estructurado (Winston) con visibilidad de errores
- 3 dashboards diferenciados por rol
- Código TypeScript consistente en backend y frontend

---

## 6. Pendientes Prioritarios (Antes de Beta)

- [ ] **Conectar botón "Ajustar filtros"** en estado vacío de Home — es la primera impresión del usuario
- [ ] **Escribir tests reales de frontend** para Home, Map, VendorDashboard y flujo de auth
- [ ] **Tests backend** para vendors, products, incidents, notifications y WebSocket
- [ ] **Code splitting del bundle** — separar Leaflet y Socket.io del bundle principal para mejorar carga en móviles con datos lentos
- [ ] **Confirmar variables de entorno productivas** fuera del repositorio
- [ ] **Limpiar historial de Git** de posibles secretos expuestos (usar `git filter-repo`)
- [ ] **Al menos 3 pruebas E2E:** usuario encuentra vendedor → vendedor se activa y aparece → usuario reporta incidente y autoridad lo recibe

---

## 7. Mejoras de Producto Recomendadas

### Corto plazo — Mayor impacto en propuesta de valor

**1. Notificaciones Push (FCM / Web Push)**  
El mayor gap actual. Si el vendedor de gas llega a 200m y la app está cerrada, el usuario no se entera. Las notificaciones push convierten la app de "hay que abrirla" a "te avisa sola". Es la diferencia entre retención y abandono.

**2. Historial de rutas de vendedores**  
"El verdulero pasa los martes y jueves por tu calle." Los datos de ubicación ya se están guardando. Con análisis de patrones de movimiento se puede mostrar predicciones de cuándo y dónde aparece cada vendedor. Bajo costo de implementación, alto valor percibido.

**3. Vista de detalle de vendedor mejorada**  
Galería de fotos de productos, horarios con indicador de "abierto ahora" dinámico, y botón de WhatsApp directo desde la tarjeta. Mejora inmediata de conversión.

**4. Búsqueda por texto libre**  
Hoy solo filtra por categoría. Si alguien escribe "empanadas" o "gas en cilindro", debería buscar por nombre de vendedor o descripción de producto. Imprescindible para la adopción masiva.

### Mediano plazo — Crecimiento y retención

**5. Favoritos y "Seguir vendedor"**  
Recibir notificación cuando un vendedor favorito se activa cerca. La infraestructura de WebSocket ya lo soporta. Solo falta la tabla `user_favorite_vendors` y la lógica de notificación.

**6. Chat interno básico**  
Reduce la dependencia de WhatsApp. El vendedor no expone su número personal. La plataforma mantiene el control de la interacción. Abre la puerta a moderación si hay problemas.

**7. Modo offline / caché agresivo**  
Service Worker que guarda el último estado conocido del mapa. Crítico para usuarios con señal intermitente, que es la realidad de muchas zonas donde están los vendedores informales.

**8. Badge de Vendedor Verificado**  
Validación de identidad básica. Genera confianza en el cliente y diferencia a vendedores serios. Es también la base de la monetización: el badge podría ser parte del plan de pago.

### Largo plazo — Monetización

**9. Plan Pro para vendedores ($2-5 USD/mes)**  
- Aparecer primero en búsquedas del área
- Estadísticas avanzadas: cuántos usuarios los vieron, desde qué zonas, a qué horas
- Promociones destacadas en el mapa
- Es asequible para la economía informal y es el modelo natural para el negocio

**10. Integración de pagos locales**  
PSE, Nequi, Daviplata en Colombia. Daviplata tiene penetración altísima en vendedores informales. Convierte la app de directorio a plataforma de transacciones.

**11. Analytics para vendedores**  
Heatmap de dónde están sus clientes, mejores horas del día, comparativa semanal. Aumenta el valor percibido del plan Pro y la retención del vendedor.

**12. Anuncios hiperlocales**  
Negocios de barrio (tiendas establecidas, restaurantes) pagan por aparecer destacados en un radio específico. Fuente de ingresos adicional sin afectar la experiencia del usuario informal.

---

## 8. Riesgos a Gestionar

| Riesgo | Mitigación |
|--------|------------|
| Adopción de vendedores (el lado difícil del marketplace) | Onboarding ultra-simple, sin documentos, en menos de 3 minutos |
| Consumo de batería por GPS continuo | Actualización de ubicación adaptativa: menor frecuencia cuando el vendedor no se mueve |
| Seguridad del vendedor (exposición de ubicación exacta) | Mostrar radio aproximado al público, ubicación exacta solo a usuarios registrados |
| Bundle pesado en móviles gama baja | Code splitting urgente — Leaflet y Socket.io son los mayores contribuyentes |
| Competencia de Big Tech en el nicho | Enfocarse en economía informal que los grandes ignoran por baja rentabilidad unitaria |
| Regulación municipal | No intermediar permisos, solo conectar oferta y demanda como directorio |

---

## 9. Evaluación General

| Criterio | Estado |
|----------|--------|
| Potencial técnico | ⭐⭐⭐⭐⭐ Stack sólido, escalable, bien auditado |
| Potencial de mercado | ⭐⭐⭐⭐⭐ 50M+ vendedores informales en LatAm |
| Diferenciación | ⭐⭐⭐⭐⭐ Sin competidor directo con estas características |
| Madurez actual | ⭐⭐⭐⭐ Lista para beta, falta cobertura de tests y detalles UX |
| Monetización | ⭐⭐⭐⭐ Múltiples caminos claros y realistas |

---

## 10. Decisión Recomendada

- **Producción general:** No todavía.
- **Beta controlada:** Sí, después de resolver los 7 pendientes prioritarios de la sección 6.
- **Foco inmediato:** Conectar el botón de filtros, code splitting del bundle, y escribir al menos los tests E2E críticos del flujo principal.

---

*Documento generado por Kiro — Junio 2026*  
*Fuentes: revisión directa del código fuente, auditorías previas en `/auditoria/`, y análisis de arquitectura del proyecto.*
