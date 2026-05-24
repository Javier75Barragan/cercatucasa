# Documentacion consolidada - CercaYa

**Fecha de consolidacion:** 2026-05-11  
**Proyecto:** CercaYa  
**Estado del documento:** Fuente principal de documentacion funcional, tecnica y de auditoria.  
**Nota:** Los documentos anteriores se mantienen como historial, pero este archivo concentra la lectura principal por categorias.

---

## 1. Vision del producto

CercaYa es una plataforma hiperlocal para conectar personas con vendedores, comercios, servicios e incidentes cercanos en tiempo real. Su propuesta principal es responder una pregunta simple:

> Que hay util cerca de mi ubicacion ahora?

La app usa mapa, geolocalizacion, filtros, alertas, actividad en vivo y roles diferenciados para usuarios, vendedores y autoridades.

---

## 2. Objetivos

### Objetivo principal

Permitir que un usuario encuentre vendedores, comercios o servicios cercanos de forma rapida, clara y accionable.

### Objetivos secundarios

- Dar visibilidad a vendedores ambulantes y comercios locales.
- Permitir que vendedores controlen cuando estan visibles.
- Mostrar actividad reciente cerca del usuario mediante radar o historial.
- Permitir alertas cuando aparezca actividad relevante cerca.
- Facilitar reportes de incidentes con ubicacion.
- Dar a autoridades una vista de gestion para incidentes.
- Mantener seguridad basica fuerte en autenticacion, datos y tiempo real.

---

## 3. Alcance de la app

### Dentro del alcance actual

- Pantalla principal con mapa.
- Ubicacion del usuario.
- Busqueda de vendedores cercanos.
- Filtros por radio, categoria y tipo.
- Listado de vendedores cercanos.
- Detalle de vendedor.
- Radar de actividad reciente.
- Alertas de actividad cercana.
- Registro e inicio de sesion.
- Perfil de usuario.
- Dashboard de vendedor.
- Creacion/gestion de negocio.
- Activacion y desactivacion de visibilidad.
- Actualizacion de ubicacion del vendedor.
- Reporte de incidentes.
- Dashboard de autoridad.
- API REST para auth, vendors, products, notifications e incidents.
- WebSocket para tiempo real.
- Base de datos PostgreSQL con soporte geoespacial/PostGIS.

### Fuera del alcance actual o no validado

- Pagos dentro de la app.
- Logistica de entregas.
- Chat completo comprador-vendedor.
- Reputacion avanzada o moderacion completa.
- Analitica avanzada para vendedores.
- Validacion con usuarios reales.
- Pruebas end-to-end completas.
- Pruebas de carga.
- Estrategia formal de rollback.

---

## 4. Usuarios y roles

### Usuario cliente

Persona que busca vendedores, comercios, servicios o incidentes cerca de su ubicacion.

Acciones esperadas:

- Ver mapa.
- Permitir ubicacion.
- Buscar cerca.
- Filtrar resultados.
- Abrir detalle de vendedor.
- Crear alertas.
- Reportar incidentes.

### Vendedor

Persona o negocio que quiere aparecer en el mapa y controlar su disponibilidad.

Acciones esperadas:

- Registrar cuenta.
- Crear o administrar negocio.
- Activar/desactivar visibilidad.
- Actualizar ubicacion.
- Gestionar productos o informacion publica.

### Autoridad

Usuario con acceso a gestion de incidentes.

Acciones esperadas:

- Ver incidentes.
- Revisar detalle.
- Actualizar estado.
- Gestionar seguimiento.

### Admin

Rol con permisos amplios para administracion tecnica o funcional.

---

## 5. Funcionalidades principales

### Mapa hiperlocal

Muestra ubicacion del usuario, radio de busqueda y actividad cercana.

Valor de producto:

- Es la superficie principal de descubrimiento.
- Debe permitir entender rapidamente que hay cerca.

Riesgos actuales:

