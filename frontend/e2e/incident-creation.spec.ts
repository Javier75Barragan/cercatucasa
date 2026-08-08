import { expect, test } from '@playwright/test';

test.describe('Incident Creation', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 4.6097, longitude: -74.0817 });
  });

  test('User can create an incident report', async ({ page }) => {
    // Mock incident types
    await page.route('http://localhost:3000/api/incidents/types', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            { id: 'accident', name: 'Accidente', icon: '🚗', color: 'red' },
            { id: 'medical', name: 'Emergencia Médica', icon: '🚑', color: 'blue' }
          ]
        }
      });
    });

    // Mock incident creation
    await page.route('http://localhost:3000/api/incidents', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'incident-1',
            type: 'accident',
            name: 'Juan Perez'
          }
        }
      });
    });

    // Mock vendors API to prevent home page from hanging
    await page.route('http://localhost:3000/api/vendors/nearby**', async (route) => {
      await route.fulfill({
        json: { success: true, data: [] }
      });
    });

    await page.goto('/');

    // Ensure page loaded (accept possible heading variants)
    await expect(page.getByRole('heading', { name: /Última hora en tu zona|Radar comunitario/i })).toBeVisible();

    // Click the report incident button
    // It has a title "Reportar emergencia"
    const reportBtn = page.getByTitle('Reportar emergencia');
    // Try clicking the floating button robustly
    try {
      await reportBtn.click({ force: true });
    } catch (e) {
      // fallback to direct DOM click
      await page.locator('button[title="Reportar emergencia"]').evaluate((b: HTMLElement) => (b as HTMLElement).click());
    }

    // Verify modal opened
    const modalHeading = page.getByRole('heading', { name: 'Reporte Oficial de Emergencia' });
    await expect(modalHeading).toBeVisible();

    // Select incident type
    await page.getByRole('button', { name: /Accidente/i }).click();

    // Fill form
    await page.getByPlaceholder('Ej: Juan Pérez').fill('Juan Perez');
    await page.getByPlaceholder('300 123 4567').fill('3001234567');
    await page.getByPlaceholder('Describe brevemente').fill('Accidente en la esquina');

    // Submit
    const submitBtn = page.getByRole('button', { name: /ENVIAR REPORTE DE EMERGENCIA/i });
    await expect(submitBtn).not.toBeDisabled();
    await submitBtn.click();

    // Wait for modal to close (heading should disappear)
    await expect(modalHeading).toBeHidden();
  });
});
