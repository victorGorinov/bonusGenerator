import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage to ensure cookie banner shows
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('cookie banner appears after delay', async ({ page }) => {
    const banner = page.locator('#cookie-banner');
    // Banner appears with display:flex after 1.2s
    await expect(banner).toBeVisible({ timeout: 2000 });
  });

  test('cookie accept button closes banner', async ({ page }) => {
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible({ timeout: 2000 });

    const acceptBtn = page.locator('button:has-text("Accept")').first();
    await acceptBtn.click();

    // Banner should be hidden
    await expect(banner).toBeHidden();

    // localStorage should have consent
    const consent = await page.evaluate(() => localStorage.getItem('cookieConsent'));
    expect(consent).toBe('accepted');
  });

  test('cookie decline button closes banner', async ({ page }) => {
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible({ timeout: 2000 });

    const declineBtn = page.locator('button:has-text("Decline")').first();
    await declineBtn.click();

    // Banner should be hidden
    await expect(banner).toBeHidden();

    // localStorage should have consent
    const consent = await page.evaluate(() => localStorage.getItem('cookieConsent'));
    expect(consent).toBe('declined');
  });

  test('cookie banner does not appear after consent saved', async ({ page }) => {
    // Set consent in localStorage
    await page.evaluate(() => localStorage.setItem('cookieConsent', 'accepted'));
    await page.reload();

    const banner = page.locator('#cookie-banner');
    // Banner should not appear
    await expect(banner).not.toBeVisible();
  });

  test('language toggle buttons work', async ({ page }) => {
    // Check RU button exists and is clickable
    const ruBtn = page.locator('button:has-text("RU")').first();
    await expect(ruBtn).toBeVisible();

    // Check EN button exists
    const enBtn = page.locator('button:has-text("EN")').first();
    await expect(enBtn).toBeVisible();

    // Click RU (should switch language)
    await ruBtn.click();
    expect(await ruBtn.evaluate((el) => el.classList.contains('active'))).toBe(true);

    // Click EN
    await enBtn.click();
    expect(await enBtn.evaluate((el) => el.classList.contains('active'))).toBe(true);
  });

  test('campaign generator link works', async ({ page }) => {
    const cg = page.locator('a:has-text("🤖 AI Generator")').first();
    await expect(cg).toBeVisible();

    await Promise.all([
      page.waitForNavigation(),
      cg.click(),
    ]);

    expect(page.url()).toContain('/campaign-generator.html');
  });

  test('tournament generator link works', async ({ page }) => {
    const tg = page.locator('a:has-text("Tournament Generator")').first();
    if (await tg.isVisible()) {
      await Promise.all([
        page.waitForNavigation(),
        tg.click(),
      ]);
      expect(page.url()).toContain('/tournament-generator.html');
    }
  });
});
