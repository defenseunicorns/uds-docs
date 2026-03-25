import { test, expect, selectors } from './fixtures';

// Max acceptable time (ms) for navigation to fully complete after a click
const NAV_TIMEOUT = 300;

test.describe('Navigation Performance', () => {
  test('sidebar group click to overview page resolves within budget', async ({ page }) => {
    await page.goto('/core/', { waitUntil: 'networkidle' });

    const summary = page.locator('#starlight__sidebar ul.top-level > li > details > summary').filter({ hasText: 'Getting Started' });

    const start = Date.now();
    await summary.click();
    await page.waitForURL('/core/getting-started/overview/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed, `Sidebar group navigation took ${elapsed}ms (budget: ${NAV_TIMEOUT}ms)`).toBeLessThan(NAV_TIMEOUT);
  });

  test('product dropdown switch resolves within budget', async ({ page }) => {
    await page.goto('/core/', { waitUntil: 'networkidle' });

    await page.locator(selectors.productDropdownButton).click();
    const cliItem = page.locator(`${selectors.productDropdownItem}[href="/cli/"]`);

    const start = Date.now();
    await cliItem.click();
    await page.waitForURL('/cli/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed, `Product switch took ${elapsed}ms (budget: ${NAV_TIMEOUT}ms)`).toBeLessThan(NAV_TIMEOUT);
  });

  test('landing page card click to product docs resolves within budget', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const coreCard = page.locator(`${selectors.cardLink}[href="/core/"]`);

    const start = Date.now();
    await coreCard.click();
    await page.waitForURL('/core/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed, `Landing card navigation took ${elapsed}ms (budget: ${NAV_TIMEOUT}ms)`).toBeLessThan(NAV_TIMEOUT);
  });
});
