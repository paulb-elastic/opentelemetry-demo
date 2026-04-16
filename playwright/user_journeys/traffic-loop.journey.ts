/**
 * Traffic Loop Journey
 *
 * Generates sustained, randomized browser traffic against the OTel demo
 * storefront. Each iteration picks a random flow and random products so every
 * Playwright worker produces a unique session in Embrace.io RUM.
 *
 * Control via environment variables:
 *   LOOP_COUNT   Number of loop iterations per worker (default: 5)
 *   WORKERS      Set in playwright.config.ts (default: 2)
 *   REPEAT       Set in playwright.config.ts to repeat this file N times
 *
 * Example — 10 minutes of heavy traffic:
 *   LOOP_COUNT=20 WORKERS=4 REPEAT=3 npx playwright test user_journeys/traffic-loop.journey.ts
 */

import { test, expect, Page } from '@playwright/test';

const PRODUCT_IDS = [
  '0PUK6V6EV0',
  '1YMWWN1N4O',
  '2ZYFJ3GM2N',
  '66VCHSJNUP',
  '6E92ZMYYFZ',
  '9SIQT8TOJO',
  'L9ECAV7KIM',
  'LS4PSXUNUM',
  'OLJCESPC7Z',
  'HQTGWGPNH4',
];

const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CAD'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPair<T>(arr: T[]): [T, T] {
  const first = Math.floor(Math.random() * arr.length);
  let second = Math.floor(Math.random() * arr.length);
  while (second === first) second = Math.floor(Math.random() * arr.length);
  return [arr[first], arr[second]];
}

async function wait(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// — Individual flows —

async function flowBrowse(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-cy="home-page"]')).toBeVisible();

  const count = 2 + Math.floor(Math.random() * 3); // browse 2–4 products
  for (let i = 0; i < count; i++) {
    const productId = randomItem(PRODUCT_IDS);
    await page.goto(`/product/${productId}`);
    await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
    await wait(800 + Math.random() * 1_200);
  }
}

async function flowAddToCart(page: Page) {
  const productId = randomItem(PRODUCT_IDS);
  await page.goto(`/product/${productId}`);
  await expect(page.locator('[data-cy="product-add-to-cart"]')).toBeVisible();

  const addResponse = page.waitForResponse(
    res => res.url().includes('/api/cart') && res.request().method() === 'POST',
    { timeout: 15_000 }
  );
  await page.locator('[data-cy="product-add-to-cart"]').click();
  await addResponse;
  await page.waitForURL('**/cart', { timeout: 15_000 });
  await wait(800);
}

async function flowCheckout(page: Page) {
  const [productA, productB] = randomPair(PRODUCT_IDS);

  // Add first product
  await page.goto('/');
  await expect(page.locator('[data-cy="product-list"]')).toBeVisible();
  await page.goto(`/product/${productA}`);
  await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
  const add1 = page.waitForResponse(
    res => res.url().includes('/api/cart') && res.request().method() === 'POST',
    { timeout: 15_000 }
  );
  await page.locator('[data-cy="product-add-to-cart"]').click();
  await add1;
  await page.waitForURL('**/cart', { timeout: 15_000 });

  // Return to home so the React cart context re-hydrates before second add
  await page.goto('/');
  await expect(page.locator('[data-cy="product-list"]')).toBeVisible();

  // Add second product
  await page.goto(`/product/${productB}`);
  await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
  const add2 = page.waitForResponse(
    res => res.url().includes('/api/cart') && res.request().method() === 'POST',
    { timeout: 15_000 }
  );
  await page.locator('[data-cy="product-add-to-cart"]').click();
  await add2;
  await page.waitForURL('**/cart', { timeout: 15_000 });

  // Place order
  await page.goto('/cart');
  await expect(page.locator('[data-cy="checkout-place-order"]')).toBeVisible();
  const orderResponse = page.waitForResponse(
    res => res.url().includes('/api/checkout') && res.request().method() === 'POST',
    { timeout: 20_000 }
  );
  await page.locator('[data-cy="checkout-place-order"]').click();
  await orderResponse;
  await page.waitForURL('**/cart/checkout/**', { timeout: 20_000 });
  await expect(page.locator('text=Your order is complete!')).toBeVisible({ timeout: 10_000 });
  await wait(1_500);
}

async function flowCurrency(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-cy="home-page"]')).toBeVisible();

  const switcher = page.locator('[data-cy="currency-switcher"]');
  const currencies = [randomItem(CURRENCIES), randomItem(CURRENCIES)];
  for (const currency of currencies) {
    await switcher.selectOption(currency);
    await wait(1_000 + Math.random() * 1_000);
  }
}

// — Main loop —

const LOOP_COUNT = process.env.LOOP_COUNT ? parseInt(process.env.LOOP_COUNT) : 5;

const FLOWS: Array<{ name: string; fn: (page: Page) => Promise<void> }> = [
  { name: 'browse', fn: flowBrowse },
  { name: 'add-to-cart', fn: flowAddToCart },
  { name: 'checkout', fn: flowCheckout },
  { name: 'currency', fn: flowCurrency },
];

test(`traffic loop — ${LOOP_COUNT} iterations`, async ({ page }) => {
  // Each iteration can take up to ~15s (checkout flow + think-time).
  // Give the test a generous per-loop budget so it never races the default 30s timeout.
  test.setTimeout(LOOP_COUNT * 20_000);

  for (let iteration = 1; iteration <= LOOP_COUNT; iteration++) {
    const flow = randomItem(FLOWS);
    console.log(`[loop] iteration ${iteration}/${LOOP_COUNT} — running flow: ${flow.name}`);

    try {
      await flow.fn(page);
    } catch (err) {
      // Log but don't fail the entire loop on a transient error
      console.warn(`[loop] iteration ${iteration} flow "${flow.name}" encountered an error:`, err);
    }

    // Random pause between iterations (1–3 s) to mimic human think-time
    await wait(1_000 + Math.random() * 2_000);
  }
});
