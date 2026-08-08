import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 4.6097, longitude: -74.0817 });
});

test('usuario encuentra un vendedor cercano', async ({ page }) => {
  await page.route('http://localhost:3000/api/vendors/categories', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: [
          {
            id: 'bakery',
            name: 'Panaderia',
            icon: 'PAN',
            description: 'Pan y productos horneados',
          },
        ],
      },
    });
  });

  await page.route('http://localhost:3000/api/vendors/nearby**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: [
          {
            id: 'vendor-pan-1',
            user_id: 'seller-pan-1',
            name: 'Panaderia La Esquina',
            type: 'store',
            category: 'bakery',
            subcategories: [],
            phone: '+573001234567',
            whatsapp: '+573001234567',
            photos: [],
            rating: 4.8,
            review_count: 12,
            is_active: true,
            is_verified: true,
            location_active: true,
            distance_meters: 180,
            created_at: '2026-05-15T00:00:00.000Z',
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        ],
      },
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Cerca de ti' })).toBeVisible();
  await expect(page.getByText('Panaderia La Esquina')).toBeVisible();
  await expect(page.getByText('180m')).toBeVisible();
  await expect(page.getByText('Mostrando 1 resultados')).toBeVisible();
});
