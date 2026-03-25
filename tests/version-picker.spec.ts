import { test, expect, selectors } from './fixtures';

// TODO: Enable once Core has archived versions and the version picker is active
test.describe.skip('Version Picker', () => {
  test('user selects an older version and navigates to versioned docs', async ({ page }) => {
    await page.goto('/core/');
    const select = page.locator(selectors.versionSelect);
    await expect(select).toBeVisible();

    const options = select.locator('option');
    const versionOption = options.nth(1);
    const value = await versionOption.getAttribute('value');
    await select.selectOption(value!);

    await expect(page).toHaveURL(/\/core\/v\d+-\d+\//);
  });
});