- Si no hay resultados, el estado vacio debe guiar mejor.
- El radio debe ser mas accionable cuando no hay resultados.

### Busqueda y filtros

Permite ajustar radio, categoria y tipo.

Valor de producto:

- Reduce ruido.
- Ayuda a encontrar algo util rapidamente.

Pendiente:

- Confirmar si la busqueda por texto filtra realmente resultados o solo captura texto visualmente.

### Radar de actividad

Permite mostrar vendedores o actividad que paso recientemente cerca del usuario.

Valor de producto:

- Resuelve el caso de uso "el vendedor paso cerca, pero ya no esta justo aqui".

Pendiente:

- Validar con pruebas funcionales si el radar conserva y muestra encuentros correctamente.

### Alertas

Permiten avisar al usuario cuando aparece actividad relevante cerca.

Valor de producto:

- Convierte una busqueda fallida en una espera activa.

Pendiente:

- Probar creacion, listado, actualizacion y eliminacion de alertas.

### Incidentes

Permiten reportar situaciones locales con ubicacion.

Valor de producto:

- Amplia CercaYa de comercio hiperlocal a utilidad comunitaria.

Pendiente:

- Probar flujo completo usuario -> incidente -> autoridad.

---

## 6. Arquitectura

### Estructura general

```text
CercaYa/
  backend/
    src/
      config/
      middleware/
      routes/
      schemas/
      services/
      types/
      __tests__/
  frontend/
    src/
      components/
      hooks/
      pages/
      services/
      stores/
      types/
      __tests__/
  auditoria/
  scripts/
  shared/
```

### Backend

Stack:

- Node.js
- Express
- TypeScript
- PostgreSQL
- PostGIS
- Socket.IO
- Zod
- JWT
- bcrypt
- Helmet
- express-rate-limit
- Winston
- Swagger
- Jest
- Supertest

Responsabilidades:

- Autenticacion.
- Gestion de usuarios.
- Vendedores y productos.
- Alertas/notificaciones.
- Incidentes.
- WebSocket.
- Validacion de entrada.
- Seguridad HTTP.
- Conexion a base de datos.

### Frontend

Stack:

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- React Router
- Axios
- Leaflet / React Leaflet
- Socket.IO Client
- React Hook Form
- Zod
- Vitest
- Testing Library

Responsabilidades:

- UI principal.
- Mapa.
- Filtros.
- Flujos de auth.
- Dashboards.
- Estado global.
- Conexion API.
- Conexion WebSocket.
- Geolocalizacion.

---

## 7. API principal

### Auth

Endpoints principales:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `PUT /api/auth/password`

Estado:

- Tests backend existentes para registro, login y refresh.
- Falta ampliar pruebas de sesion expirada y flujos frontend.

### Vendors

Endpoints principales:

- `GET /api/vendors/nearby`
- `GET /api/vendors/me`
- `GET /api/vendors/:id`
- `POST /api/vendors`
- `PUT /api/vendors/:id`
- `POST /api/vendors/:id/location`
- `PATCH /api/vendors/:id/location/toggle`
- `GET /api/vendors/categories`
- `POST /api/vendors/:id/reviews`

Estado:

- Es modulo central para el objetivo del producto.
- Debe tener prioridad alta en pruebas.

### Products

Endpoints principales:

- `GET /api/products/vendor/:vendorId`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Estado:

- Importante para dashboard de vendedor.
- Debe validar propiedad y permisos.

### Notifications

Endpoints principales:

- `GET /api/notifications/alerts`
- `POST /api/notifications/alerts`
- `PUT /api/notifications/alerts/:id`
- `DELETE /api/notifications/alerts/:id`
- `POST /api/notifications/check`

Estado:

- Clave para convertir busquedas sin resultados en alertas utiles.

### Incidents

Endpoints principales:

