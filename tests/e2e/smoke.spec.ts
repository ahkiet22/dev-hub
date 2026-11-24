import { expect, test } from '@playwright/test';

test.describe('Dev Hub smoke tests', () => {
  test('unauthenticated visitor is redirected to /login', async ({ page }) => {
    await page.goto('/overview');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Dev Hub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});
