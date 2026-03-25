import { test, expect, selectors } from './fixtures';

test.describe('Landing Page', () => {
  test('Core card navigates to /core/', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${selectors.cardLink}[href="/core/"]`).click();
    await expect(page).toHaveURL('/core/');
    await expect(page.locator(selectors.sidebar)).toBeVisible();
  });

  test('CLI card navigates to /cli/', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${selectors.cardLink}[href="/cli/"]`).click();
    await expect(page).toHaveURL('/cli/');
    await expect(page.locator(selectors.sidebar)).toBeVisible();
  });
});