- `GET /api/incidents/types`
- `POST /api/incidents`
- `GET /api/incidents/nearby`
- `PATCH /api/incidents/:id/status`
- `GET /api/incidents/my-reports`

Estado:

- Importante para utilidad comunitaria y dashboard de autoridad.

---

## 8. Seguridad

### Controles implementados o documentados

- JWT con access token y refresh token.
- Secretos JWT separados.
- bcrypt para passwords.
- Validacion con Zod.
- Rate limiting en autenticacion.
- Rate limiting general para API.
- Helmet para cabeceras HTTP.
- WebSocket con autenticacion JWT.
- Verificacion de permisos en eventos criticos de WebSocket.
- `.env` excluido del repositorio.
- `.env.example` como plantilla.
- Refresh tokens persistidos.

### Riesgos historicos identificados

- Credenciales expuestas en `.env`.
- Endpoint destructivo sin proteccion.
- Fallback debil para `JWT_SECRET`.
- Validacion insuficiente.
- WebSocket sin autenticacion.

### Estado actual recomendado

La seguridad critica parece mayormente remediada, pero antes de produccion se debe confirmar:

- Variables productivas rotadas y seguras.
- Limpieza o mitigacion de secretos en historial Git.
- Pruebas de permisos en vendors/products/incidents.
- Pruebas de WebSocket con token invalido, ausente y usuario sin permisos.
- Configuracion real de CORS, rate limit y secretos en produccion.

Actualizacion de mantenimiento 2026-05-24:

- Backend sin vulnerabilidades activas en `npm audit`.
- Frontend reducido a 2 vulnerabilidades `moderate`, ambas relacionadas con `vite/esbuild`.
- La remediacion completa del frontend queda pendiente de una migracion a `vite@8`, tratada como upgrade mayor de tooling y no como parche menor.

---

## 9. Auditoria

### Auditoria de seguridad

Estado:

- Auditoria original indicaba riesgo alto y "no listo para produccion".
- Remediacion posterior cerro varios puntos criticos.
- Documentos historicos tienen inconsistencias de estado.

Documentos relacionados:

- `auditoria/security_findings.md`
- `auditoria/informe_auditoria.md`
- `auditoria/resumen_ejecutivo.md`
- `auditoria/checklist_remediacion.md`
- `auditoria/estado_remediacion.md`

### Auditoria funcional y de producto

Estado:

- Documento creado en `auditoria/auditoria_funcional_producto.md`.
- Evalua objetivo, alcance, flujos criticos, pruebas faltantes y UX.

Hallazgos vigentes:

- La app compila, pero falta demostrar que cumple el objetivo del producto.
- El frontend no tiene pruebas funcionales reales.
- El estado vacio de la pantalla principal necesita acciones mas claras.
- El boton "Ajustar filtros" estaba identificado como accion no conectada.
- Falta validacion end-to-end.

### Estado de release

Documento relacionado:

- `auditoria/estado_actual_release.md`

Decision actual:

- Produccion general: no aprobada todavia.
- Beta controlada: posible despues de cubrir pruebas criticas y cerrar hallazgos altos.

---

## 10. Testing y calidad

### Verificacion ejecutada

Backend:

```bash
npm test
npm run build
```

Resultado observado:

- Backend build OK.
- Tests backend existentes pasaron.
- Cobertura real concentrada inicialmente en autenticacion.
- Mantenimiento 2026-05-24: `npm test -- src/__tests__/middleware.test.ts` y `npm run build` verificados nuevamente en verde.

Frontend:

```bash
npm test -- --run
npm run build
```

Resultado observado:

- Frontend build OK.
- La suite frontend actual incluye pruebas reales para `Home`, `RadarPanel` y `Login`.
- Se agregaron pruebas de contrato visual para el lenguaje de radar comunitario, KPIs del radar y tarjeta compacta de inicio de sesion.
- Build mostro advertencia de bundle principal mayor a 500 kB.
- Mantenimiento 2026-05-24: pruebas de `Home`, `Login` y `RadarPanel` nuevamente en verde.
- Mantenimiento 2026-05-24: `npm run build` no pudo certificarse por un error de resolucion/acceso a `vite.config.ts` reportado por `esbuild`.

