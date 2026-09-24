# Auditoria funcional y de producto - CercaYa

**Fecha:** 2026-05-24  
**Proyecto:** CercaYa  
**Estado:** Remediación de seguridad completada / Evaluación funcional en progreso  
**Contexto:** Actualización tras implementación de cookies httpOnly y testing de persistencia.

---

## 1. Objetivo evaluado

CercaYa busca conectar usuarios con vendedores, comercios, servicios cercanos e incidentes locales en tiempo real, usando ubicacion, mapa, filtros, alertas y flujos diferenciados para usuarios, vendedores y autoridades.

La pregunta principal de esta auditoria es:

> La app ayuda rapido a una persona a encontrar algo util cerca de su ubicacion?

---

## 2. Alcance actual de la app

### Incluido en el alcance

- Mapa principal con ubicacion del usuario.
- Busqueda de vendedores cercanos por radio, categoria y tipo.
- Listado y detalle de vendedores.
- Radar o historial reciente de actividad cercana.
- Alertas de actividad cercana.
- Registro e inicio de sesion.
- Dashboard de vendedor.
- Activacion/desactivacion de visibilidad del vendedor.
- Actualizacion de ubicacion del vendedor.
- Reporte de incidentes.
- Dashboard de autoridad para gestion de incidentes.
- API backend con autenticacion, vendedores, productos, notificaciones e incidentes.
- WebSocket para eventos en tiempo real.

### Fuera de alcance o no comprobado todavia

- Pagos dentro de la app.
- Logistica de entrega.
- Chat completo comprador-vendedor.
- Reputacion avanzada o moderacion completa.
- Analitica de negocio para vendedores.
- Validacion con usuarios reales.
- Pruebas end-to-end en navegador.
- Pruebas de carga o concurrencia.

---

## 3. Verificacion tecnica ejecutada

### Backend

**Pruebas de Integración (24/05):**
- Ejecución de `npm test` con **Supertest Agents**.
- Validación de persistencia de cookies en flujos de auth.
- Middleware de autenticación soporta Cookies y Authorization Header.
- Estabilización de tests de productos, notificaciones e incidentes completada.

Resultado:
- **5 suites** pasaron.
- Flujo de Refresh Token vía cookie `httpOnly` verificado.
- Endpoint de Logout verificado (limpieza de cookies).

Comando ejecutado:

```bash
npm run build
```

Resultado:

- Build TypeScript exitoso.

### Frontend

**Pruebas de Componentes (24/05):**
- Pruebas reales para `Home`, `Login` y `RadarPanel` en Vitest.

Resultado:
- Configuración de Axios con `withCredentials` habilitada.
- Interceptor de errores 401 para auto-refresh implementado.
- Redirección controlada al Login tras expiración definitiva.

Comando ejecutado:

```bash
npm run build
```

Resultado:

- Build exitoso.
- Advertencia: bundle principal mayor a 500 kB despues de minificacion.

---

## 4. Hallazgos principales

### [ALTO] Estado vacio de la pantalla principal no resuelve el problema del usuario

**Riesgo:** Si no hay resultados, el usuario puede abandonar la app sin entender como ampliar la busqueda.  
**Evidencia:** La pantalla muestra "Silencio en el area" y sugiere ajustar filtros.  
**Recomendacion:** Convertir el estado vacio en una guia accionable: ampliar radio, cambiar categoria, ver negocios abiertos o activar alerta.

### [ALTO] Botón "Ajustar filtros" sin acción

**Archivo:** `frontend/src/pages/Home.tsx`  
**Riesgo:** El boton promete ayudar al usuario cuando no hay resultados, pero no ejecuta ninguna accion.  
**Evidencia:** `onClick={() => {}}`  
**Recomendacion:** Conectar ese boton con la apertura del panel de filtros o mover el control de radio/categoria al estado vacio.

### [MEDIO] Búsqueda visualmente presente, pero su alcance funcional no esta verificado

**Archivo:** `frontend/src/components/MapFilters.tsx`  
**Riesgo:** El usuario puede escribir una busqueda esperando resultados, pero no queda claro si filtra contra backend, lista local o nada.  
**Recomendacion:** Definir comportamiento esperado de busqueda y cubrirlo con prueba funcional.

### [MEDIO] Falta validacion end-to-end

**Riesgo:** Backend, frontend y WebSocket pueden funcionar por separado pero fallar en el flujo completo.  
**Recomendacion:** Agregar pruebas E2E con navegador para los flujos principales.

---

## 5. Matriz de flujos criticos

| Flujo | Aporta al objetivo | Estado actual | Prueba recomendada | Prioridad |
|---|---:|---|---|---|
| Abrir app y obtener ubicacion | Alta | Existe, no validado E2E | Simular permiso GPS y error de GPS | Alta |
| Ver vendedores cercanos | Alta | Existe, no validado E2E | Mock/API con vendedores cercanos | Alta |
| Estado sin vendedores | Alta | Existe, UX mejorable | Validar CTA de ampliar radio/filtros | Alta |
| Ajustar radio | Alta | Existe en filtros | Verificar llamada API con nuevo radio | Alta |
| Filtrar por categoria | Alta | Existe | Verificar categoria seleccionada y resultados | Alta |
| Buscar vendedor/empresa | Alta | UI existe, funcionalidad no clara | Definir y probar busqueda | Alta |
| Abrir detalle de vendedor | Alta | Existe | Click marcador/tarjeta y ver detalle | Alta |
| Crear alerta | Media/Alta | Existe como modulo | Crear, listar y eliminar alerta | Media |
| Vendedor crea negocio | Alta | Existe dashboard | Crear vendor y verlo en mapa | Alta |
| Vendedor activa visibilidad | Alta | Existe endpoint/flujo | Toggle visible y aparecer en nearby | Alta |
| Actualizar ubicacion vendedor | Alta | Existe | Enviar ubicacion y validar mapa/API | Alta |
| Reportar incidente | Media | Existe | Crear incidente desde mapa | Media |
| Autoridad gestiona incidente | Media | Existe dashboard | Cambiar estado y verificar persistencia | Media |
| Login/Register | Alta | **Verificado** | Cookies httpOnly + request.agent | Alta |
| Refresh token/sesión expirada | Alta | **Verificado** | Auto-refresh interceptor en frontend | Alta |

