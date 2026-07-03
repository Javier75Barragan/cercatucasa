import { expect, test } from '@playwright/test';

test.describe('User Login', () => {
  test('User can log in successfully', async ({ page }) => {
    // Mock login API
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          token: 'fake-jwt-token',
          data: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'customer'
          }
        }
      });
    });

    // We also need to mock getting profile on subsequent navigations or if it happens
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'customer'
          }
        }
      });
    });

    await page.goto('/login');

    // Fill login form
    await page.getByPlaceholder('tucorreo@ejemplo.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');

    // Submit
    await page.getByRole('button', { name: 'Entrar a CercaYa' }).click();

    // Verify redirect to home
    await expect(page).toHaveURL('/');
  });

  test('Shows error on invalid credentials', async ({ page }) => {
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        json: {
          success: false,
          error: 'Credenciales inválidas'
        }
      });
    });

    await page.goto('/login');

    await page.getByPlaceholder('tucorreo@ejemplo.com').fill('wrong@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpass');
    await page.getByRole('button', { name: 'Entrar a CercaYa' }).click();

    // Verify error message
    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
  });
});