### Pruebas prioritarias pendientes

Frontend:

- Validacion visual mobile-first de `Home`
- `Map`
- `MapFilters`
- Auth flow
- Dashboard vendedor
- Estado vacio con recuperacion completa
- Ubicacion denegada
- Detalle de vendedor
- Incidentes

Backend:

- Vendors nearby.
- Vendors permisos.
- Products CRUD.
- Notifications alerts.
- Incidents create/status.
- WebSocket auth y permisos.
- Refresh token y sesion expirada.

End-to-end:

- Usuario encuentra vendedor cercano.
- Vendedor activa visibilidad y aparece en mapa.
- Usuario reporta incidente y autoridad lo gestiona.
- Usuario sin ubicacion recibe estado de recuperacion.
- Sesion expirada redirige o refresca correctamente.

---

## 11. UX y producto

### Actualizacion visual mobile-first - 2026-05-17

Se incorporo una mejora visual inspirada en el prototipo comparativo `proyecto-gemenis`, adaptada a la arquitectura real de CercaYa y sin migrar a Firebase ni Google Maps. La prioridad de diseno queda definida como **mobile-first**: cada cambio visual debe revisarse primero en viewport de celular y despues en escritorio.

Cambios aplicados:

- `frontend/src/pages/Home.tsx`
  - Panel lateral de escritorio renovado con lenguaje de "Radar comunitario".
  - Metricas rapidas de activos, encuentros y radio.
  - CTA de alertas mas visible y conectado a la apertura del radar.
  - Estado vacio mantiene accion para ampliar busqueda.

- `frontend/src/components/RadarPanel.tsx`
  - Redisenado como panel de actividad local.
  - Agrega KPIs "Actividad hoy" y "Por revisar".
  - Lista de encuentros con tarjetas tactiles y mejor jerarquia visual.

- `frontend/src/components/VendorDetails.tsx`
  - Panel de detalle mas compacto y moderno.
  - Hero visual con categoria/foto, estado activo y cierre accesible.
  - Metricas de rating, opiniones y distancia.
  - Botones principales `Contactar` y `Ruta` con mayor area tactil.

- `frontend/src/pages/Login.tsx`
  - Pantalla de inicio de sesion compactada para celular.
  - Menor ancho maximo, logo mas pequeno, padding reducido, inputs y boton mas bajos.
  - Mantiene el estilo premium pero evita ocupar demasiada altura en pantallas moviles.

Regla de producto vigente:

- CercaYa debe sentirse como una app de calle: rapida, tactil, clara y usable con una mano.
- Evitar pantallas de escritorio encogidas en celular.
- Todo formulario o panel importante debe validarse visualmente en viewport movil antes de cerrar el cambio.

### Pantalla principal

Fortalezas:

- El mapa es protagonista.
- El radio de busqueda comunica cercania.
- La interfaz tiene direccion visual clara.
- El panel lateral explica resultados cercanos y actividad comunitaria.
- El radar ahora tiene KPIs y tarjetas de actividad mas legibles.
- El detalle de vendedor muestra informacion clave y acciones principales con mejor jerarquia.

Riesgos:

- Estado vacio todavia debe validarse con usuarios reales.
- Acciones de recuperacion deben probarse en flujo completo.
- Filtros deben abrirse claramente desde estados sin resultados.
- El texto secundario debe cuidar contraste.
- La busqueda debe tener comportamiento definido.
- La experiencia movil debe seguir siendo el criterio principal de aceptacion.

Mejoras recomendadas:

