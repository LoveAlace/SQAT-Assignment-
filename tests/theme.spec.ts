import { expect, test } from "@playwright/test";

test.describe("theme", () => {
  const getThemeToggle = (page: any) =>
    page
      .getByRole("button", { name: /dark|light|theme/i })
      .or(page.getByLabel(/dark|light|theme/i))
      .first();

  const isDarkMode = async (page: any) => {
    return page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const htmlDark = html.classList.contains("dark") || html.dataset.theme === "dark";
      const bodyDark = body.classList.contains("dark") || body.dataset.theme === "dark";
      return htmlDark || bodyDark;
    });
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("dark mode toggle", async ({ page }) => {
    const toggle = getThemeToggle(page);
    await expect(toggle).toBeVisible();

    await toggle.click();

    await expect.poll(() => isDarkMode(page)).toBeTruthy();
  });

  test("persistence after refresh", async ({ page }) => {
    const toggle = getThemeToggle(page);
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect.poll(() => isDarkMode(page)).toBeTruthy();

    await page.reload();
    await expect.poll(() => isDarkMode(page)).toBeTruthy();
  });
});
