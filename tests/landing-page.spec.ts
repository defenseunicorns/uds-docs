import { test, expect, selectors } from './fixtures';

test.describe('Landing Page', () => {
  test('Core card navigates to the latest Core release', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${selectors.cardLink}[href="/core/"]`).click();
    await expect(page).toHaveURL(/\/core\/v\d+-\d+\//);
    await expect(page.locator(selectors.sidebar)).toBeVisible();
  });

  test('CLI card navigates to the latest CLI release', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${selectors.cardLink}[href="/cli/"]`).click();
    await expect(page).toHaveURL(/\/cli\/v\d+-\d+\//);
    await expect(page.locator(selectors.sidebar)).toBeVisible();
  });
});