1. Convertir estado vacio en guia accionable.
2. Mostrar botones: ampliar radio, cambiar categoria, activar alerta.
3. Hacer el radio editable desde el panel cuando no hay resultados.
4. Definir busqueda por nombre, categoria, producto o empresa.
5. Probar accesibilidad de contraste, foco y navegacion.
6. Revisar cada pantalla principal en celular antes de escritorio.

---

## 12. Base de datos y migraciones

Tecnologia:

- PostgreSQL.
- PostGIS.
- node-pg-migrate.

Archivos relevantes:

- `backend/migrations/1777580656392_init-db.js`
- `backend/migrations/1746660000000_unique-review-per-user.js`
- `backend/migrations/1777580774597_refresh-tokens.js`
- `backend/src/migrations/001_create_incidents.sql`
- `scripts/init-postgis.sql`

Comandos:

```bash
cd backend
npm run migrate
npm run migrate:up
npm run migrate:down
npm run migrate:create
```

Pendientes:

- Confirmar que todas las tablas reales estan cubiertas por migraciones versionadas.
- Documentar estrategia de rollback.
- Evitar que el arranque de la app cree esquema de forma no versionada.

---

## 13. Despliegue

Frontend:

- Vite.
- Vercel configurado mediante `frontend/vercel.json`.
- Dockerfile y nginx disponibles.

Backend:

- Express/Node.
- Railway configurado mediante `backend/railway.json`.
- Dockerfile disponible.

Pendientes antes de produccion:

- CI/CD con build, test y lint.
- Variables de entorno verificadas.
- Health check productivo.
- Logs y monitoreo.
- Validacion de CORS.
- Confirmar que migraciones corren de forma controlada.

---

## 14. Configuracion local

### Requisitos

- Node.js 18 o superior.
- PostgreSQL 14 o superior.
- Extension PostGIS.
- npm.

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Pruebas

```bash
cd backend
npm test
npm run build
```

```bash
cd frontend
npm test -- --run
npm run build
```

---

## 15. Estado actual por categoria

| Categoria | Estado | Nota |
|---|---|---|
| Objetivo de producto | Claro | Conectar actividad cercana en tiempo real. |
| Arquitectura | Buena | Backend/frontend separados, TypeScript completo. |
| Seguridad | Fuerte pero requiere verificacion final | Remediacion avanzada, falta validar entorno/historial. |
| Backend | Endurecido y verificado | `npm audit` en 0; auth/middleware y build verificados. |
| Frontend | Parcialmente verificado | Pruebas UI de Home, RadarPanel y Login en verde; quedan 2 moderadas de `vite/esbuild` y el build necesita revision adicional. |
| UX principal | Mejorada con enfoque mobile-first | Radar, detalle de vendedor e inicio de sesion fueron compactados/renovados. |
| Documentacion | Abundante | Ahora consolidada en este archivo. |
| Auditoria | En proceso | Seguridad y producto documentados. |
| CI/CD | Configurado | Workflow GitHub Actions con lint, test y build para backend/frontend. |
| E2E | Iniciado | Primer flujo browser: usuario encuentra vendedor cercano con API mockeada. |

---

## 16. Roadmap recomendado

### Fase 1 - Orden documental

- [x] Crear documentacion consolidada.
- [ ] Marcar documentos antiguos como historicos.
- [ ] Corregir encoding roto en documentos principales.
- [ ] Mantener este archivo como fuente principal.

### Fase 2 - Cierre de beta

- [x] Ejecutar y revisar todos los tests backend nuevos.
- [x] Agregar tests frontend reales.
- [x] Corregir boton "Ajustar filtros".
- [x] Mejorar estado vacio.
- [x] Validar flujo usuario encuentra vendedor.
- [x] Aplicar actualizacion visual mobile-first en Home, RadarPanel, VendorDetails y Login.
- [ ] Validar flujo vendedor aparece en mapa.
- [ ] Validar flujo incidente.
- [ ] Revisar visualmente todas las pantallas criticas en celular.


### Fase 3 - Produccion

