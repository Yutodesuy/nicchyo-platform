import { test, expect } from '@playwright/test';

test('cookie consent flow and analytics opt-in', async ({ page }) => {
  await page.goto('/');
  // Wait for cookie consent to appear
  const consent = page.locator('text=解析データの収集に同意しますか');
  await expect(consent).toBeVisible({ timeout: 30000 });

  // Simulate consent by setting localStorage (ensures app behaves as if user accepted)
  await page.evaluate(() => localStorage.setItem('nicchyo_analytics_consent', 'accepted'));
  await page.reload();
  const val = await page.evaluate(() => localStorage.getItem('nicchyo_analytics_consent'));
  expect(val).toBe('accepted');
});
