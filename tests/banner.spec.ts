import { test, expect, selectors } from './fixtures';

async function latestCorePrefix(page: import('@playwright/test').Page): Promise<string> {
  const latestText = await page.locator(`${selectors.versionSelect} option[value="latest"]`).textContent();
  const latestMinor = latestText?.match(/\((\d+\.\d+)\)/)?.[1];
  expect(latestMinor).toBeTruthy();
  return `/core/v${latestMinor?.replace('.', '-')}/`;
}

test.describe('Latest Release Banner', () => {
  test('keeps the current page path when the latest release contains it', async ({ page }) => {
    await page.goto('/core/v1-8/concepts/core-features/networking/');
    const latestPrefix = await latestCorePrefix(page);

    await expect(page.locator('.sl-banner a')).toHaveAttribute(
      'href',
      `${latestPrefix}concepts/core-features/networking/`,
    );
  });

  test('keeps the current page path when navigating from the configured channel', async ({ page }) => {
    await page.goto('/core/main/concepts/core-features/networking/');
    const latestPrefix = await latestCorePrefix(page);

    await expect(page.locator('.sl-banner a')).toHaveAttribute(
      'href',
      `${latestPrefix}concepts/core-features/networking/`,
    );
  });
});