- [x] CI/CD con test, lint y build.
- [ ] E2E estables.
- [ ] Observabilidad.
- [ ] Migracion controlada de `vite` a `8.x` para cerrar las 2 vulnerabilidades `moderate` restantes del frontend.
- [ ] Revision final de seguridad.
- [ ] Politica de privacidad/ubicacion.
- [ ] Validacion con usuarios reales.

---

## 17. Documentos historicos relacionados

Los siguientes archivos se mantienen como referencia historica:

- `README.md`
- `CercaYa_Documentation.md`
- `CercaYa_Documentacion_Despliegue.md`
- `DEPLOY.md`
- `CHECKLIST_DEPLOY.md`
- `ANALISIS_PROYECTO.md`
- `CHANGELOG.md`
- `auditoria/README.md`
- `auditoria/security_findings.md`
- `auditoria/resumen_ejecutivo.md`
- `auditoria/informe_auditoria.md`
- `auditoria/checklist_remediacion.md`
- `auditoria/estado_remediacion.md`
- `auditoria/estado_actual_release.md`
- `auditoria/auditoria_funcional_producto.md`
- `auditoria/INFORME_FINAL_AUDITORIA.md`
- `auditoria/RESUMEN_CAMBIOS_2026-04-30.md`

---

## 18. Criterio de decision

### Beta controlada

Puede considerarse cuando:

- Backend y frontend compilan.
- Tests backend principales pasan.
- Existen pruebas frontend reales para la pantalla principal.
- Estado vacio y filtros estan cerrados.
- Variables de entorno estan verificadas.
- Los flujos principales estan comprobados manualmente o con E2E basico.

### Produccion publica

No se recomienda hasta tener:

- CI/CD.
- E2E.
- Cobertura razonable en modulos criticos.
- Observabilidad.
- Politica de privacidad/ubicacion.
- Auditoria final sin pendientes altos.

---

## 19. Conclusion

CercaYa tiene una propuesta clara y una arquitectura saludable. La seguridad avanzo mucho respecto a los hallazgos originales, y el producto tiene una direccion fuerte alrededor del mapa, la cercania y el tiempo real.

El mayor riesgo actual no es la idea ni la arquitectura: es la validacion. Falta demostrar con pruebas funcionales y end-to-end que el usuario realmente puede encontrar actividad cercana, actuar sobre ella y recuperarse cuando no hay resultados.

Este documento debe servir como fuente principal para ordenar el trabajo: primero cerrar documentacion y pruebas criticas, luego mejorar UX principal, y despues preparar beta/produccion con mayor confianza.

---

## 20. Accesibilidad, beneficios para usuarios y monetizacion

Esta seccion define mejoras orientadas a que el usuario entienda mejor que puede hacer con CercaYa, reciba beneficios claros y tenga opciones de valor que permitan monetizar sin elevar demasiado el costo.

### 20.1 La app cumple el objetivo?

El objetivo principal de CercaYa es ayudar a encontrar actividad util cerca de la ubicacion del usuario.

La app esta bien orientada porque incluye:

- Mapa principal.
- Ubicacion del usuario.
- Radio de busqueda.
- Vendedores cercanos.
- Filtros por categoria.
- Alertas.
- Radar de actividad.
- Dashboard de vendedor.
- Incidentes.

Sin embargo, para afirmar que cumple completamente el objetivo faltan pruebas funcionales y mejoras de experiencia:

- Validar que el usuario entiende que hacer al abrir la app.
- Validar que puede encontrar vendedores sin explicaciones externas.
- Validar que entiende que pasa cuando no hay resultados.
- Validar que alertas y radio de busqueda generan valor real.
- Validar que los vendedores aparecen correctamente cuando estan activos.

Conclusion: CercaYa cumple conceptualmente el objetivo, pero debe reforzar claridad, accesibilidad y pruebas de uso antes de afirmar cumplimiento completo.

