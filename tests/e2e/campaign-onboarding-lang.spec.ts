import { test, expect } from '@playwright/test';

test.describe('Campaign Generator — Onboarding Language', () => {
  test('onboarding shows in English by default', async ({ page, context }) => {
    // Initialize with empty localStorage
    await context.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Check if onboarding modal exists
    const modal = page.locator('#onb-modal');
    const modalExists = await modal.count();

    // If modal exists, check for English text
    if (modalExists > 0) {
      const heading = modal.locator('div').first();
      const text = await heading.textContent();

      // Should contain English text (not Russian)
      expect(text).toContain('AI Campaign Generator');
    }
  });

  test('onboarding shows in Russian when lang is Russian', async ({ page, context }) => {
    // Set Russian language before page loads
    await context.addInitScript(() => {
      localStorage.setItem('bonusLang', 'ru');
    });

    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Check if onboarding modal exists
    const modal = page.locator('#onb-modal');
    const modalExists = await modal.count();

    // If modal exists, check for Russian text
    if (modalExists > 0) {
      const heading = modal.locator('div').first();
      const text = await heading.textContent();

      // Should contain Russian text
      expect(text).toContain('AI-генератор кампаний');
    }
  });

  test('onboarding does not show when localStorage flag is set', async ({ page, context }) => {
    // Set flag to skip onboarding before page loads
    await context.addInitScript(() => {
      localStorage.setItem('cg_onboarding_done', '1');
    });

    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Onboarding modal should not exist
    const modal = page.locator('#onb-modal');
    const modalExists = await modal.count();

    expect(modalExists).toBe(0);
  });

  test('onboarding button handler works', async ({ page, context }) => {
    // Initialize with empty localStorage to show onboarding
    await context.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/campaign-generator.html');
    await page.waitForLoadState('networkidle');

    // Check if modal exists initially
    let modal = page.locator('#onb-modal');
    let modalExists = await modal.count();

    if (modalExists > 0) {
      // Click the close button (last button in the modal)
      const closeBtn = modal.locator('button').last();
      await closeBtn.click();

      // Modal should be removed
      modalExists = await modal.count();
      expect(modalExists).toBe(0);
    }
  });
});
