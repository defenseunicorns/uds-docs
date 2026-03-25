import { test, expect, selectors } from './fixtures';

test.describe('Theme Switching', () => {
  test('selecting dark then light theme updates the document theme attribute', async ({ page }) => {
    await page.goto('/core/');
    const themeSelect = page.locator(selectors.themeSelect).first();

    await themeSelect.selectOption('dark');
    await expect(page.locator(':root')).toHaveAttribute('data-theme', 'dark');

    await themeSelect.selectOption('light');
    await expect(page.locator(':root')).toHaveAttribute('data-theme', 'light');
  });
});