### 20.2 Accesibilidad y claridad de uso

La accesibilidad no debe verse solo como contraste o tamanos de texto. En CercaYa tambien significa que el usuario entienda rapido:

- Donde esta.
- Que hay cerca.
- Que puede buscar.
- Que hacer si no hay resultados.
- Como activar alertas.
- Como contactar o seguir a un vendedor.

Mejoras recomendadas:

1. Estado inicial claro
   - Mostrar un mensaje corto como: "Encuentra vendedores, tiendas y servicios cerca de ti".
   - Evitar pantallas vacias sin accion.
   - Mostrar tres acciones visibles: "Ampliar radio", "Cambiar categoria", "Activar alerta".

2. Estado vacio accionable
   - Si no hay resultados, no decir solo "no hay nada".
   - Sugerir: ampliar de 200 m a 500 m, activar alerta, ver categorias populares o explorar otra zona.

3. Controles mas comprensibles
   - El boton de filtros debe decir "Filtros" o tener tooltip.
   - El radio debe verse como una decision del usuario, no solo como dato.
   - La busqueda debe explicar ejemplos: comida, farmacia, gas, frutas, tienda.

4. Accesibilidad visual
   - Mejorar contraste de textos secundarios.
   - Mantener foco visible en botones e inputs.
   - Garantizar tamanos minimos tactiles en movil.
   - No depender solo del color para indicar estados.

5. Accesibilidad cognitiva
   - Usar lenguaje simple.
   - Evitar terminos internos como "radar" sin explicar con contexto visual.
   - Mostrar beneficios concretos: "Te avisamos si aparece cerca".

6. Accesibilidad para ubicacion
   - Si el usuario niega GPS, permitir buscar por barrio o mover el mapa.
   - Explicar por que se pide ubicacion.
   - Ofrecer "usar ubicacion aproximada".

### 20.3 Beneficios para clientes/compradores

Para que los usuarios clientes sientan beneficio real, la app debe resolver necesidades concretas:

- Encontrar rapido algo cerca.
- Ahorrar tiempo caminando o preguntando.
- Saber si un vendedor esta activo ahora.
- Recibir avisos cuando algo aparece cerca.
- Ver categorias utiles del dia a dia.
- Tener informacion basica de confianza antes de contactar.

Beneficios visibles que deberian comunicarse dentro de la experiencia:

- "Encuentra vendedores cerca sin salir a buscar".
- "Recibe alertas cuando aparezca lo que necesitas".
- "Aumenta el radio si no hay resultados".
- "Guarda categorias que te interesan".
- "Consulta actividad reciente cerca de ti".

Datos utiles para cada vendedor:

- Distancia aproximada.
- Categoria.
- Estado activo/inactivo.
- Ultima actualizacion.
- Telefono o WhatsApp.
- Productos destacados.
- Horario si aplica.
- Calificacion o senal de confianza cuando exista.

### 20.4 Notificaciones con limites

Las notificaciones pueden ser una base fuerte de monetizacion, pero deben tener limites para no molestar al usuario.

Modelo recomendado:

#### Plan gratuito para clientes

- 1 a 3 alertas activas.
- Radio limitado, por ejemplo 300 m o 500 m.
- Frecuencia limitada, por ejemplo maximo 3 notificaciones por dia.
- Categorias basicas.
- Notificaciones solo de vendedores activos cerca.

Objetivo: que el usuario perciba valor sin saturarse.

#### Plan cliente plus de bajo costo

- Mas alertas activas.
- Mayor radio de notificacion.
- Prioridad en avisos.
- Historial de actividad mas amplio.
- Alertas por categoria especifica.
- Alertas por vendedor favorito.
- Alertas silenciosas o resumen diario.

Ejemplo de valor:

- Gratis: "Te avisamos de hasta 3 cosas cerca".
- Plus: "Recibe mas avisos, mas lejos y con filtros mas precisos".

