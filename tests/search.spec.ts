import { test, expect, selectors } from './fixtures';

test.describe('Search', () => {
  test('searching and clicking a result navigates to that page', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('local demo');

    const firstResult = page.locator(selectors.searchResult).first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });

    // Grab the href before clicking so we can verify navigation
    const href = await firstResult.locator('a').first().getAttribute('href');
    await firstResult.locator('a').first().click();

    await expect(page).toHaveURL(href!);
    await expect(page.locator(selectors.searchDialog)).not.toBeVisible();
  });

  test('filtering to CLI only shows results linking to /cli/ pages', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('getting started');
    await expect(page.locator(selectors.searchResult).first()).toBeVisible({ timeout: 10_000 });

    // Click CLI filter
    await page.locator(selectors.filterButton).filter({ hasText: 'CLI' }).click();

    // Wait for auto-loading to finish — spinner disappears and results stabilize
    await expect(page.locator('.search-loading')).not.toHaveClass(/visible/, { timeout: 15_000 });

    // Only visible results should link to /cli/ pages
    const visibleResults = page.locator(`${selectors.searchResult}:visible a.pagefind-ui__result-link`);
    const count = await visibleResults.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(visibleResults.nth(i)).toHaveAttribute('href', /^\/cli\//);
    }
  });

  test('filtering to Core only shows results linking to /core/ pages', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('overview');
    await expect(page.locator(selectors.searchResult).first()).toBeVisible({ timeout: 10_000 });

    // Click Core filter
    await page.locator(selectors.filterButton).filter({ hasText: 'Core' }).click();

    // Wait for auto-loading to finish
    await expect(page.locator('.search-loading')).not.toHaveClass(/visible/, { timeout: 15_000 });

    // Only visible results should link to /core/ pages
    const visibleResults = page.locator(`${selectors.searchResult}:visible a.pagefind-ui__result-link`);
    const count = await visibleResults.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(visibleResults.nth(i)).toHaveAttribute('href', /^\/core\//);
    }
  });

  test('Escape dismisses search and returns user to the page they were on', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('deploy');
    await expect(page.locator(selectors.searchResult).first()).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await expect(page.locator(selectors.searchDialog)).not.toBeVisible();
    await expect(page).toHaveURL('/core/');
  });
});
