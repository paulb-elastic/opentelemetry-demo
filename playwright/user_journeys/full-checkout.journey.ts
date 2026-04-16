/**
 * Full Checkout Journey
 *
 * Simulates a complete purchase: browse → add two different products to cart
 * → view cart → place order → land on the order confirmation page.
 *
 * This is the highest-value journey for Embrace.io RUM: it traverses every
 * major page (/  →  /product/:id  →  /cart  →  /cart/checkout/:orderId) and
 * fires XHR calls to /api/cart (POST + GET) and /api/checkout (POST).
 */

import { test, expect } from '@playwright/test';

// Pairs of products to use across different test runs so sessions vary
const PRODUCT_PAIRS: [string, string][] = [
  ['0PUK6V6EV0', '1YMWWN1N4O'],
  ['2ZYFJ3GM2N', '66VCHSJNUP'],
  ['6E92ZMYYFZ', '9SIQT8TOJO'],
  ['L9ECAV7KIM', 'LS4PSXUNUM'],
  ['OLJCESPC7Z', 'HQTGWGPNH4'],
];

for (const [productA, productB] of PRODUCT_PAIRS) {
  test(`checkout with products ${productA} and ${productB}`, async ({ page }) => {
    // — Add first product (via home page click, matching the Cypress pattern that keeps cart
    //   context alive between adds) —
    await page.goto('/');
    await expect(page.locator('[data-cy="product-list"]')).toBeVisible();
    await page.goto(`/product/${productA}`);
    await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();

    const firstAddResponse = page.waitForResponse(
      res => res.url().includes('/api/cart') && res.request().method() === 'POST',
      { timeout: 15_000 }
    );
    await page.locator('[data-cy="product-add-to-cart"]').click();
    await firstAddResponse;
    await page.waitForURL('**/cart', { timeout: 15_000 });
    await expect(page.locator('[data-cy="cart-item-count"]')).toBeVisible();

    // — Return to home page between adds so the React cart context re-hydrates —
    await page.goto('/');
    await expect(page.locator('[data-cy="product-list"]')).toBeVisible();

    // — Add second product —
    await page.goto(`/product/${productB}`);
    await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();

    const secondAddResponse = page.waitForResponse(
      res => res.url().includes('/api/cart') && res.request().method() === 'POST',
      { timeout: 15_000 }
    );
    await page.locator('[data-cy="product-add-to-cart"]').click();
    await secondAddResponse;
    await page.waitForURL('**/cart', { timeout: 15_000 });
    await expect(page.locator('[data-cy="cart-item-count"]')).toBeVisible();

    // — Navigate to cart and place order —
    await page.goto('/cart');
    await expect(page.locator('[data-cy="checkout-place-order"]')).toBeVisible();

    const checkoutResponse = page.waitForResponse(
      res => res.url().includes('/api/checkout') && res.request().method() === 'POST',
      { timeout: 20_000 }
    );
    await page.locator('[data-cy="checkout-place-order"]').click();
    await checkoutResponse;

    // — Confirm order —
    // The confirmation page passes order data entirely via the `?order=` query param,
    // so there's no async fetch — just wait for the URL and then verify the page title.
    await page.waitForURL('**/cart/checkout/**', { timeout: 20_000 });
    await expect(page.locator('text=Your order is complete!')).toBeVisible({ timeout: 10_000 });

    // Linger on confirmation so Embrace captures the session end
    await page.waitForTimeout(2_000);
  });
}
