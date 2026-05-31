import { test, expect } from '@playwright/test';

test.describe('Tournament Generator — Step 2: Total Active Players', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tournament-generator.html');
    await page.waitForLoadState('networkidle');
  });

  test('loads Step 2 with totalPlayers slider', async ({ page }) => {
    // Click Step 1 type to proceed to Step 2
    const slotButton = page.locator('text=Slot Tournament').first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    // Check Step 2 content
    await expect(page.locator('text=Total Active Players in Casino')).toBeVisible();
    const slider = page.locator('#f-tp');
    await expect(slider).toBeVisible();
    expect(await slider.inputValue()).toBe('5000');
  });

  test('slider value syncs to number display', async ({ page }) => {
    const slotButton = page.locator('text=Slot Tournament').first();
    await slotButton.click();

    const slider = page.locator('#f-tp');
    const display = page.locator('#tp-out');

    // Set slider to 10000
    await slider.fill('10000');
    await expect(display).toContainText('10,000');

    // Set to 500
    await slider.fill('500');
    await expect(display).toContainText('500');
  });

  test('eligible hint updates on slider move', async ({ page }) => {
    const slotButton = page.locator('text=Slot Tournament').first();
    await slotButton.click();

    const slider = page.locator('#f-tp');
    const eligible = page.locator('#tp-eligible');

    // Default: all segment, 5000 players → 5000 eligible
    await expect(eligible).toContainText('5,000');

    // Change to 1000 → 1000 eligible
    await slider.fill('1000');
    await expect(eligible).toContainText('1,000');

    // Change to 10000 → 10000 eligible
    await slider.fill('10000');
    await expect(eligible).toContainText('10,000');
  });

  test('eligible hint updates on segment change', async ({ page }) => {
    const slotButton = page.locator('text=Slot Tournament').first();
    await slotButton.click();

    const vipChip = page.locator('.chip', { has: page.locator('text=VIP') }).first();
    const eligible = page.locator('#tp-eligible');

    // Default: all segment, 5000 players → 5000
    await expect(eligible).toContainText('5,000');

    // Change to vip segment (10%) → 500 eligible
    await vipChip.click();
    await expect(eligible).toContainText('500');

    // Change to dormant (40%) → 2000 eligible
    const dormantChip = page.locator('.chip', { has: page.locator('text=Dormant') }).first();
    await dormantChip.click();
    await expect(eligible).toContainText('2,000');
  });

  test('step 3 footnote shows segment ratio', async ({ page }) => {
    const slotButton = page.locator('text=Slot Tournament').first();
    await slotButton.click();

    // Set totalPlayers to 10000, segment to vip
    const slider = page.locator('#f-tp');
    await slider.fill('10000');

    const vipChip = page.locator('.chip', { has: page.locator('text=VIP') }).first();
    await vipChip.click();

    // Proceed to Step 3
    const generateBtn = page.locator('button:has-text("Generate Tournament Spec")').first();
    await generateBtn.click();

    // Check footnote contains eligible + ratio + totalPlayers
    await expect(page.locator('text=/1,000 eligible vip players.*10% of 10,000/')).toBeVisible();
  });

  test('range validation: min 100, max 100000', async ({ page }) => {
    const slotButton = page.locator('text=Slot Tournament').first();
    await slotButton.click();

    const slider = page.locator('#f-tp');

    // Try values outside range (via direct set, browser will clamp)
    await slider.fill('50');
    // Browser clamps to min=100
    const value = await slider.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(100);

    await slider.fill('200000');
    // Browser clamps to max=100000
    const value2 = await slider.inputValue();
    expect(parseInt(value2)).toBeLessThanOrEqual(100000);
  });
});
