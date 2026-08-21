import { test, expect, selectors } from './fixtures';

async function latestCorePrefix(page: import('@playwright/test').Page): Promise<string> {
  const latestText = await page.locator(`${selectors.versionSelect} option[value="latest"]`).textContent();
  const latestMinor = latestText?.match(/\((\d+\.\d+)\)/)?.[1];
  expect(latestMinor).toBeTruthy();
  return `/core/v${latestMinor?.replace('.', '-')}/`;
}

async function archivedCoreSlug(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/core/');
  const option = page.locator(`${selectors.versionSelect} option[value^="v"]`).first();
  const slug = await option.getAttribute('value');
  expect(slug).toBeTruthy();
  return slug as string;
}

test.describe('Latest Release Banner', () => {
  test('keeps the current page path when the latest release contains it', async ({ page }) => {
    const archivedSlug = await archivedCoreSlug(page);
    await page.goto(`/core/${archivedSlug}/concepts/core-features/networking/`);
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
