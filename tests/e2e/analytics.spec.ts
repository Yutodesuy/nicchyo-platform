import { test, expect } from '@playwright/test';

test('cookie consent flow and analytics opt-in', async ({ page }) => {
  await page.goto('/');

  // Wait for cookie consent banner to appear
  const consentBanner = page.locator('text=当サイトはサービス改善のため Cookie および位置情報を利用します');
  await expect(consentBanner).toBeVisible({ timeout: 30000 });

  // Click the accept-all button
  await page.getByRole('button', { name: 'すべて許可' }).first().click();

  // Verify consent values are persisted in localStorage
  const analytics = await page.evaluate(() => localStorage.getItem('nicchyo_analytics_consent'));
  const location = await page.evaluate(() => localStorage.getItem('nicchyo_location_consent'));
  expect(analytics).toBe('accepted');
  expect(location).toBe('accepted');
});
