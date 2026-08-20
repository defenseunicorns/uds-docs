import { test, expect, selectors } from './fixtures';

test.describe('Sidebar', () => {
  test('collapsing an open section hides its child links, re-expanding restores them', async ({ page }) => {
    await page.goto('/core/getting-started/overview/');

    const gettingStarted = page.locator('#starlight__sidebar ul.top-level > li > details').filter({ hasText: 'Getting Started' });
    await expect(gettingStarted).toHaveAttribute('open', '');

    // Collapse — section should close
    await gettingStarted.locator('> summary').click();
    await expect(gettingStarted).not.toHaveAttribute('open', '');

    // Re-expand — section should open again
    await gettingStarted.locator('> summary').click();
    await expect(gettingStarted).toHaveAttribute('open', '');
  });

  test('product dropdown lists both products and navigating via it switches the sidebar context', async ({ page }) => {
    await page.goto('/core/');
    await expect(page.locator(selectors.productDropdownButton)).toContainText('Core');

    await page.locator(selectors.productDropdownButton).click();
    const menu = page.locator(selectors.productDropdownMenu);
    const coreLink = menu.locator(`${selectors.productDropdownItem}[href^="/core/v"]`).first();
    const cliLink = menu.locator(`${selectors.productDropdownItem}[href^="/cli/v"]`).first();
    await expect(coreLink).toBeVisible();
    await expect(cliLink).toBeVisible();
    await expect(menu.locator(selectors.productDropdownItem)).toHaveCount(2);

    // Navigate to CLI and verify sidebar context switched
    await cliLink.click();
    await expect(page).toHaveURL(/\/cli\/v\d+-\d+\//);
    await expect(page.locator(selectors.productDropdownButton)).toContainText('CLI');
  });
});
