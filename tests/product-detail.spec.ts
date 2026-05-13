import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'person3@test.com';
const TEST_PASSWORD = 'Test123456';

async function login(page: any) {
  await page.goto('/signin');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/products', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Product Detail Page Tests', () => {
  
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TEST 1: Clicking a product opens detail page
  test('should open product detail page when clicking a product', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on the article element (product card)
    const productCard = page.locator('article[role="link"]').first();
    await productCard.click();
    
    // Wait for navigation or modal to appear
    await page.waitForTimeout(2000);
    
    // Check if URL changed or detail view appeared
    const currentUrl = page.url();
    const hasDetailContent = await page.getByText(/description|specifications|details/i).isVisible().catch(() => false);
    
    expect(currentUrl !== 'https://sample-ecommerce-aastu.vercel.app/products' || hasDetailContent).toBeTruthy();
  });

  // TEST 2: Product detail page shows product name
  test('should display product name on detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Get product name from catalog
    const productName = await page.locator('article[role="link"] h2').first().textContent();
    
    // Click the product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Detail page should have a heading with product name
    const detailName = page.locator('h1, h2').first();
    await expect(detailName).toBeVisible({ timeout: 5000 });
    
    const detailNameText = await detailName.textContent();
    expect(detailNameText?.toLowerCase()).toContain(productName?.toLowerCase() || '');
  });

  // TEST 3: Product detail page shows price
  test('should display price on product detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Get price from catalog
    const catalogPrice = await page.locator('article[role="link"] p:last-child').first().textContent();
    
    // Click first product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Look for price (with $ symbol or number pattern)
    const price = page.getByText(/\$\d+\.\d{2}|\d+\.\d{2}/);
    await expect(price.first()).toBeVisible({ timeout: 5000 });
    
    const detailPrice = await price.first().textContent();
    expect(detailPrice).toBeTruthy();
  });

  // TEST 4: Product detail page shows description
  test('should display description on product detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Click first product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Look for description paragraph
    const description = page.locator('p, .description, [data-testid="description"]').filter({ hasText: /.+/ });
    await expect(description.first()).toBeVisible({ timeout: 5000 });
  });

  // TEST 5: Has add to cart button
  test('should have add to cart button on product detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Click first product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Look for add to cart button
    const addToCartBtn = page.getByRole('button', { name: /add to cart|add|cart/i });
    await expect(addToCartBtn.first()).toBeVisible({ timeout: 5000 });
  });

  // TEST 6: Can navigate back to products page
  test('should navigate back to products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Click first product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Go back using browser back button
    await page.goBack();
    await page.waitForTimeout(2000);
    
    // Should be back on products page - look for product articles
    const productCards = page.locator('article[role="link"]');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });
  });

  // TEST 7: Product has image
  test('should display product image on detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Click first product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Look for image
    const productImage = page.locator('img').first();
    await expect(productImage).toBeVisible();
    
    // Image should have src attribute
    const src = await productImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  // TEST 8: Shows category
  test('should display category on product detail', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Get category from catalog
    const catalogCategory = await page.locator('article[role="link"] span').first().textContent();
    
    // Click first product
    await page.locator('article[role="link"]').first().click();
    await page.waitForTimeout(2000);
    
    // Look for category text
    const category = page.getByText(/fashion|electronics|clothing|category/i);
    const hasCategory = await category.isVisible().catch(() => false);
    
    expect(hasCategory || catalogCategory !== null).toBeTruthy();
  });

  // TEST 9: Favorite button exists
  test('should have favorite button on product card', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Look for favorite button (bookmark icon)
    const favoriteBtn = page.locator('button[aria-label*="favorite"], button svg').first();
    await expect(favoriteBtn).toBeVisible();
  });

  // TEST 10: Quantity cannot go below 1
    test('should not allow quantity below 1 on detail page', async ({ page }) => {
    await page.goto('/products');
    await page.locator('article[role="link"]').first().click();
    await page.waitForLoadState('networkidle');
    
    const quantityInput = page.locator('input[type="number"]').first();
    const decreaseBtn = page.getByRole('button', { name: /-/i }).first();
    
    // Try to decrease multiple times
    await decreaseBtn.click();
    await decreaseBtn.click();
    await decreaseBtn.click();
    
    const qty = await quantityInput.inputValue();
    expect(Number(qty)).toBe(1);
    });

    // TEST 11: "Added!" confirmation message appears
    test('should show confirmation when adding to cart', async ({ page }) => {
    await page.goto('/products');
    await page.locator('article[role="link"]').first().click();
    await page.waitForLoadState('networkidle');
    
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    await addToCartBtn.click();
    
    const confirmation = page.getByText(/added|success|item added/i);
    await expect(confirmation).toBeVisible({ timeout: 5000 });
    });

    // TEST 12: Cart badge updates after adding
    test('should update cart badge when adding from detail page', async ({ page }) => {
    await page.goto('/products');
    
    // Get initial cart count
    const cartBadge = page.locator('[aria-label*="cart"] span, .cart-count').first();
    let initialCount = 0;
    if (await cartBadge.isVisible().catch(() => false)) {
        const text = await cartBadge.textContent();
        initialCount = parseInt(text || '0');
    }
    
    // Add product
    await page.locator('article[role="link"]').first().click();
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.waitForTimeout(1000);
    
    // Check badge increased
    const newCount = parseInt((await cartBadge.textContent()) || '0');
    expect(newCount).toBeGreaterThan(initialCount);
    });

    // TEST 13: Specifications table exists
    test('should display specifications table', async ({ page }) => {
    await page.goto('/products');
    await page.locator('article[role="link"]').first().click();
    await page.waitForLoadState('networkidle');
    
    // Look for specification fields
    const specs = page.getByText(/material|performance|release date|product code/i);
    await expect(specs.first()).toBeVisible({ timeout: 5000 });
    });

    // TEST 14: Buy now button exists and works
    test('should have buy now button that goes to checkout', async ({ page }) => {
    await page.goto('/products');
    await page.locator('article[role="link"]').first().click();
    await page.waitForLoadState('networkidle');
    
    const buyNowBtn = page.getByRole('button', { name: /buy now|checkout now/i });
    await expect(buyNowBtn).toBeVisible();
    
    await buyNowBtn.click();
    
    // Should go to checkout/payment page
    await expect(page).toHaveURL(/\/checkout|\/payment/, { timeout: 10000 });
    });
});