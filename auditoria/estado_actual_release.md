# Estado actual de release - CercaYa

**Fecha:** 2026-05-10  
**Estado recomendado:** No listo para produccion general. Candidato a beta controlada despues de completar pruebas funcionales criticas.  
**Fuente:** Revision de auditoria existente, verificacion de builds/tests y auditoria funcional de producto.

---

## 1. Resumen ejecutivo

CercaYa tiene una base tecnica solida y una propuesta clara: conectar usuarios con vendedores, comercios, servicios e incidentes cercanos en tiempo real. La remediacion de seguridad avanzo de forma importante: autenticacion, validacion, rate limiting, refresh tokens, Helmet, WebSocket autenticado y tests de auth.

Sin embargo, el proyecto aun necesita cierre de release:

- Hay cambios Git pendientes.
- La auditoria documental contiene estados historicos contradictorios.
- El frontend compila, pero no tiene pruebas funcionales reales.
- Faltan pruebas sobre los flujos que validan el objetivo principal del producto.
- Existen detalles UX/codigo que afectan la experiencia principal, como acciones visuales no conectadas.

---

## 2. Verificacion ejecutada

### Backend

```bash
npm test
```

Resultado:

- 2 suites pasaron.
- 14 tests pasaron.
- Cobertura concentrada en autenticacion.

```bash
npm run build
```

Resultado:

- Build TypeScript exitoso.

### Frontend

```bash
npm test -- --run
```

Resultado:

- 1 test paso.
- El test actual es de humo y no valida comportamiento real.

```bash
npm run build
```

Resultado:

- Build exitoso.
- Advertencia de bundle principal mayor a 500 kB.

---

## 3. Estado por area

| Area | Estado | Comentario |
|---|---|---|
| Backend build | OK | Compila correctamente. |
| Backend tests | Parcial | Auth probado; faltan vendors, products, notifications, incidents y WebSocket. |
| Frontend build | OK | Compila correctamente. |
| Frontend tests | Insuficiente | Solo test de humo. |
| Seguridad critica | Mayormente remediada | Requiere confirmar limpieza de historial y variables productivas. |
| Producto/UX | Parcial | La pantalla principal es prometedora, pero faltan acciones y estados accionables. |
| Documentacion | Parcial | Hay documentos utiles, pero con inconsistencias y encoding roto. |
| E2E | Pendiente | No hay pruebas completas de usuario a backend. |

---

## 4. Hallazgos vigentes

### [ALTO] Falta cobertura funcional del objetivo principal

La app debe demostrar que un usuario puede encontrar actividad cercana, filtrar, abrir detalles y actuar. Hoy los tests no cubren ese recorrido.

**Accion requerida:** Agregar pruebas funcionales y E2E para pantalla principal, filtros, detalle, auth, vendedor e incidentes.

### [ALTO] Frontend con prueba cosmetica

El test actual del frontend solo valida `expect(true).toBe(true)`.

**Accion requerida:** Reemplazarlo o complementarlo con pruebas reales de componentes y flujos.

### [ALTO] Boton de estado vacio sin accion

En `frontend/src/pages/Home.tsx`, el boton "Ajustar filtros" del estado vacio tiene una funcion vacia.

**Accion requerida:** Conectar ese boton con el panel de filtros o con una accion directa de ampliar radio.

### [MEDIO] Documentos historicos con estados contradictorios

Algunos documentos dicen "no listo para produccion", otros indican puntajes altos o cierre de remediacion. Esto puede confundir decisiones.

**Accion requerida:** Usar este archivo como fuente vigente y marcar documentos anteriores como historicos.

### [MEDIO] Encoding roto en documentos y textos visibles

Hay caracteres como `Ã¡`, `ðŸ` y `âœ` en varios documentos y algunos strings.

**Accion requerida:** Normalizar a UTF-8 y revisar textos visibles antes de beta.

### [MEDIO] Falta validacion real de WebSocket y geolocalizacion

La arquitectura usa tiempo real y ubicacion, pero falta probar el flujo completo.

**Accion requerida:** Agregar tests de handshake WebSocket, permisos por vendor y flujo de ubicacion.

---

## 5. Pendientes antes de beta controlada

- [ ] Resolver o documentar cambios Git pendientes.
- [ ] Crear pruebas frontend reales para `Home`, `MapFilters`, auth y dashboard vendedor.
- [ ] Crear tests backend para vendors, incidents, notifications y permisos.
- [ ] Crear al menos 3 pruebas E2E:
  - usuario encuentra vendedor cercano;
  - vendedor activa visibilidad y aparece;
  - usuario reporta incidente y autoridad lo ve.
- [ ] Corregir boton "Ajustar filtros".
- [ ] Mejorar estado vacio de pantalla principal.
- [ ] Confirmar variables de entorno fuera del repo.
- [ ] Confirmar limpieza o mitigacion de secretos en historial Git.
- [ ] Corregir encoding de documentos principales.
- [ ] Actualizar README o docs de setup segun estado real.

---

## 6. Pendientes antes de produccion general

- [ ] Cobertura backend amplia en modulos criticos.
- [ ] Pruebas E2E estables en CI.
- [ ] CI/CD con build, test y lint.
- [ ] Observabilidad minima: logs estructurados, health checks y errores.
- [ ] Validacion de seguridad de entorno productivo.
- [ ] Revision de accesibilidad de pantalla principal.
- [ ] Revision de performance del frontend y division de bundle si aplica.
- [ ] Politica clara de privacidad/ubicacion.
- [ ] Flujo de recuperacion para GPS denegado, API caida, sin conexion y sesion expirada.

---

## 7. Decision recomendada

**Produccion general:** No aprobar todavia.  
**Beta controlada:** Posible despues de cubrir flujos criticos y corregir hallazgos altos.  
**Siguiente foco:** Pruebas funcionales sobre la pantalla principal y flujo vendedor/usuario.

---

## 8. Documentos relacionados

- `auditoria_funcional_producto.md`
- `estado_remediacion.md`
- `checklist_remediacion.md`
- `security_findings.md`
- `informe_auditoria.md`