#### Limites saludables

- Control para pausar notificaciones.
- Horarios de silencio.
- Maximo de notificaciones por hora.
- Opcion "solo avisos importantes".
- Explicacion de por que llego cada notificacion.

### 20.5 Monetizacion de bajo costo

La monetizacion debe cuidar que CercaYa no pierda su valor comunitario. Es mejor cobrar poco por mejoras claras que bloquear funciones esenciales.

Opciones recomendadas:

1. Plan premium para vendedores
   - Mayor visibilidad en el mapa.
   - Perfil destacado.
   - Mas productos publicados.
   - Estadisticas basicas de vistas/contactos.
   - Horarios y zonas de cobertura.
   - Alertas a clientes interesados.

2. Plan plus para clientes
   - Mas alertas.
   - Mayor radio.
   - Favoritos.
   - Historial extendido.
   - Resumen diario/semanal de actividad cercana.

3. Destacados por categoria
   - Vendedores pueden pagar poco por aparecer destacados en una categoria.
   - Debe marcarse como destacado para mantener transparencia.

4. Suscripcion por microzonas
   - Comercios pagan por visibilidad en un barrio o zona pequena.
   - Bajo costo porque el alcance es local.

5. Paquetes de notificaciones para vendedores
   - El vendedor puede enviar avisos limitados a usuarios cercanos interesados.
   - Debe evitar spam: solo usuarios que aceptaron esa categoria.

6. Comision por contacto calificado
   - No cobrar por ver el mapa.
   - Cobrar al vendedor por contactos adicionales o leads verificados.

7. Alianzas locales
   - Negocios o servicios municipales pueden patrocinar categorias utiles.
   - Ejemplo: gas, agua, reciclaje, farmacias, mercados.

### 20.6 Modelo de planes sugerido

| Plan | Usuario | Precio sugerido | Beneficio |
|---|---|---:|---|
| Gratis | Cliente | 0 | Mapa, busqueda, pocas alertas y radio basico. |
| Cliente Plus | Cliente | Bajo costo mensual | Mas alertas, mas radio, favoritos e historial. |
| Vendedor Basico | Vendedor | 0 o bajo costo | Aparecer en mapa y administrar perfil simple. |
| Vendedor Pro | Vendedor | Bajo costo mensual | Perfil destacado, mas productos, estadisticas y avisos. |
| Zona Local | Comercio/empresa | Costo por zona | Visibilidad destacada por barrio/categoria. |

### 20.7 Reglas para monetizar sin danar la experiencia

- No ocultar el mapa basico detras de pago.
- No bloquear busqueda esencial.
- No saturar al usuario con notificaciones pagadas.
- Marcar claramente contenido destacado.
- Dar control sobre radio, categorias y horarios.
- Cobrar por alcance, precision o prioridad, no por funciones basicas de utilidad.
- Mantener un plan gratis realmente util.

### 20.8 Metricas de producto y monetizacion

Para saber si estas mejoras funcionan, medir:

- Usuarios que permiten ubicacion.
- Usuarios que encuentran al menos un vendedor.
- Cambios de radio despues de estado vacio.
- Alertas creadas por usuario.
- Notificaciones abiertas.
- Contactos a vendedores.
- Vendedores activos por dia.
- Tiempo promedio visible de vendedores.
- Conversion de vendedor basico a pro.
- Conversion de cliente gratis a plus.
- Cancelaciones o pausas de notificaciones.

### 20.9 Prioridad recomendada

1. Corregir estado vacio y boton de filtros.
2. Hacer comprensible el valor de alertas.
3. Crear limites de notificaciones en plan gratis.
4. Agregar favoritos o categorias seguidas.
5. Crear propuesta de plan vendedor pro.
6. Medir contactos y notificaciones antes de cobrar fuerte.
7. Validar con usuarios reales si pagarian por mas radio, mas alertas o vendedores destacados.
