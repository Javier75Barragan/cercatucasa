import { test, expect } from '@playwright/test';

test.describe('Incident Reporting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the location permission
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 4.6097, longitude: -74.0817 });

    // Mock the auth endpoint (user login)
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'fake-jwt-token',
            user: { id: 'u1', name: 'Citizen User', role: 'user' }
          }
        })
      });
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', name: 'Citizen User', role: 'user' })
      });
    });

    // Mock incident types
    await page.route('**/api/incidents/types', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'seguridad', name: 'Seguridad', icon: '🚨', color: 'red' }]
        })
      });
    });

    // Mock the incident creation endpoint
    await page.route('**/api/incidents', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'incident1',
            type: 'seguridad',
            description: 'Robo reportado',
            status: 'reported',
            location: { type: 'Point', coordinates: [-74.0817, 4.6097] }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]' // GET returns empty array to prevent errors
        });
      }
    });
  });

  test('User can report an incident', async ({ page }) => {
    // 1. Go to login
    await page.goto('/login');

    // 2. Fill login form
    await page.locator('input[type="email"]').fill('citizen@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // 3. Navigate to home (map view)
    await expect(page).toHaveURL('/');

    // 4. Click the incident report button
    const incidentButton = page.locator('button[title="Reportar emergencia"]');
    await incidentButton.click({ force: true });

    // 5. Fill out the incident form
    // Wait for the modal to be visible
    await page.waitForSelector('text=Reporte Oficial de Emergencia');
    
    // Select the incident type
    await page.getByText('Seguridad').click();
    
    // Fill required inputs
    const inputs = page.locator('input');
    // Name input is the first text input
    await inputs.nth(0).fill('Juan Perez');
    // Phone input is the tel input
    await page.locator('input[type="tel"]').fill('3001234567');

    // Look for a textarea for description
    const descriptionInput = page.locator('textarea').first();
    if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('Situacion de prueba E2E');
    }

    // Submit the form
    const submitBtn = page.locator('button[type="submit"], button:has-text("ENVIAR REPORTE")').first();
    
    // Wait for the request to fire when we click submit
    const requestPromise = page.waitForRequest('**/api/incidents');
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
    }
    
    // 6. Verify request was sent
    const request = await requestPromise;
    expect(request.method()).toBe('POST');
  });
});
