import { test, expect, selectors } from './fixtures';

test.describe('Page Navigation', () => {
  test('Getting Started sidebar group navigates to its overview page', async ({ page }) => {
    await page.goto('/core/');
    const summary = page.locator('#starlight__sidebar ul.top-level > li > details > summary').filter({ hasText: 'Getting Started' });
    await summary.click();
    await expect(page).toHaveURL(/\/core\/v\d+-\d+\/getting-started\/overview\//);
  });

  test('switching product via dropdown navigates to the other product and updates the dropdown label', async ({ page }) => {
    await page.goto('/core/');
    await expect(page.locator(selectors.productDropdownButton)).toContainText('Core');

    await page.locator(selectors.productDropdownButton).click();
    await page.locator(`${selectors.productDropdownItem}[href="/cli/v0-35/"]`).click();

    await expect(page).toHaveURL(/\/cli\/v\d+-\d+\//);
    await expect(page.locator(selectors.productDropdownButton)).toContainText('CLI');
  });
});
