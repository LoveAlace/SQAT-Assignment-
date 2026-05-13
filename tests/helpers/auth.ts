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