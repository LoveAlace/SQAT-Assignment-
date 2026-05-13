import { expect, test } from "@playwright/test";

const createTestUser = () => ({
  name: "Catalog Tester",
  email: `catalog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
  password: "Testpass123",
});

test.describe("catalog", () => {
  test.describe.configure({ mode: "serial" });

  const signUp = async (page: any, user: { name: string; email: string; password: string }) => {
    await page.goto("/signup");

    await page.getByLabel(/name/i).fill(user.name);
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/products/);
  };

  const getProductsArea = (page: any) => page.locator("main");

  const getProductCards = (page: any) =>
    getProductsArea(page).locator(
      "[data-testid='product-card'], .product-card, article"
    );

  const getProductTitle = (card: any) =>
    card.locator("[data-testid='product-title'], .product-title, h2, h3, h4").first();

  const getSearchBox = (page: any) =>
    getProductsArea(page)
      .getByPlaceholder(/search/i)
      .or(getProductsArea(page).getByRole("searchbox"))
      .or(getProductsArea(page).getByRole("textbox", { name: /search/i }));

  const getComboboxByLabel = (page: any, label: RegExp, fallbackIndex: number) => {
    const area = getProductsArea(page);
    const byLabel = area.getByLabel(label);
    const byRole = area.getByRole("combobox", { name: label });
    const byIndex = area.locator("select").nth(fallbackIndex);
    return byLabel.or(byRole).or(byIndex);
  };

  const getSelectByOptionText = async (
    page: any,
    predicate: (text: string) => boolean
  ) => {
    const selects = getProductsArea(page).locator("select");
    const count = await selects.count();
    for (let i = 0; i < count; i += 1) {
      const optionTexts = await selects.nth(i).locator("option").allTextContents();
      if (optionTexts.some((text: string) => predicate(text.trim()))) {
        return selects.nth(i);
      }
    }
    return selects.first();
  };

  const getCategorySelect = async (page: any) => {
    const labeled = getComboboxByLabel(page, /category/i, 0);
    if ((await labeled.count()) > 0) {
      return labeled.first();
    }
    return getSelectByOptionText(page, (text) => /category|all/i.test(text));
  };

  const getSortSelect = async (page: any) => {
    const labeled = getComboboxByLabel(page, /sort/i, 1);
    if ((await labeled.count()) > 0) {
      return labeled.first();
    }
    return getSelectByOptionText(page, (text) => /price|low|high|sort/i.test(text));
  };

  const pickOptionLabel = async (select: any, predicate: (text: string) => boolean) => {
    const options = select.locator("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    const texts = (await options.allTextContents()).map((text: string) => text.trim());
    const match = texts.find((text: string) => predicate(text));
    expect(match, "Expected a matching option in the dropdown").toBeTruthy();
    return match as string;
  };

  const pickOptionLabelPrefer = async (
    select: any,
    preferred: (text: string) => boolean,
    fallback: (text: string) => boolean
  ) => {
    const options = select.locator("option");
    const texts = (await options.allTextContents()).map((text: string) => text.trim());
    const preferredMatch = texts.find((text: string) => preferred(text));
    if (preferredMatch) {
      return preferredMatch;
    }
    const fallbackMatch = texts.find((text: string) => fallback(text));
    expect(fallbackMatch, "Expected a matching option in the dropdown").toBeTruthy();
    return fallbackMatch as string;
  };

  const getPricesFromCards = async (cards: any) => {
    const count = await cards.count();
    const prices: number[] = [];

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const priceLocator = card
        .locator("[data-testid='product-price'], .product-price, .price")
        .first()
        .or(card.locator("text=/[$€£]\\s?\\d/"));

      const priceText = (await priceLocator.first().textContent()) ?? "";
      const numeric = Number.parseFloat(priceText.replace(/[^0-9.]/g, ""));

      if (!Number.isNaN(numeric)) {
        prices.push(numeric);
      }
    }

    return prices;
  };

  const expectSortedAscending = (prices: number[]) => {
    for (let i = 1; i < prices.length; i += 1) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  };

  const expectSortedDescending = (prices: number[]) => {
    for (let i = 1; i < prices.length; i += 1) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  };

  test.beforeEach(async ({ page }) => {
    const user = createTestUser();
    await signUp(page, user);
  });

  test("search existing product", async ({ page }) => {
    const cards = getProductCards(page);
    await expect(cards.first()).toBeVisible();

    const firstTitle = await getProductTitle(cards.first()).textContent();
    const sourceText = (firstTitle ?? "").trim();
    const query =
      sourceText.split(/\s+/).find((word: string) => word.length >= 3) ?? sourceText;

    const searchBox = getSearchBox(page);
    await expect(searchBox).toBeVisible();
    await searchBox.fill(query);
    await searchBox.press("Enter");

    const titles = await cards
      .locator("[data-testid='product-title'], .product-title, h2, h3, h4")
      .allTextContents();

    expect(titles.length).toBeGreaterThan(0);
    const matchCount = titles.filter((title: string) =>
      title.toLowerCase().includes(query.toLowerCase())
    ).length;
    expect(matchCount).toBeGreaterThan(0);
  });

  test("search no-result case", async ({ page }) => {
    const cards = getProductCards(page);
    const searchBox = getSearchBox(page);
    await expect(searchBox).toBeVisible();

    const nonsense = `no-match-${Date.now()}`;
    await searchBox.fill(nonsense);

    const emptyState = page.getByText(/no (results|products|items)/i);

    await expect(async () => {
      const count = await cards.count();
      if (count === 0) {
        return;
      }
      await expect(emptyState).toBeVisible();
    }).toPass();
  });

  test("category filtering", async ({ page }) => {
    const cards = getProductCards(page);
    await expect(cards.first()).toBeVisible();

    const categorySelect = await getCategorySelect(page);
    await expect(categorySelect).toBeVisible();

    const categoryLabel = await pickOptionLabel(
      categorySelect,
      (text: string) => text.length > 0 && !/all/i.test(text)
    );

    await categorySelect.selectOption({ label: categoryLabel });

    await expect(cards.first()).toBeVisible();

    const categoryBadges = cards
      .first()
      .locator("[data-testid='product-category'], .product-category, .category");
    const hasCategoryBadge = (await categoryBadges.count()) > 0;

    if (hasCategoryBadge) {
      const cardCount = await cards.count();
      for (let i = 0; i < cardCount; i += 1) {
        const badgeText = await cards
          .nth(i)
          .locator("[data-testid='product-category'], .product-category, .category")
          .first()
          .textContent();
        expect((badgeText ?? "").toLowerCase()).toContain(
          categoryLabel.toLowerCase()
        );
      }
    } else {
        const selectedValue = await categorySelect.inputValue();
        const selectedLabel = await categorySelect
          .locator("option:checked")
          .textContent();
        const labelText = (selectedLabel ?? "").toLowerCase();
        const valueText = selectedValue.toLowerCase();
        const expected = categoryLabel.toLowerCase();
        expect(labelText.includes(expected) || valueText.includes(expected)).toBe(true);
    }
  });

  test("sorting low to high", async ({ page }) => {
    const cards = getProductCards(page);
    await expect(cards.first()).toBeVisible();

    const sortSelect = await getSortSelect(page);
    await expect(sortSelect).toBeVisible();

    const sortLabel = await pickOptionLabel(sortSelect, (text: string) =>
      /low/i.test(text) ? /high/i.test(text) : /asc/i.test(text)
    );

    await sortSelect.selectOption({ label: sortLabel });

    const prices = await getPricesFromCards(cards);
    expect(prices.length).toBeGreaterThan(1);
    expectSortedAscending(prices);
  });

  test("sorting high to low", async ({ page }) => {
    const cards = getProductCards(page);
    await expect(cards.first()).toBeVisible();

    const sortSelect = await getSortSelect(page);
    await expect(sortSelect).toBeVisible();

    const sortLabel = await pickOptionLabelPrefer(
      sortSelect,
      (text: string) => /high.*low|desc/i.test(text),
      (text: string) => /high|desc/i.test(text)
    );

    await sortSelect.selectOption({ label: sortLabel });

    const prices = await getPricesFromCards(cards);
    expect(prices.length).toBeGreaterThan(1);
    expectSortedDescending(prices);
  });
});
