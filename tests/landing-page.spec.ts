import { test, expect, selectors } from './fixtures';

test.describe('Landing Page', () => {
  test('Core card navigates to the latest Core release', async ({ page }) => {
    await page.goto('/');
    const card = page.locator(`${selectors.cardLink}[aria-label="UDS Core"]`);
    await expect(card).toHaveAttribute('href', /\/core\/v\d+-\d+\//);
    await expect(card).toHaveAttribute('data-astro-reload', '');
    await card.click();
    await expect(page).toHaveURL(/\/core\/v\d+-\d+\//);
    await expect(page.locator(selectors.sidebar)).toBeVisible();
  });

  test('CLI card navigates to the latest CLI release', async ({ page }) => {
    await page.goto('/');
    const card = page.locator(`${selectors.cardLink}[aria-label="UDS CLI"]`);
    await expect(card).toHaveAttribute('href', /\/cli\/v\d+-\d+\//);
    await expect(card).toHaveAttribute('data-astro-reload', '');
    await card.click();
    await expect(page).toHaveURL(/\/cli\/v\d+-\d+\//);
    await expect(page.locator(selectors.sidebar)).toBeVisible();
  });
});
