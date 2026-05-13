import { test, expect } from '@playwright/test';

test.describe('Protected Routes - Logged Out', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure logged out
    await page.goto('/');
    // Clear storage
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('/products redirects to /signin', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('/cart redirects to /signin', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('/favorites redirects to /signin', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('After signin, returns to intended page', async ({ page }) => {
    // Try to go to cart while logged out
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/signin/);
    
    // Sign in
    await page.getByLabel('Email').fill('existing@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect back to cart, not products
    await expect(page).toHaveURL(/\/cart/);
  });
});