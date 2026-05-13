// debug-visit.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://sample-ecommerce-aastu.vercel.app/');
  
  console.log('=== Looking for elements ===\n');
  
  // Check for language selector
  const hasSelect = await page.locator('select').count();
  const hasLangButton = await page.locator('button:has-text("EN"), button:has-text("English")').count();
  console.log(`Language select exists: ${hasSelect > 0}`);
  console.log(`Language button exists: ${hasLangButton > 0}`);
  
  // Check for theme toggle
  const hasThemeButton = await page.locator('button:has(svg)').count();
  console.log(`Theme buttons (with SVG): ${hasThemeButton}`);
  
  // Get all buttons text
  const buttons = await page.locator('button').allTextContents();
  console.log(`\nAll buttons on page:`, buttons.slice(0, 10));
  
  // Get all classes on body
  const bodyClasses = await page.locator('body').getAttribute('class');
  console.log(`\nBody classes: ${bodyClasses}`);
  
  // Wait 5 seconds so you can see the page
  await page.waitForTimeout(5000);
  
  await browser.close();
})();