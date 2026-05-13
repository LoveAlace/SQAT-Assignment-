import { expect, test } from "@playwright/test";

const testUser = {
  name: "E2E Student",
  email: `e2e_${Date.now()}@example.com`,
  password: "Testpass123",
};

test.describe.configure({ mode: "serial" });

test("signup redirects to products", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("Name").fill(testUser.name);
  await page.getByLabel("Email").fill(testUser.email);
  await page.getByLabel("Password").fill(testUser.password);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/products/);
});

test("login redirects to products", async ({ page }) => {
  await page.goto("/signin");

  await page.getByLabel("Email").fill(testUser.email);
  await page.getByLabel("Password").fill(testUser.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/products/);
});

test("auth navbar brand redirects to landing page", async ({ page }) => {
  await page.goto("/signin");

  await page.getByRole("link", { name: "Sample E-commerce" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Everything you need/i })).toBeVisible();
});
