// tests/helpers/auth.ts
import { Page, expect } from '@playwright/test';

// Export test user helper
export const TEST_USER = {
  name: `Test User ${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  password: 'Password123!'
};

// Get random user (from Person 4's version - kept for compatibility)
export function getRandomUser() {
  const timestamp = Date.now();
  return {
    name: `TestUser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Password123!'
  };
}

// Sign Up - Merged version (robust selectors from Person 4 + flexibility from Person 1)
export async function signUp(page: Page, name?: string, email?: string, password?: string) {
  const timestamp = Date.now();
  const user = {
    name: name || `Test User ${timestamp}`,
    email: email || `test${timestamp}@example.com`,
    password: password || 'Password123!'
  };
  
  await page.goto('/signup');
  
  // Try multiple possible field names (from Person 4's robust approach)
  const nameInput = page.locator('input[name="name"], input#name, input[placeholder*="name"], input[aria-label*="Name"]').first();
  await nameInput.fill(user.name);
  
  const emailInput = page.locator('input[type="email"], input[name="email"], input[aria-label*="Email"]').first();
  await emailInput.fill(user.email);
  
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(user.password);
  
  // Some sites don't have confirm password - try both (from Person 4)
  const confirmInput = page.locator('input[name="confirmPassword"], input#confirmPassword, input[placeholder*="confirm"], input[aria-label*="Confirm"]');
  if (await confirmInput.count() > 0) {
    await confirmInput.fill(user.password);
  }
  
  // Find and click submit button (from Person 4)
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")').first();
  await submitBtn.click();
  
  // Wait for redirect to products page (from Person 4, with timeout)
  await page.waitForURL(/\/products/, { timeout: 10000 });
  
  return user;
}

// Sign In - Merged version (robust selectors from Person 4 + Person 1's clean approach)
export async function signIn(page: Page, email?: string, password?: string) {
  await page.goto('/signin');
  
  // Use robust selectors (from Person 4)
  const emailInput = page.locator('input[type="email"], input[name="email"], input[aria-label*="Email"]').first();
  await emailInput.fill(email || TEST_USER.email);
  
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password || TEST_USER.password);
  
  // Use role-based selector when possible (from Person 1)
  const signInButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
  await signInButton.click();
  
  await expect(page).toHaveURL(/\/products/);
}

// Helper to click account menu (from Person 1 - kept as is)
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

// Sign Out (from Person 1)
export async function signOut(page: Page) {
  await clickAccountMenu(page);
  await page.getByRole('menuitem', { name: /sign out|logout/i }).click();
  await expect(page).toHaveURL('/signin');
}

// Ensure logged out (from Person 1)
export async function ensureLoggedOut(page: Page) {
  await page.goto('/products');
  if (!page.url().includes('/signin')) {
    await page.goto('/');
    try {
      await clickAccountMenu(page);
      await page.getByRole('menuitem', { name: /sign out/i }).click();
    } catch (e) {
      // Already logged out or no account menu available
    }
  }
}