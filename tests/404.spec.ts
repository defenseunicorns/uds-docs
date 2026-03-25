import { test, expect, selectors } from './fixtures';

test.describe('404 Pages', () => {
  test('nonexistent Core page shows 404 with home link to /core/ and Core sidebar', async ({ page }) => {
    await page.goto('/core/this-page-does-not-exist/', { waitUntil: 'networkidle' });

    // Home link should point to Core root
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/core/');

    // Sidebar should have swapped to Core's navigation
    await expect(page.locator(selectors.productDropdownButton)).toContainText('Core');

    // Clicking the home link navigates back to Core docs
    await homeLink.click();
    await expect(page).toHaveURL('/core/');
  });

  test('nonexistent CLI page shows 404 with home link to /cli/ and CLI sidebar', async ({ page }) => {
    await page.goto('/cli/this-page-does-not-exist/', { waitUntil: 'networkidle' });

    // Home link should point to CLI root
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/cli/');

    // Sidebar should have swapped to CLI's navigation
    await expect(page.locator(selectors.productDropdownButton)).toContainText('CLI');

    // Clicking the home link navigates back to CLI docs
    await homeLink.click();
    await expect(page).toHaveURL('/cli/');
  });
});
