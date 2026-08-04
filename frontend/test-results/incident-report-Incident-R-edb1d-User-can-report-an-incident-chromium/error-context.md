# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: incident-report.spec.ts >> Incident Reporting Flow >> User can report an incident
- Location: e2e\incident-report.spec.ts:56:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForRequest: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for request "**/api/incidents"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e7]:
      - link "Logo CercaYa Cerca Ya Premium" [ref=e8] [cursor=pointer]:
        - /url: /
        - img "Logo CercaYa" [ref=e10]
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e13]: Cerca
            - generic [ref=e14]: Ya
          - generic [ref=e15]: Premium
      - navigation [ref=e16]:
        - link "Explorar" [ref=e17] [cursor=pointer]:
          - /url: /
          - generic [ref=e18]:
            - img [ref=e19]
            - text: Explorar
        - link "Mis Alertas" [ref=e21] [cursor=pointer]:
          - /url: /alerts
      - generic [ref=e22]:
        - button [ref=e23] [cursor=pointer]:
          - img [ref=e24]
        - generic [ref=e29]:
          - link "Citizen" [ref=e30] [cursor=pointer]:
            - /url: /profile
            - img [ref=e32]
            - generic [ref=e35]: Citizen
          - button [ref=e36] [cursor=pointer]:
            - img [ref=e37]
  - main [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - paragraph [ref=e46]: Radar comunitario
              - heading "Última hora en tu zona" [level=2] [ref=e47]
            - img [ref=e49]
          - generic [ref=e55]:
            - generic [ref=e56]:
              - generic [ref=e57]: "0"
              - text: activos
            - generic [ref=e58]:
              - generic [ref=e59]: "0"
              - text: encuentros
            - generic [ref=e60]:
              - generic [ref=e61]: 200m
              - text: radio
          - generic [ref=e62]:
            - generic [ref=e63]:
              - heading "Cerca de ti" [level=3] [ref=e64]
              - paragraph [ref=e65]: Mostrando 0 resultados en vivo
            - generic [ref=e66]: Vivo
        - generic [ref=e71]:
          - img [ref=e73]
          - heading "Silencio en el área" [level=3] [ref=e78]
          - paragraph [ref=e79]: No encontramos nada en este momento. Prueba expandiendo tu radio de búsqueda o cambiando de categoría.
          - button "Expandir y ajustar filtros" [ref=e80] [cursor=pointer]:
            - img [ref=e81]
            - text: Expandir y ajustar filtros
        - button "Alertas Activas Te avisaremos con un sonido cuando algo nuevo pase cerca." [active] [ref=e88] [cursor=pointer]:
          - img [ref=e90]
          - generic [ref=e95]:
            - paragraph [ref=e96]: Alertas Activas
            - paragraph [ref=e97]: Te avisaremos con un sonido cuando algo nuevo pase cerca.
      - generic [ref=e98]:
        - generic [ref=e100]:
          - generic:
            - generic:
              - img
            - button "👤" [ref=e102] [cursor=pointer]:
              - generic [ref=e106]: 👤
          - generic [ref=e107]:
            - link "Leaflet" [ref=e108] [cursor=pointer]:
              - /url: https://leafletjs.com
              - img [ref=e109]
              - text: Leaflet
            - text: "| ©"
            - link "OpenStreetMap" [ref=e113] [cursor=pointer]:
              - /url: https://www.openstreetmap.org/copyright
        - generic [ref=e116]:
          - generic [ref=e117]:
            - img [ref=e118]
            - textbox "Buscar vendedores, empresas..." [ref=e121]
          - button [ref=e122] [cursor=pointer]:
            - img [ref=e123]
        - generic [ref=e125]:
          - generic [ref=e126]:
            - generic [ref=e127]:
              - generic [ref=e128]:
                - paragraph [ref=e131]: Radar comunitario
                - heading "Actividad local" [level=2] [ref=e132]
              - button "Cerrar radar" [ref=e133] [cursor=pointer]:
                - img [ref=e134]
            - generic [ref=e137]:
              - generic [ref=e138]:
                - generic [ref=e139]:
                  - img [ref=e140]
                  - generic [ref=e142]: Actividad hoy
                - strong [ref=e143]: "0"
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - img [ref=e146]
                  - generic [ref=e148]: Por revisar
                - strong [ref=e149]: "0"
          - generic [ref=e151]:
            - img [ref=e153]
            - paragraph [ref=e156]: Buscando rastros...
            - paragraph [ref=e157]: Vendedores que hayan pasado cerca aparecerán aquí.
          - paragraph [ref=e159]: El radar guarda encuentros de las últimas 2 horas.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Incident Reporting Flow', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Mock the location permission
  6   |     await page.context().grantPermissions(['geolocation']);
  7   |     await page.context().setGeolocation({ latitude: 4.6097, longitude: -74.0817 });
  8   | 
  9   |     // Mock the auth endpoint (user login)
  10  |     await page.route('**/api/auth/login', async route => {
  11  |       await route.fulfill({
  12  |         status: 200,
  13  |         contentType: 'application/json',
  14  |         body: JSON.stringify({
  15  |           success: true,
  16  |           data: {
  17  |             token: 'fake-jwt-token',
  18  |             user: { id: 'u1', name: 'Citizen User', role: 'user' }
  19  |           }
  20  |         })
  21  |       });
  22  |     });
  23  | 
  24  |     await page.route('**/api/auth/me', async route => {
  25  |       await route.fulfill({
  26  |         status: 200,
  27  |         contentType: 'application/json',
  28  |         body: JSON.stringify({ id: 'u1', name: 'Citizen User', role: 'user' })
  29  |       });
  30  |     });
  31  | 
  32  |     // Mock the incident creation endpoint
  33  |     await page.route('**/api/incidents', async (route, request) => {
  34  |       if (request.method() === 'POST') {
  35  |         await route.fulfill({
  36  |           status: 201,
  37  |           contentType: 'application/json',
  38  |           body: JSON.stringify({
  39  |             id: 'incident1',
  40  |             type: 'seguridad',
  41  |             description: 'Robo reportado',
  42  |             status: 'reported',
  43  |             location: { type: 'Point', coordinates: [-74.0817, 4.6097] }
  44  |           })
  45  |         });
  46  |       } else {
  47  |         await route.fulfill({
  48  |           status: 200,
  49  |           contentType: 'application/json',
  50  |           body: '[]' // GET returns empty array to prevent errors
  51  |         });
  52  |       }
  53  |     });
  54  |   });
  55  | 
  56  |   test('User can report an incident', async ({ page }) => {
  57  |     // 1. Go to login
  58  |     await page.goto('/login');
  59  | 
  60  |     // 2. Fill login form
  61  |     await page.locator('input[type="email"]').fill('citizen@example.com');
  62  |     await page.locator('input[type="password"]').fill('password123');
  63  |     await page.locator('button[type="submit"]').click();
  64  | 
  65  |     // 3. Navigate to home (map view)
  66  |     await expect(page).toHaveURL('/');
  67  | 
  68  |     // 4. Click the incident report button (we'll try common selectors, e.g., an icon button or text)
  69  |     // Often it is a floating action button or something in the sidebar
  70  |     const incidentButton = page.locator('button').filter({ hasText: /Reportar|Incidente|Alerta/i }).first();
  71  |     
  72  |     // In case the button is just an icon, we'll click any button inside an incident panel or with title
  73  |     const alternativeButton = page.locator('button[title*="incidente" i], button[aria-label*="incidente" i]').first();
  74  |     
  75  |     if (await incidentButton.isVisible()) {
  76  |         await incidentButton.click();
  77  |     } else if (await alternativeButton.isVisible()) {
  78  |         await alternativeButton.click();
  79  |     }
  80  | 
  81  |     // 5. Fill out the incident form
  82  |     // Look for a textarea for description
  83  |     const descriptionInput = page.locator('textarea').first();
  84  |     if (await descriptionInput.isVisible()) {
  85  |         await descriptionInput.fill('Situacion de prueba E2E');
  86  |     }
  87  | 
  88  |     // Submit the form
  89  |     const submitBtn = page.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Reportar")').first();
  90  |     
  91  |     // Wait for the request to fire when we click submit
> 92  |     const requestPromise = page.waitForRequest('**/api/incidents');
      |                                 ^ Error: page.waitForRequest: Test timeout of 30000ms exceeded.
  93  |     if (await submitBtn.isVisible()) {
  94  |         await submitBtn.click();
  95  |     }
  96  |     
  97  |     // 6. Verify request was sent
  98  |     const request = await requestPromise;
  99  |     expect(request.method()).toBe('POST');
  100 |   });
  101 | });
  102 | 
```