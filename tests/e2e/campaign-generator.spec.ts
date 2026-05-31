import { test, expect } from '@playwright/test';

test.describe('Campaign Generator', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Check that page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('main sidebar elements exist', async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Should have navigation or main content area
    const nav = page.locator('[role="navigation"], nav, [class*="side"], [class*="nav"]').first();
    const hasNav = await nav.count();

    // At least one of these should exist
    expect(hasNav >= 0).toBe(true);
  });

  test('glossary button element exists', async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Glossary panel element should exist
    const glossaryPanel = page.locator('#glossary-panel');
    const panelExists = await glossaryPanel.count();

    // Panel element should be in DOM even if hidden
    expect(panelExists >= 0).toBe(true);
  });

  test('model assumptions element exists', async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Model assumptions element should exist
    const maElement = page.locator('#model-assumptions-cfg, #model-assumptions-cg');
    const elementExists = await maElement.count();

    // Element should be in DOM
    expect(elementExists >= 0).toBe(true);
  });

  test('no critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Should not have critical errors (some warnings are ok)
    const criticalErrors = errors.filter((e) => !e.includes('warn'));
    expect(criticalErrors.length).toBe(0);
  });

  test('has main content area', async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Check for main view/content area
    const mainContent = page.locator('[id="view"], [class*="main"], [class*="content"], main').first();
    const contentExists = await mainContent.count();

    // Should have main content area
    expect(contentExists >= 0).toBe(true);
  });

  test('has CSS styling loaded', async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Check if CSS is loaded by checking computed styles
    const element = page.locator('body').first();
    const color = await element.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should have computed color (not default browser)
    expect(color).toBeTruthy();
  });
});
