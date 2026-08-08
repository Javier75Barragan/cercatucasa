# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vendor-visibility.spec.ts >> Vendor Visibility Flow >> Vendor can toggle visibility to become active
- Location: e2e\vendor-visibility.spec.ts:53:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://127.0.0.1:5173/"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    22 × unexpected value "http://127.0.0.1:5173/"

```

```yaml
- banner:
  - link "Logo CercaYa Cerca Ya Premium":
    - /url: /
    - img "Logo CercaYa"
    - text: Cerca Ya Premium
  - navigation:
    - link "Explorar":
      - /url: /
      - img
      - text: Explorar
    - link "Mis Alertas":
      - /url: /alerts
  - button:
    - img
  - link "Vendor":
    - /url: /profile
    - img
    - text: Vendor
  - button:
    - img
- main:
  - paragraph: Radar comunitario
  - heading "Última hora en tu zona" [level=2]
  - img
  - text: 0 activos 0 encuentros 200m radio
  - heading "Cerca de ti" [level=3]
  - paragraph: Mostrando 0 resultados en vivo
  - text: Vivo
  - img
  - heading "Silencio en el área" [level=3]
  - paragraph: No encontramos nada en este momento. Prueba expandiendo tu radio de búsqueda o cambiando de categoría.
  - button "Expandir y ajustar filtros":
    - img
    - text: Expandir y ajustar filtros
  - button "Alertas Activas Te avisaremos con un sonido cuando algo nuevo pase cerca.":
    - img
    - paragraph: Alertas Activas
    - paragraph: Te avisaremos con un sonido cuando algo nuevo pase cerca.
  - img
  - button "👤"
  - link "Leaflet":
    - /url: https://leafletjs.com
  - text: ©
  - link "OpenStreetMap":
    - /url: https://www.openstreetmap.org/copyright
  - img
  - textbox "Buscar vendedores, empresas..."
  - button:
    - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Vendor Visibility Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Mock the location permission
  6  |     await page.context().grantPermissions(['geolocation']);
  7  |     await page.context().setGeolocation({ latitude: 4.6097, longitude: -74.0817 });
  8  | 
  9  |     // Mock the auth endpoint
  10 |     await page.route('**/api/auth/login', async route => {
  11 |       await route.fulfill({
  12 |         status: 200,
  13 |         contentType: 'application/json',
  14 |         body: JSON.stringify({
  15 |           success: true,
  16 |           data: {
  17 |             token: 'fake-jwt-token',
  18 |             user: { id: 'v1', name: 'Vendor User', role: 'vendor' }
  19 |           }
  20 |         })
  21 |       });
  22 |     });
  23 | 
  24 |     // Mock getting the current user profile
  25 |     await page.route('**/api/auth/me', async route => {
  26 |       await route.fulfill({
  27 |         status: 200,
  28 |         contentType: 'application/json',
  29 |         body: JSON.stringify({ id: 'v1', name: 'Vendor User', role: 'vendor' })
  30 |       });
  31 |     });
  32 | 
  33 |     // Mock the vendor profile
  34 |     await page.route('**/api/vendors/me', async route => {
  35 |       await route.fulfill({
  36 |         status: 200,
  37 |         contentType: 'application/json',
  38 |         body: JSON.stringify({
  39 |           id: 'vendor1',
  40 |           businessName: 'Arepas El Paisa',
  41 |           isActive: false, // Starts offline
  42 |           location: { type: 'Point', coordinates: [-74.0817, 4.6097] }
  43 |         })
  44 |       });
  45 |     });
  46 | 
  47 |     // Mock products
  48 |     await page.route('**/api/products/vendor/*', async route => {
  49 |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  50 |     });
  51 |   });
  52 | 
  53 |   test('Vendor can toggle visibility to become active', async ({ page }) => {
  54 |     // 1. Go to login
  55 |     await page.goto('/login');
  56 | 
  57 |     // 2. Fill login form
  58 |     await page.locator('input[type="email"]').fill('vendor@example.com');
  59 |     await page.locator('input[type="password"]').fill('password123');
  60 |     await page.locator('button[type="submit"]').click();
  61 | 
  62 |     // 3. Should redirect to vendor dashboard
> 63 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  64 |     await expect(page.locator('text=Arepas El Paisa').first()).toBeVisible();
  65 | 
  66 |     // 4. Mock the toggle endpoint before clicking
  67 |     let toggleCalled = false;
  68 |     await page.route('**/api/vendors/*/location/toggle', async route => {
  69 |       toggleCalled = true;
  70 |       await route.fulfill({
  71 |         status: 200,
  72 |         contentType: 'application/json',
  73 |         body: JSON.stringify({
  74 |           isActive: true, // Now it's active
  75 |           location: { type: 'Point', coordinates: [-74.0817, 4.6097] }
  76 |         })
  77 |       });
  78 |     });
  79 | 
  80 |     // 5. Find the toggle button
  81 |     // It's likely a button that has the text "No Visible" or an icon
  82 |     const toggleButton = page.locator('button').filter({ hasText: /Visible|Disponible|Activar|No/i }).first();
  83 |     if (await toggleButton.isVisible()) {
  84 |         await toggleButton.click();
  85 |     } else {
  86 |         await page.locator('button[role="switch"]').click().catch(() => {});
  87 |     }
  88 | 
  89 |     // Give it a moment to process the mock response
  90 |     await page.waitForTimeout(500);
  91 |     
  92 |     // Assert that the network request was made
  93 |     expect(toggleCalled).toBe(true);
  94 |   });
  95 | });
  96 | 
```