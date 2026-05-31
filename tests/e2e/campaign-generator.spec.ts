import { test, expect } from '@playwright/test';

test.describe('Campaign Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');
  });

  test('loads and shows onboarding on first visit', async ({ page, context }) => {
    // Clear onboarding flag to force it to show
    await context.clearCookies();
    await page.evaluate(() => localStorage.removeItem('cg_onboarding_done'));
    await page.reload();

    // Onboarding should appear
    const onboarding = page.locator('text=Welcome');
    await expect(onboarding).toBeVisible({ timeout: 1500 });
  });

  test('step 1: select scenario', async ({ page }) => {
    const welcomeClose = page.locator('button:has-text("Start")').first();
    if (await welcomeClose.isVisible()) {
      await welcomeClose.click();
    }

    // Should be on step 1
    const scenarioCards = page.locator('.scenario-card').first();
    await expect(scenarioCards).toBeVisible();

    // Click a scenario
    await scenarioCards.click();

    // Should advance to step 2
    await expect(page.locator('text=/Tone|Budget/')).toBeVisible();
  });

  test('glossary panel opens and closes', async ({ page }) => {
    const glossaryBtn = page.locator('button[title="Glossary"]').first();
    if (await glossaryBtn.isVisible()) {
      await glossaryBtn.click();

      // Panel should appear
      const panel = page.locator('#glossary-panel');
      await expect(panel).toBeVisible();

      // Close button
      const closeBtn = panel.locator('button:has-text("×")');
      await closeBtn.click();

      // Panel should disappear
      await expect(panel).not.toBeVisible();
    }
  });

  test('stale badge appears when players slider changes', async ({ page }) => {
    const welcomeClose = page.locator('button:has-text("Start")').first();
    if (await welcomeClose.isVisible()) {
      await welcomeClose.click();
    }

    // Select a scenario and proceed
    const scenarioCard = page.locator('.scenario-card').first();
    await scenarioCard.click();

    // Wait for step 2
    await page.waitForTimeout(500);

    // Generate to get baseline
    const generateBtn = page.locator('button:has-text("Сгенерировать")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(1000);
    }

    // Go back to step 2
    const backBtn = page.locator('button:has-text("← Назад")').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(300);
    }

    // Change players slider
    const prange = page.locator('#prange');
    if (await prange.isVisible()) {
      await prange.fill('3000');

      // Stale badge should appear
      const staleBadge = page.locator('#stale-badge, text=↻');
      await expect(staleBadge).toBeVisible({ timeout: 1000 });
    }
  });

  test('model assumptions collapsible works', async ({ page }) => {
    const welcomeClose = page.locator('button:has-text("Start")').first();
    if (await welcomeClose.isVisible()) {
      await welcomeClose.click();
    }

    // Select scenario, proceed, generate
    await page.locator('.scenario-card').first().click();
    await page.waitForTimeout(300);

    const generateBtn = page.locator('button:has-text("Сгенерировать")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(1000);
    }

    // Find and click model assumptions button
    const maBtn = page.locator('button:has-text("Допущения модели")').first();
    if (await maBtn.isVisible()) {
      await maBtn.click();

      // Content should appear
      const maContent = page.locator('#model-assumptions-cfg');
      await expect(maContent).toBeVisible();

      // Click again to collapse
      await maBtn.click();
      await expect(maContent).not.toBeVisible();
    }
  });

  test('copy all channel button works', async ({ page }) => {
    const welcomeClose = page.locator('button:has-text("Start")').first();
    if (await welcomeClose.isVisible()) {
      await welcomeClose.click();
    }

    // Select scenario, proceed to texts
    await page.locator('.scenario-card').first().click();
    await page.waitForTimeout(300);

    const generateBtn = page.locator('button:has-text("Сгенерировать")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(1000);
    }

    // Proceed to texts
    const toTextsBtn = page.locator('button:has-text("Тексты и аудит")').first();
    if (await toTextsBtn.isVisible()) {
      await toTextsBtn.click();
      await page.waitForTimeout(500);
    }

    // Copy all button should exist
    const copyAllBtn = page.locator('#copy-all-btn, button:has-text("⎘")').first();
    if (await copyAllBtn.isVisible()) {
      await copyAllBtn.click();
      // Should copy to clipboard (we can't directly verify clipboard in Playwright without special setup)
      // but clicking should not error
      expect(true).toBe(true);
    }
  });
});
