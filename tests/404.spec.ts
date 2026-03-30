import { test, expect, selectors } from './fixtures';

test.describe('404 Pages — non-versioned', () => {
  test('nonexistent Core page shows 404 with home link to /core/ and Core sidebar', async ({ page }) => {
    await page.goto('/core/this-page-does-not-exist/');

    // Wait for the 404 page's JS to fetch and swap in the Core sidebar
    await expect(page.locator(selectors.productDropdownButton)).toContainText('Core');

    // Home link should point to Core root
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/core/');

    // Clicking the home link navigates back to Core docs
    await homeLink.click();
    await expect(page).toHaveURL('/core/');
  });

  test('nonexistent CLI page shows 404 with home link to /cli/ and CLI sidebar', async ({ page }) => {
    await page.goto('/cli/this-page-does-not-exist/');

    // Wait for the 404 page's JS to fetch and swap in the CLI sidebar
    await expect(page.locator(selectors.productDropdownButton)).toContainText('CLI');

    // Home link should point to CLI root
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/cli/');

    // Clicking the home link navigates back to CLI docs
    await homeLink.click();
    await expect(page).toHaveURL('/cli/');
  });
});

test.describe('404 Pages — versioned paths', () => {
  // These tests use fake version slugs (v0-00) that never existed.
  // The 404.md JS is purely client-side and pattern-matches the URL,
  // so the "older version" hint and home link updates run regardless
  // of whether real versioned content was built.
  //
  // The sidebar swap (which fetches /product/vX-Y/404/) is NOT tested
  // here because it requires a real archived version to be built.
  // TODO: add sidebar-swap assertions once a product ships archived
  // versions and the version picker test (version-picker.spec.ts) is
  // unskipped.

  test('versioned product path shows "older version" hint with link to latest', async ({ page }) => {
    // /core/v0-00/... — non-root product with a versioned subpath
    await page.goto('/core/v0-00/this-page-does-not-exist/');

    const content = page.locator('.sl-markdown-content');
    await expect(content).toContainText("You're viewing an older version");

    // The "latest version" link should point to /core/ (the product root)
    const latestLink = content.locator('a:has-text("latest version")');
    await expect(latestLink).toHaveAttribute('href', '/core/');
  });

  test('versioned product path home link points to product root, not version root', async ({ page }) => {
    await page.goto('/core/v0-00/this-page-does-not-exist/');

    // The first path segment is /core/, which is NOT a version segment,
    // so the home link is updated to the product root.
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/core/');
  });

  test('root-level versioned path (Core layout) shows "older version" hint with link to /', async ({ page }) => {
    // Core docs live at the site root; archived Core versions use /vX-Y/... paths.
    await page.goto('/v0-00/this-page-does-not-exist/');

    const content = page.locator('.sl-markdown-content');
    await expect(content).toContainText("You're viewing an older version");

    // The "latest version" link should point to / (the latest Core root)
    const latestLink = content.locator('a:has-text("latest version")');
    await expect(latestLink).toHaveAttribute('href', '/');
  });

  test('root-level versioned path home link stays at / (version segment detected)', async ({ page }) => {
    await page.goto('/v0-00/this-page-does-not-exist/');

    // The first segment is /v0-00/, which matches VERSION_SEGMENT_RE,
    // so the home link is NOT updated and remains at /.
    const homeLink = page.locator('a[data-product-home]');
    await expect(homeLink).toHaveAttribute('href', '/');
  });
});
