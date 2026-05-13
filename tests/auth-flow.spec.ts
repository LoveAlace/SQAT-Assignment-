import { test, expect } from '@playwright/test';
import { signUp, signIn, signOut, ensureLoggedOut } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('US-1.1: Signup redirects to /products', async ({ page }) => {
    await signUp(page);
    await expect(page).toHaveURL(/\/products/);
  });

  test('US-1.1: Signup shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /create account|sign up/i }).click();
    // Native browser validation should prevent submit and keep the form on signup.
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByLabel('Name')).toBeFocused();
  });

  test('US-1.1: Signup shows error for weak password', async ({ page }) => {
    const now = Date.now();
    await page.goto('/signup');
    await page.getByLabel('Name').fill(`Test User ${now}`);
    await page.getByLabel('Email').fill(`test${now}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByRole('button', { name: /create account|sign up/i }).click();
    await expect(page.getByText(/weak|password must/i)).toBeVisible();
  });

  test('US-1.1: Signup shows error for existing email', async ({ page }) => {
    // First signup creates user
    const user = await signUp(page);
    await signOut(page);
    
    // Try to signup again with same email
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Different Name');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('NewPass123!');
    await page.getByRole('button', { name: /create account|sign up/i }).click();
    
    await expect(page.getByText(/already registered|email exists/i)).toBeVisible();
  });

  test('US-1.2: Signin redirects to /products', async ({ page }) => {
    // Create user first
    const user = await signUp(page);
    await signOut(page);
    
    // Now sign in with the same user
    await signIn(page, user.email, user.password);
    await expect(page).toHaveURL(/\/products/);
  });

  test('US-1.2: Signin shows error for wrong credentials', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('WrongPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page.getByText(/invalid|incorrect|wrong credentials/i)).toBeVisible();
    // Should still be on signin page
    await expect(page).toHaveURL('/signin');
  });

  test('US-1.2: Signin submits while the button remains enabled', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    const button = page.getByRole('button', { name: /sign in|login/i });
    await button.click();
    
    await expect(page).toHaveURL('/signin');
  });

  test('US-1.3: Session persists after browser close (simulated)', async ({ browser, context, page }) => {
    await signUp(page);
    
    // Save storage state
    const storageState = await context.storageState();
    
    // Create new context with same storage
    const newContext = await browser.newContext({ storageState });
    const newPage = await newContext.newPage();
    
    // Should still be logged in
    await newPage.goto('/products');
    await expect(newPage).toHaveURL('/products');
    
    await newContext.close();
  });

  test('US-1.4: Signout redirects to signin', async ({ page }) => {
    await signUp(page);
    await signOut(page);
    await expect(page).toHaveURL('/signin');
  });

  test('US-1.4: Cannot access protected pages after signout', async ({ page }) => {
    await signUp(page);
    await signOut(page);
    
    await page.goto('/products');
    await expect(page).toHaveURL('/signin');
    
    await page.goto('/cart');
    await expect(page).toHaveURL('/signin');
    
    await page.goto('/favorites');
    await expect(page).toHaveURL('/signin');
  });

  test('Signed-in users cannot visit signin/signup', async ({ page }) => {
    await signUp(page);
    
    await page.goto('/signin');
    await expect(page).toHaveURL(/\/products/);
    
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/products/);
  });
});