import { test, expect } from '@playwright/test';

test.describe('Vendor Visibility Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the location permission
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 4.6097, longitude: -74.0817 });

    // Mock the auth endpoint
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'fake-jwt-token',
            user: { id: 'v1', name: 'Vendor User', role: 'vendor' }
          }
        })
      });
    });

    // Mock getting the current user profile
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'v1', name: 'Vendor User', role: 'vendor' })
      });
    });

    // Mock the vendor profile
    await page.route('**/api/vendors/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'vendor1',
          businessName: 'Arepas El Paisa',
          isActive: false, // Starts offline
          location: { type: 'Point', coordinates: [-74.0817, 4.6097] }
        })
      });
    });

    // Mock products
    await page.route('**/api/products/vendor/*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('Vendor can toggle visibility to become active', async ({ page }) => {
    // 1. Go to login
    await page.goto('/login');

    // 2. Fill login form
    await page.locator('input[type="email"]').fill('vendor@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // 3. Navigate to vendor dashboard
    await page.goto('/vendor/dashboard');
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
    await expect(page.locator('text=Arepas El Paisa').first()).toBeVisible();

    // 4. Mock the toggle endpoint before clicking
    let toggleCalled = false;
    await page.route('**/api/vendors/*/location/toggle', async route => {
      toggleCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isActive: true, // Now it's active
          location: { type: 'Point', coordinates: [-74.0817, 4.6097] }
        })
      });
    });

    // 5. Find the toggle button
    const toggleButton = page.locator('button').filter({ hasText: /TRANSMITIR AHORA|DETENER SEÑAL/i }).first();
    if (await toggleButton.isVisible()) {
        await toggleButton.click();
    } else {
        await page.locator('button[role="switch"]').click().catch(() => {});
    }

    // Give it a moment to process the mock response
    await page.waitForTimeout(500);
    
    // Assert that the network request was made
    expect(toggleCalled).toBe(true);
  });
});
