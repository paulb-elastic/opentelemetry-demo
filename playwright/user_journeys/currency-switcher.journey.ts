/**
 * Currency Switcher Journey
 *
 * Simulates a user changing currency on the home page and browsing products
 * with different currencies active. Each currency change triggers an XHR to
 * re-fetch product prices, generating network spans in Embrace.io RUM.
 */

import { test, expect } from '@playwright/test';

const CURRENCIES = ['EUR', 'JPY', 'GBP', 'CAD', 'USD'];

test('switch through all available currencies on home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-cy="home-page"]')).toBeVisible();

  const switcher = page.locator('[data-cy="currency-switcher"]');
  await expect(switcher).toBeVisible();

  for (const currency of CURRENCIES) {
    await switcher.selectOption(currency);

    // Wait for product list to re-render with new currency prices
    await expect(switcher).toHaveValue(currency);
    await expect(page.locator('[data-cy="product-list"]')).toBeVisible();

    // Short pause so the Embrace SDK captures the interaction event
    await page.waitForTimeout(1_500);
  }
});

test('browse a product with EUR currency active', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-cy="home-page"]')).toBeVisible();

  await page.locator('[data-cy="currency-switcher"]').selectOption('EUR');
  await page.waitForTimeout(500);

  // Click the first product card and verify the detail page loads with EUR prices
  await page.locator('[data-cy="product-card"]').first().click();
  await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
  // Scope to the detail section — product-price also appears on recommendation cards
  await expect(page.locator('[data-cy="product-detail"] [data-cy="product-price"]').first()).toBeVisible();

  await page.waitForTimeout(1_000);
});

test('browse a product with JPY currency active', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-cy="home-page"]')).toBeVisible();

  await page.locator('[data-cy="currency-switcher"]').selectOption('JPY');
  await page.waitForTimeout(500);

  await page.locator('[data-cy="product-card"]').last().click();
  await expect(page.locator('[data-cy="product-detail"]')).toBeVisible();
  await expect(page.locator('[data-cy="product-detail"] [data-cy="product-price"]').first()).toBeVisible();

  await page.waitForTimeout(1_000);
});