---

## 6. Checklist recomendado de pruebas

### Pruebas frontend

- [ ] Renderizar `Home` con ubicacion disponible.
- [ ] Renderizar estado de ubicacion denegada.
- [ ] Renderizar estado vacio sin vendedores.
- [x] Verificar que "Ajustar filtros" abre filtros o ejecuta accion real (Evento conectado).
- [ ] Cambiar radio y confirmar actualizacion de filtros.
- [ ] Cambiar categoria y confirmar actualizacion de filtros.
- [ ] Mostrar lista de vendedores cuando la API devuelve resultados.
- [ ] Abrir detalle de vendedor desde tarjeta.
- [ ] Abrir detalle de vendedor desde marcador del mapa.
- [ ] Crear alerta desde flujo de alertas.
- [x] Probar login exitoso y error de login.
- [ ] Probar registro exitoso y errores de validacion.
- [ ] Probar dashboard de vendedor con negocio existente.
- [ ] Probar dashboard de vendedor sin negocio.
- [ ] Probar formulario de incidente con ubicacion.

### Pruebas backend

- [x] Auth register/login/refresh/logout con persistencia de cookies.
- [ ] Vendors nearby con radio y categoria.
- [ ] Vendors nearby sin resultados.
- [ ] Vendors nearby con coordenadas invalidas.
- [ ] Crear vendor autenticado.
- [ ] Bloquear creacion de vendor sin auth.
- [ ] Actualizar ubicacion solo para propietario.
- [ ] Toggle visibilidad solo para propietario.
- [x] Products CRUD por propietario (Verificado en tests de integración).
- [x] Notifications alerts CRUD (Verificado en tests de integración).
- [x] Incidents create y nearby (Verificado en tests de integración).
- [ ] Authority update status con rol correcto.
- [ ] Bloquear authority endpoints para rol incorrecto.
- [ ] WebSocket handshake sin token.
- [ ] WebSocket handshake con token invalido.
- [ ] WebSocket update-location con vendor ajeno.

### Pruebas end-to-end

- [ ] Usuario nuevo se registra, inicia sesion y entra a la app.
- [ ] Usuario permite ubicacion y ve mapa.
- [ ] Usuario ajusta radio hasta encontrar resultados.
- [ ] Usuario filtra por categoria y abre detalle.
- [ ] Vendedor crea negocio, activa visibilidad y aparece en nearby.
- [ ] Usuario reporta incidente y autoridad lo ve.
- [ ] Sesion expirada redirige o refresca correctamente.

---

## 7. Recomendaciones de producto

1. Hacer que el estado vacio sea una pantalla de recuperacion, no un callejon sin salida.
2. Priorizar el flujo "encontrar algo cerca" sobre elementos secundarios.
3. Hacer visible y accionable el radio de busqueda desde el panel principal.
4. Clarificar si la busqueda busca por nombre, categoria, producto o empresa.
5. Separar visualmente vendedores, empresas y servicios publicos si el mapa mezcla todos.
6. Mostrar confianza minima del vendedor: abierto/activo, distancia, ultima actualizacion, categoria y contacto.
7. Incluir estados de error comprensibles para GPS, API caida, sin internet y sesion expirada.
8. Evitar controles que parezcan activos pero no tengan accion implementada.

---

## 8. Recomendaciones de auditoria

1. Mantener esta auditoria funcional separada de la auditoria de seguridad.
2. Crear un documento unico de estado actual de release.
3. Marcar cada hallazgo como: abierto, corregido, verificado con test o pendiente de verificacion.
4. No considerar el proyecto listo para produccion hasta tener pruebas funcionales de los flujos de mayor valor.
5. Usar el objetivo de producto como filtro: si una funcionalidad no ayuda a encontrar, contactar, alertar o gestionar actividad local, debe bajar de prioridad.

---

## 9. Estado recomendado antes de produccion

Para considerar CercaYa lista para una beta publica controlada:

- [ ] Backend build OK.
- [ ] Frontend build OK.
- [ ] Tests backend de auth, vendors, incidents y notifications pasando.
- [ ] Tests frontend reales para Home, filtros, auth y dashboard.
- [ ] Al menos 5 pruebas E2E de flujos criticos.
- [ ] Documentacion de auditoria sin contradicciones.
- [ ] Encoding corregido en docs y textos visibles.
- [ ] Estado vacio de pantalla principal accionable.
- [ ] Botones principales sin acciones vacias.
- [ ] Variables de entorno verificadas fuera del repo.

---

## 10. Conclusion

CercaYa tiene una base tecnica prometedora y una propuesta de producto clara. La auditoria de seguridad avanzo en puntos importantes, y los builds actuales pasan. Sin embargo, la app todavia necesita una capa de verificacion funcional y de producto para demostrar que cumple su objetivo principal: ayudar al usuario a encontrar actividad util cerca de su ubicacion.

El siguiente paso recomendado es convertir esta auditoria en tareas pequeñas: primero pantalla principal y filtros, luego flujos vendedor/usuario, y despues pruebas end-to-end.
