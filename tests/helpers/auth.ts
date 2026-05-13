import { Page, expect } from '@playwright/test';

export const TEST_USER = {
  name: `Test User ${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  password: 'Password123!'
};

export async function signUp(page: Page, name?: string, email?: string, password?: string) {
  const timestamp = Date.now();
  const user = {
    name: name || `Test User ${timestamp}`,
    email: email || `test${timestamp}@example.com`,
    password: password || TEST_USER.password
  };
  
  await page.goto('/signup');
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /create account|sign up/i }).click();
  
  // Wait for redirect to /products
  await expect(page).toHaveURL(/\/products/);
  return user;
}

export async function signIn(page: Page, email?: string, password?: string) {
  await page.goto('/signin');
  await page.getByLabel('Email').fill(email || TEST_USER.email);
  await page.getByLabel('Password').fill(password || TEST_USER.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/\/products/);
}

async function clickAccountMenu(page: Page) {
  const accountButton = page.locator('button', { hasText: /@example\.com$|^Test User|^test\d+/i });
  if (await accountButton.count()) {
    await accountButton.first().click();
    return;
  }
  const buttonByText = page.locator('button:has-text("test")');
  if (await buttonByText.count()) {
    await buttonByText.first().click();
    return;
  }
  const fallbackButton = page.getByRole('button', { name: /account|profile|test\d+/i });
  if (await fallbackButton.count()) {
    await fallbackButton.first().click();
    return;
  }
  await page.click('[aria-label="Account menu"], [data-testid="account-menu"]');
}

export async function signOut(page: Page) {
  await clickAccountMenu(page);
  await page.getByRole('menuitem', { name: /sign out|logout/i }).click();
  await expect(page).toHaveURL('/signin');
}

export async function ensureLoggedOut(page: Page) {
  await page.goto('/products');
  if (!page.url().includes('/signin')) {
    // If somehow logged in, sign out
    await page.goto('/');
    // Find and click sign out
    try {
      await clickAccountMenu(page);
      await page.getByRole('menuitem', { name: /sign out/i }).click();
    } catch (e) {
      // Already logged out or no account menu available
    }
  }
}