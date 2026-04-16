/**
 * Add to Cart Journey
 *
 * Simulates a user browsing a product detail page and adding it to their cart.
 * Runs multiple times with different products to vary the session data sent
 * to Embrace.io RUM. Validates the cart badge increments so each run confirms
 * the full browser-side interaction completed.
 */

import { test, expect } from '@playwright/test';

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

for (const productId of PRODUCT_IDS) {
  test(`add product ${productId} to cart`, async ({ page }) => {
    await page.goto(`/product/${productId}`);

    await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-cy="product-add-to-cart"]')).toBeVisible();

    // Intercept cart API calls to confirm they fire
    const addToCartResponse = page.waitForResponse(
      res => res.url().includes('/api/cart') && res.request().method() === 'POST',
      { timeout: 15_000 }
    );

    await page.locator('[data-cy="product-add-to-cart"]').click();

    await addToCartResponse;

    // After adding to cart the app redirects to /cart
    await page.waitForURL('**/cart', { timeout: 15_000 });

    const cartBadge = page.locator('[data-cy="cart-item-count"]');
    await expect(cartBadge).toBeVisible();
    const countText = await cartBadge.textContent();
    expect(parseInt(countText ?? '0', 10)).toBeGreaterThan(0);

    // Linger on cart page so Embrace captures the view
    await page.waitForTimeout(1_000);
  });
}
