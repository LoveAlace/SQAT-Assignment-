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
// // tests/helpers/auth.ts
// import { Page } from '@playwright/test';

// export async function signIn(page: Page, email: string, password: string) {
//   await page.goto('/signin');
//   await page.fill('input[type="email"], input[name="email"]', email);
//   await page.fill('input[type="password"]', password);
//   await page.click('button[type="submit"]');
//   // Wait for redirect to products page
//   await page.waitForURL(/\/products/);
// }

// export async function signUp(page: Page, name: string, email: string, password: string) {
//   await page.goto('/signup');
//   await page.fill('input[name="name"]', name);
//   await page.fill('input[type="email"]', email);
//   await page.fill('input[type="password"]', password);
//   await page.fill('input[name="confirmPassword"]', password);
//   await page.click('button[type="submit"]');
//   await page.waitForURL(/\/products/);
// }

// export function getRandomUser() {
//   return {
//     name: `TestUser_${Date.now()}`,
//     email: `test_${Date.now()}@example.com`,
//     password: 'Password123!'
//   };
// }


// tests/helpers/auth.ts
import { Page, expect } from '@playwright/test';

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/signin');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/products/);
}

export async function signUp(page: Page, name: string, email: string, password: string) {
  await page.goto('/signup');
  
  // Try multiple possible field names (the website might use different names)
  const nameInput = page.locator('input[name="name"], input#name, input[placeholder*="name"]').first();
  await nameInput.fill(name);
  
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(email);
  
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);
  
  // Some sites don't have confirm password - try both
  const confirmInput = page.locator('input[name="confirmPassword"], input#confirmPassword, input[placeholder*="confirm"]');
  if (await confirmInput.count() > 0) {
    await confirmInput.fill(password);
  }
  
  // Find and click submit button
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register")').first();
  await submitBtn.click();
  
  await page.waitForURL(/\/products/, { timeout: 10000 });
}

export function getRandomUser() {
  const timestamp = Date.now();
  return {
    name: `TestUser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Password123!'
  };
}