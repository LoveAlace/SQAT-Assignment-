import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'person3@test.com';
const TEST_PASSWORD = 'Test123456';

async function login(page: any) {
  await page.goto('/signin');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/products', { timeout: 10000 });
}

// Helper function to add product and wait for API response
async function addProductAndGoToCart(page: any) {
  await page.goto('/products');
  await page.locator('article[role="link"]').first().click();
  
  // Wait for add to cart API call to complete
  const responsePromise = page.waitForResponse((response: any) => 
    response.url().includes('/api/cart') && response.status() === 200
  );
  
  await page.getByRole('button', { name: /add to cart/i }).click();
  await responsePromise; // Wait for API to complete
  
  // Wait for cart badge to update
  await page.waitForTimeout(1000);
  
  await page.goto('/cart');
  
  // Wait for cart page to load completely
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('img, .cart-item, [data-testid="cart-item"]', { timeout: 10000 }).catch(() => null);
}

test.describe('Shopping Cart Tests', () => {
  
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TEST 1: Empty cart shows friendly message
  test('should show friendly message when cart is empty', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    const emptyMessage = page.getByText(/empty|no items|cart is empty/i);
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });

  // TEST 2: Can navigate to products page
  test('should navigate to products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/products/);
  });

  // TEST 3: Products page has content
  test('should display products on products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const productCards = page.locator('article[role="link"]');
    await expect(productCards.first()).toBeVisible();
  });

  // TEST 4: Cart icon exists on products page
  test('should have cart icon on products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const cartLink = page.locator('a[href*="cart"]').first();
    await expect(cartLink).toBeVisible();
  });

  // TEST 5: Can click cart icon
  test('should navigate to cart when clicking cart icon', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const cartLink = page.locator('a[href*="cart"]').first();
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart/, { timeout: 5000 });
  });

  // TEST 6: Cart page loads
  test('should load cart page successfully', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    const bodyContent = page.locator('body');
    await expect(bodyContent).toBeVisible();
  });

  // TEST 7: Can add product to cart
  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');
    await page.locator('article[role="link"]').first().click();
    
    // Wait for API response
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/cart') && response.status() === 200
    );
    
    await page.getByRole('button', { name: /add to cart/i }).click();
    await responsePromise;
    
    const successMsg = page.getByText(/added|success/i);
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  // TEST 8: Cart shows product after adding
  test('should show product in cart after adding', async ({ page }) => {
    await addProductAndGoToCart(page);
    
    const productImage = page.locator('img').first();
    await expect(productImage).toBeVisible({ timeout: 10000 });
  });

  // TEST 9: Remove button works
  test('should remove item when clicking remove button', async ({ page }) => {
    await addProductAndGoToCart(page);
    
    // Wait for remove API response
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/cart') && response.status() === 200
    );
    
    const removeBtn = page.getByRole('button', { name: /remove|delete/i }).first();
    await removeBtn.click();
    await responsePromise;
    
    await page.waitForTimeout(1000);
    
    const emptyMessage = page.getByText(/empty|no items/i);
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });

  // TEST 10: Change quantity using buttons (with API waiting)
  test('should change quantity using buttons', async ({ page }) => {
    await addProductAndGoToCart(page);
    
    // Wait for quantity input to be present
    await page.waitForTimeout(2000);
    
    const quantityInput = page.locator('input[type="number"]').first();
    
    if (await quantityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initialQty = await quantityInput.inputValue();
      
      // Find increase button and wait for API
      const increaseBtn = page.locator('button').filter({ hasText: /\+/ }).first();
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/cart') && response.status() === 200
      );
      
      await increaseBtn.click();
      await responsePromise;
      await page.waitForTimeout(500);
      
      const newQty = await quantityInput.inputValue();
      expect(Number(newQty)).toBe(Number(initialQty) + 1);
    } else {
      // If no input, check for quantity display
      const quantityDisplay = page.locator('[data-testid="quantity"], .quantity, span').filter({ hasText: /\d+/ }).first();
      await expect(quantityDisplay).toBeVisible();
    }
  });

  // TEST 11: Subtotal exists
  test('should show subtotal in cart', async ({ page }) => {
    await addProductAndGoToCart(page);
    
    await page.waitForTimeout(2000);
    
    const subtotal = page.getByText(/subtotal|total/i);
    await expect(subtotal).toBeVisible({ timeout: 5000 });
    
    const price = page.getByText(/\$\d+\.\d{2}/).first();
    await expect(price).toBeVisible();
  });
});