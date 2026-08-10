import { test, expect, selectors } from './fixtures';

test.describe('404 Pages', () => {
  test('nonexistent Core page shows 404 with home link to the latest release and Core sidebar', async ({ page }) => {
    await page.goto('/core/this-page-does-not-exist/');

    // Wait for the 404 page's JS to fetch and swap in the Core sidebar
    await expect(page.locator(selectors.productDropdownButton)).toContainText('Core');

    // Home link should point to Core root, which redirects to the latest release.
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/core/');

    // Clicking the home link navigates back to Core docs
    await homeLink.click();
    await expect(page).toHaveURL(/\/core\/v\d+-\d+\//);
  });

  test('nonexistent CLI page shows 404 with home link to the latest release and CLI sidebar', async ({ page }) => {
    await page.goto('/cli/this-page-does-not-exist/');

    // Wait for the 404 page's JS to fetch and swap in the CLI sidebar
    await expect(page.locator(selectors.productDropdownButton)).toContainText('CLI');

    // Home link should point to CLI root
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/cli/');

    // Clicking the home link navigates back to CLI docs
    await homeLink.click();
    await expect(page).toHaveURL(/\/cli\/v\d+-\d+\//);
  });
});
