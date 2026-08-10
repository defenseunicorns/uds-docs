import { test, expect, selectors } from './fixtures';

test.describe('Version Picker', () => {
  test('latest release is selected by default and MAIN appears first', async ({ page }) => {
    await page.goto('/core/');
    const select = page.locator(selectors.versionSelect);
    await expect(select).toBeVisible();
    await expect(select.locator('option').nth(0)).toHaveText('MAIN');
    await expect(select.locator('option').nth(1)).toHaveText(/^Latest \(\d+\.\d+\)$/);
    await expect(select).toHaveValue('latest');
  });

  test('user can switch to MAIN and an older release', async ({ page }) => {
    await page.goto('/core/');
    const select = page.locator(selectors.versionSelect);
    await expect(select).toBeVisible();

    const releaseOptions = select.locator('option').filter({ hasText: /^v\d+\.\d+$/ });
    const olderRelease = releaseOptions.nth(1);
    const olderValue = await olderRelease.getAttribute('value');
    expect(olderValue).not.toBeNull();

    await select.selectOption('main');
    await expect(page).toHaveURL('/core/main/');

    await select.selectOption(olderValue as string);
    await expect(page).toHaveURL(new RegExp(`/core/${olderValue}/`));
  });
});
