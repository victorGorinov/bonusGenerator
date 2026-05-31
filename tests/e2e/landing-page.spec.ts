import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check main heading exists
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('cookie banner HTML exists in page', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator('#cookie-banner');
    const bannerExists = await banner.count();

    // Banner element should be in DOM
    expect(bannerExists).toBeGreaterThan(0);
  });

  test('cookie functions are defined', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if functions exist in window
    const cookieAcceptExists = await page.evaluate(
      () => typeof (window as any).cookieAccept === 'function'
    );
    const cookieDeclineExists = await page.evaluate(
      () => typeof (window as any).cookieDecline === 'function'
    );

    expect(cookieAcceptExists).toBe(true);
    expect(cookieDeclineExists).toBe(true);
  });

  test('has navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = page.locator('a');
    const linkCount = await links.count();

    // Should have at least a few links
    expect(linkCount).toBeGreaterThan(2);
  });

  test('has buttons or interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Should have at least some buttons
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('no critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should not have critical errors
    expect(errors.length).toBe(0);
  });
});
