import { expect, test } from '@playwright/test';

test.describe('Incident Creation', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 4.6097, longitude: -74.0817 });
  });

  test('User can create an incident report', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'chromium') {
      testInfo.skip('This incident creation flow is mobile-only.');
    }

    // Mock incident types
    await page.route('**/api/incidents/types', async (route) => {
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

    // Mock incident creation (POST) and provide a GET fallback
    await page.route('**/api/incidents*', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'incident-1', type: 'accident', name: 'Juan Perez' } })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      }
    });

    // Mock vendors API to prevent home page from hanging
    await page.route('**/api/vendors/nearby**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const reportBtn = page.locator('button[title="Reportar emergencia"]');
    await expect(reportBtn).toBeVisible({ timeout: 15000 });
    await reportBtn.click({ force: true });

    const modalHeading = page.getByRole('heading', { name: /Reporte Oficial de Emergencia/i });
    await expect(modalHeading).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Accidente/i }).click();
    await page.getByPlaceholder(/Ej: Juan Pérez/i).fill('Juan Perez');
    await page.getByPlaceholder(/300 123 4567/i).fill('3001234567');
    await page.getByPlaceholder(/Describe brevemente/i).fill('Accidente en la esquina');

    // Esperar que el indicador de ubicación cambie a verde antes de verificar el texto.
    // El IncidentReportForm llama getCurrentPosition al abrirse — puede tardar en resolverse.
    await page.waitForFunction(
      () => {
        const dot = document.querySelector('.bg-green-500.animate-pulse');
        return dot !== null;
      },
      { timeout: 20000 }
    );
    await expect(page.getByText(/Ubicación detectada/i)).toBeVisible({ timeout: 5000 });

    const submitBtn = page.getByRole('button', { name: /ENVIAR REPORTE DE EMERGENCIA/i });
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });

    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/incidents') && res.status() === 201, { timeout: 15000 }),
      submitBtn.click()
    ]);

    await expect(modalHeading).toBeHidden({ timeout: 15000 });
  });
});
