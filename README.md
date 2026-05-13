# Playwright E2E Project (Student Guide From Scratch)

This folder is a separate Playwright project used to test the deployed app:

- https://sample-ecommerce-aastu.vercel.app

The goal is to help a student start from zero, run tests successfully, then continue with guided assignments.

## 1. What you need before starting

Install these tools first:

1. Node.js LTS (18+ recommended)
2. npm (comes with Node.js)
3. VS Code (recommended)
4. Git (optional, but recommended)

Check your versions:

```bash
node -v
npm -v
```

## 2. First-time setup (fresh machine)

Run all commands from the repository root.

1. Go to the Playwright project:

```bash
cd e2e-playwright
```

2. Install dependencies:

```bash
npm install
```

3. Install browser binaries for Playwright:

```bash
npx playwright install chromium
```

4. Create local environment file:

```bash
copy .env.example .env
```

5. Confirm target URL in `.env`:

```env
BASE_URL=https://sample-ecommerce-aastu.vercel.app
```

## 3. Verify setup works

Run the baseline tests:

```bash
npm test
```

Expected result: all baseline tests pass.

Run with visible browser (useful for learning):

```bash
npm run test:headed
```

Run with Playwright UI runner:

```bash
npm run test:ui
```

Open HTML report after a run:

```bash
npm run report
```

## 4. Baseline tests already implemented

Main spec file:

- tests/auth-flow.spec.ts

Covered now:

1. Signup redirects to `/products`
2. Login redirects to `/products`
3. Clicking brand on auth page redirects to landing page `/`

## 5. How to write your own tests (student workflow)

For every new feature test:

1. Create a new `.spec.ts` file inside `tests`
2. Start with one happy-path test
3. Add at least one negative or edge case
4. Run only that file first
5. Run full suite after it passes

Example command to run one file:

```bash
npx playwright test tests/catalog.spec.ts
```

## 6. Student assignment (next tasks)

Implement the following test areas as new spec files.

### A. Theme persistence

1. Toggle dark mode on landing page.
2. Reload page and verify dark mode still active.

### B. Language persistence and localization

1. Change locale to DE and verify translated text.
2. Change locale to AR and verify RTL behavior.
3. Reload and verify selected locale persists.

### C. Protected-route redirects

1. As logged-out user, visit `/products` and verify redirect to `/signin`.
2. As logged-out user, visit `/cart` and verify redirect to `/signin`.
3. As logged-out user, visit `/favorites` and verify redirect to `/signin`.

### D. Product catalog behavior

1. Search with a matching term and verify results.
2. Search with a non-matching term and verify empty state.
3. Filter by category and verify only matching items remain.
4. Sort price low-to-high and high-to-low, then verify order.

### E. Favorites flow

1. Add product to favorites from products page.
2. Verify it appears in favorites page.
3. Remove it and verify updated/empty state.

### F. Cart flow

1. Add product to cart from products page.
2. Increase and decrease quantity in cart.
3. Remove product and verify cart badge/count updates.

### G. Product detail flow

1. Open product detail from product card.
2. Add to cart from detail page.
3. Click checkout and verify loading/disabled state.

### H. API assertions with UI flow

1. Intercept `/api/cart` and assert request/response basics.
2. Intercept `/api/favorites` and assert request/response basics.
3. Intercept `/api/checkout` and assert request payload shape.

## 7. Deliverables for student submission

Submit all of the following:

1. At least 3 new spec files:
	- `tests/catalog.spec.ts`
	- `tests/cart.spec.ts`
	- `tests/favorites.spec.ts`
2. Reusable auth helper (signup/signin utility) to reduce duplication.
3. Clean test naming and readable assertions.
4. Final report artifacts and summary:
	- `playwright-report`
	- short write-up of failures, root causes, and fixes.

## 8. Troubleshooting quick fixes

### Problem: "No tests found"

Check that files end with `.spec.ts` and are inside `tests`.

### Problem: Browser not installed

Run:

```bash
npx playwright install chromium
```

### Problem: Base URL not loaded

Make sure `.env` exists and contains:

```env
BASE_URL=https://sample-ecommerce-aastu.vercel.app
```

### Problem: Flaky selector

Prefer role/label selectors over CSS selectors:

- `getByRole(...)`
- `getByLabel(...)`
- `getByText(...)`
