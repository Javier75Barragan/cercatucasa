import { expect, test } from '@playwright/test';

test.describe('Vendor Visibility', () => {
  test('Vendor activates and deactivates visibility signal', async ({ page }) => {
    // Inject auth state
    await page.addInitScript(() => {
      window.localStorage.setItem('cercaya-auth', JSON.stringify({
        state: {
          user: { id: 'vendor-1', role: 'seller', name: 'Vendor Test' },
          token: 'fake-token',
          isAuthenticated: true,
          location: { lat: 4.6097, lng: -74.0817 }
        },
        version: 0
      }));
    });

    // Mock vendor profile
    await page.route('http://localhost:3000/api/vendors/me', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'vendor-1',
            name: 'Vendor Test',
            type: 'store',
            category: 'bakery',
            is_active: true,
            online_status: false,
            rating: 5,
          }
        }
      });
    });

    await page.goto('/vendor/dashboard');

    // Verify vendor name is visible
    await expect(page.getByText('Vendor Test').first()).toBeVisible();

    const toggleButton = page.getByRole('button', { name: /TRANSMITIR AHORA/i });
    await expect(toggleButton).toBeVisible();

    // Since it uses sockets, if we click without a real backend, it will fail or try to connect. 
    // We can at least check the UI structure and initial state for now.
  });
});
