import { test, expect, selectors } from './fixtures';

/**
 * Wait for the product filter to finish auto-loading all results.
 * The filter loads all pagefind batches before applying display:none,
 * so we wait until no load-more button remains and the spinner is gone.
 */
async function waitForFilterToSettle(page: import('@playwright/test').Page) {
  // Wait for auto-loading spinner to finish
  await expect(page.locator('.search-loading')).not.toHaveClass(/visible/, { timeout: 15_000 });
  // Wait for load-more button to disappear (all results loaded)
  await expect(page.locator('.pagefind-ui__button')).toHaveCount(0, { timeout: 15_000 });
}

/**
 * Collect hrefs from results not hidden by the product filter (display: none).
 * Playwright's :visible pseudo-selector doesn't reliably catch inline style hiding,
 * so we use page.evaluate to check computed display.
 */
async function getVisibleResultHrefs(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const results = document.querySelectorAll('.pagefind-ui__result');
    const hrefs: string[] = [];
    results.forEach(result => {
      const el = result as HTMLElement;
      if (getComputedStyle(el).display === 'none') return;
      const link = el.querySelector('a.pagefind-ui__result-link');
      if (link) hrefs.push(link.getAttribute('href') || '');
    });
    return hrefs;
  });
}

test.describe('Search', () => {
  test('searching from non-product pages includes product documentation', async ({ page }) => {
    await page.goto('/core/');
    const latestOption = page.locator(`${selectors.versionSelect} option[value="latest"]`);
    await expect(latestOption).toHaveText(/^Latest \(\d+\.\d+\)$/);
    const latestDisplay = await latestOption.textContent();
    const latestMinor = latestDisplay?.match(/\((\d+\.\d+)\)/)?.[1];
    expect(latestMinor).toBeTruthy();
    const latestSlug = `v${latestMinor?.replace('.', '-')}`;

    for (const path of ['/', '/not-a-real-page']) {
      await page.goto(path);
      await page.locator(selectors.searchButton).click();
      await page.locator(selectors.searchInput).fill('local demo');
      const firstResult = page.locator(`${selectors.searchResult}:visible`).first();
      await expect(firstResult).toBeVisible({ timeout: 10_000 });
      await expect(firstResult.locator('a').first()).toHaveAttribute(
        'href',
        new RegExp(`^/core/${latestSlug}/`),
      );
    }
  });

  test('searching and clicking a result navigates to that page', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('local demo');

    const firstResult = page.locator(`${selectors.searchResult}:visible`).first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });

    const href = await firstResult.locator('a').first().getAttribute('href');
    expect(href).toBeTruthy();
    await firstResult.locator('a').first().click();

    await expect(page).toHaveURL(href as string);
    await expect(page.locator(selectors.searchDialog)).not.toBeVisible();
  });

  test('filtering to CLI only shows results linking to /cli/ pages', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('UDS CLI');
    await expect(page.locator(`${selectors.searchResult}:visible`).first()).toBeVisible({ timeout: 10_000 });

    await page.locator(selectors.filterButton).filter({ hasText: 'CLI' }).click();
    await waitForFilterToSettle(page);

    const hrefs = await getVisibleResultHrefs(page);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, `Expected CLI page but got ${href}`).toMatch(/^\/cli\//);
    }
  });

  test('filtering to Core only shows results linking to /core/ pages', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('overview');
    await expect(page.locator(`${selectors.searchResult}:visible`).first()).toBeVisible({ timeout: 10_000 });

    await page.locator(selectors.filterButton).filter({ hasText: 'Core' }).click();
    await waitForFilterToSettle(page);

    const hrefs = await getVisibleResultHrefs(page);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, `Expected Core page but got ${href}`).toMatch(/^\/core\//);
    }
  });

  test('Escape dismisses search and returns user to the page they were on', async ({ page }) => {
    await page.goto('/core/');

    await page.locator(selectors.searchButton).click();
    await page.locator(selectors.searchInput).fill('deploy');
    await expect(page.locator(`${selectors.searchResult}:visible`).first()).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await expect(page.locator(selectors.searchDialog)).not.toBeVisible();
    await expect(page).toHaveURL(/\/core\/v\d+-\d+\//);
  });
});
