/**
 * Browse Products Journey
 *
 * Simulates a user landing on the home page and clicking through each product
 * card one by one, spending a moment on each product detail page before
 * navigating back. This generates page-view, XHR, and recommendation spans
 * in Embrace.io RUM.
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

test('browse all products from home page', async ({ page }) => {
  // 10 products × ~8s each = ~80s; give the test plenty of headroom
  test.setTimeout(120_000);

  await page.goto('/');
  await expect(page.locator('[data-cy="home-page"]')).toBeVisible();

  const productCards = page.locator('[data-cy="product-card"]');
  await expect(productCards).toHaveCount(10);

  for (let i = 0; i < 10; i++) {
    await page.goto('/');
    await expect(page.locator('[data-cy="product-list"]')).toBeVisible();

    // Set up response watchers BEFORE clicking so we don't miss fast responses
    const recommendationsResponse = page.waitForResponse(
      res => res.url().includes('/api/recommendations'),
      { timeout: 8_000 }
    );
    const reviewsResponse = page.waitForResponse(
      res => res.url().includes('/api/product-reviews'),
      { timeout: 8_000 }
    );

    // Click the i-th product card
    await productCards.nth(i).click();

    // Wait for the product detail page to fully load
    await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-cy="product-name"]')).toBeVisible();
    await expect(page.locator('[data-cy="product-picture"]')).toBeVisible();

    // Await the pre-registered watchers (they resolve quickly since they were set up first)
    await recommendationsResponse.catch(() => {});
    await reviewsResponse.catch(() => {});

    // Pause briefly to let Embrace SDK record the session activity
    await page.waitForTimeout(500);
  }
});

test('browse products via direct URL navigation', async ({ page }) => {
  for (const productId of PRODUCT_IDS) {
    await page.goto(`/product/${productId}`);

    await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-cy="product-name"]')).toBeVisible();
    await expect(page.locator('[data-cy="product-add-to-cart"]')).toBeVisible();

    await page.waitForTimeout(1_000);
  }
});
