import { expect, test } from "@playwright/test";

test.describe("localization", () => {
  const getLocaleControl = (page: any) =>
    page
      .getByLabel(/language|locale/i)
      .or(page.getByRole("combobox", { name: /language|locale/i }));

  const openLocaleMenu = async (page: any) => {
    const localeButton = page
      .getByRole("button", { name: /en|english|language|locale/i })
      .first();
    await expect(localeButton).toBeVisible();
    await localeButton.click();
  };

  const selectLocale = async (page: any, optionMatcher: RegExp, valueHint: RegExp) => {
    const localeControl = getLocaleControl(page);
    if ((await localeControl.count()) > 0) {
      await expect(localeControl.first()).toBeVisible();
      const options = localeControl.first().locator("option");
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);

      const optionTexts = await options.allTextContents();
      const optionValues = await options.evaluateAll((nodes: Element[]) =>
        nodes.map((node: Element) => (node as HTMLOptionElement).value)
      );

      const labelMatch = optionTexts.find((text: string) => optionMatcher.test(text));
      const valueMatch = optionValues.find((value: string) => valueHint.test(value));

      if (valueMatch) {
        await localeControl.selectOption({ value: valueMatch });
      } else if (labelMatch) {
        await localeControl.selectOption({ label: labelMatch });
      } else {
        throw new Error("No matching locale option found");
      }
      return;
    }

    await openLocaleMenu(page);

    const option = page
      .getByRole("menuitem", { name: optionMatcher })
      .or(page.getByRole("option", { name: optionMatcher }))
      .or(page.getByText(optionMatcher));

    await expect(option.first()).toBeVisible();
    await option.first().click();
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  const expectGermanContent = async (page: any) => {
    await expect(page.getByText(/Elektronik|Mode|Wohnen/i).first()).toBeVisible();
  };

  const expectArabicContent = async (page: any) => {
    await expect(page.getByText(/إلكترونيات|موضة|المنزل/).first()).toBeVisible();
  };

  const expectRtlDirection = async (page: any) => {
    const alignmentTarget = page.getByRole("heading", { name: /shop by category/i }).first();

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const htmlDirection = getComputedStyle(document.documentElement).direction;
          const bodyDirection = getComputedStyle(document.body).direction;
          return `${htmlDirection}|${bodyDirection}`;
        });
      })
      .toMatch(/rtl|ltr/);

    const alignment = await alignmentTarget.evaluate((node: Element) => {
      const style = getComputedStyle(node as HTMLElement);
      return style.textAlign;
    });

    const direction = await page.evaluate(() => {
      const htmlDirection = getComputedStyle(document.documentElement).direction;
      const bodyDirection = getComputedStyle(document.body).direction;
      return `${htmlDirection}|${bodyDirection}`;
    });

    expect(
      /rtl/.test(direction) || alignment === "right" || alignment === "end"
    ).toBe(true);
  };

  test("German translation", async ({ page }) => {
    await selectLocale(page, /de|deutsch|german/i, /de/i);
    await expectGermanContent(page);
  });

  test("Arabic translation", async ({ page }) => {
    await selectLocale(page, /ar|arabic|العربية/i, /ar/i);
    await expectArabicContent(page);
  });

  test("RTL verification", async ({ page }) => {
    await selectLocale(page, /ar|arabic|العربية/i, /ar/i);
    await expectRtlDirection(page);
  });

  test("locale persistence after reload", async ({ page }) => {
    await selectLocale(page, /ar|arabic|العربية/i, /ar/i);
    await page.reload();

    await expectArabicContent(page);
    await expectRtlDirection(page);

    const localeControl = getLocaleControl(page);
    if ((await localeControl.count()) > 0) {
      const selectedValue = await localeControl.first().inputValue();
      const selectedLabel = await localeControl
        .first()
        .locator("option:checked")
        .textContent();
      const labelText = (selectedLabel ?? "").toLowerCase();
      expect(labelText.includes("ar") || selectedValue.toLowerCase().includes("ar")).toBe(
        true
      );
    }
  });
});
