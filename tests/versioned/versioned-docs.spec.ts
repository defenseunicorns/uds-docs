import { test, expect, selectors } from '../fixtures';

// These tests run against a build produced with tests/fixtures/products.versioned.json,
// which defines a single "test-product" with one archived version (v0.1.0).
//
// Run via: npm run test:versioned
//
// The build uses DOCS_OVERRIDES to point both the latest and archived version at
// local fixture directories, making the entire pipeline fully offline.

test.describe('Versioned docs — version picker', () => {
  test('version picker appears on the test product page', async ({ page }) => {
    await page.goto('/test-product/');
    const picker = page.locator(selectors.versionPicker);
    await expect(picker).toBeVisible();
  });

  test('version picker has a v0.1 option', async ({ page }) => {
    await page.goto('/test-product/');
    const select = page.locator(selectors.versionSelect);
    await expect(select).toBeVisible();
    // The picker displays minor versions (patch stripped): v0.1.0 → "v0.1"
    const option = select.locator('option:has-text("v0.1")');
    await expect(option).toBeAttached();
  });

  test('selecting an older version navigates to the versioned docs', async ({ page }) => {
    await page.goto('/test-product/');
    const select = page.locator(selectors.versionSelect);
    await select.selectOption({ label: 'v0.1' });
    await expect(page).toHaveURL(/\/test-product\/v0-1\//);
  });
});

test.describe('Versioned docs — 404 behavior', () => {
  test('versioned 404 shows "older version" hint', async ({ page }) => {
    await page.goto('/test-product/v0-1/this-does-not-exist/');

    const content = page.locator('.sl-markdown-content');
    await expect(content).toContainText("You're viewing an older version");
  });

  test('versioned 404 hint links to the latest product root', async ({ page }) => {
    await page.goto('/test-product/v0-1/this-does-not-exist/');

    const latestLink = page.locator('.sl-markdown-content a:has-text("latest version")');
    await expect(latestLink).toHaveAttribute('href', '/test-product/');
  });

  test('versioned 404 home link points to product root', async ({ page }) => {
    await page.goto('/test-product/v0-1/this-does-not-exist/');

    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/test-product/');
  });

  test('versioned 404 swaps sidebar to versioned product sidebar', async ({ page }) => {
    // Unlike the fake-version tests in 404.spec.ts, this build has a real
    // /test-product/v0-1/404/ page, so the fetch+swap should succeed.
    await page.goto('/test-product/v0-1/this-does-not-exist/');

    // Wait for the sidebar swap (fetches /test-product/v0-1/404/ and replaces sidebar)
    await expect(page.locator(selectors.productDropdownButton)).toContainText('Test Product');
  });

  test('non-versioned 404 does NOT show "older version" hint', async ({ page }) => {
    await page.goto('/test-product/this-does-not-exist/');

    const content = page.locator('.sl-markdown-content');
    await expect(content).not.toContainText("You're viewing an older version");
  });

  test('non-versioned 404 swaps sidebar to product sidebar', async ({ page }) => {
    await page.goto('/test-product/this-does-not-exist/');

    await expect(page.locator(selectors.productDropdownButton)).toContainText('Test Product');
  });
});
