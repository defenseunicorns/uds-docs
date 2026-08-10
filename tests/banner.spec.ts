import { test, expect } from './fixtures';

test.describe('Latest Release Banner', () => {
  test('keeps the current page path when the latest release contains it', async ({ page }) => {
    await page.goto('/core/v1-8/concepts/core-features/networking/');

    await expect(page.locator('.sl-banner a')).toHaveAttribute(
      'href',
      '/core/concepts/core-features/networking/',
    );
  });

  test('keeps the current page path when navigating from MAIN', async ({ page }) => {
    await page.goto('/core/main/concepts/core-features/networking/');

    await expect(page.locator('.sl-banner a')).toHaveAttribute(
      'href',
      '/core/concepts/core-features/networking/',
    );
  });
});
