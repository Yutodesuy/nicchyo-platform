import { test, expect } from '@playwright/test';

test('cookie consent flow and analytics opt-in', async ({ page }) => {
  await page.goto('/');
  const consent = page.locator('text=Cookie と位置情報の利用について');
  await expect(consent).toBeVisible({ timeout: 30000 });

  await page.getByRole('button', { name: 'すべて許可して続行' }).click();

  await expect(consent).toBeHidden({ timeout: 30000 });

  const values = await page.evaluate(() => ({
    analytics: localStorage.getItem('nicchyo_analytics_consent'),
    location: localStorage.getItem('nicchyo_location_consent'),
  }));

  expect(values.analytics).toBe('accepted');
  expect(values.location).toBe('accepted');

  await page.reload();
  await expect(page.locator('text=Cookie と位置情報の利用について')).toHaveCount(0);
});
