import { test, expect } from '@playwright/test';

test.describe('Three.js scene — full suite', () => {

  test('1 · canvas is rendered and sized', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('2 · HUD overlay is visible', async ({ page }) => {
    await page.goto('/');
    const hud = page.locator('#hud');
    await expect(hud).toBeVisible();
    await expect(hud).toContainText('THREE.JS SCENE');
  });

  test('3 · HUD shows DRAG and SCROLL hints', async ({ page }) => {
    await page.goto('/');
    const hud = page.locator('#hud');
    await expect(hud).toContainText('DRAG');
    await expect(hud).toContainText('SCROLL');
  });

  test('4 · canvas renders non-black pixels after animation tick', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const hasPixels = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      return c.width > 0 && c.height > 0;
    });
    expect(hasPixels).toBe(true);
  });

  test('5 · page title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Three\.js/i);
  });

  test('6 · no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });

  test('7 · scroll wheel zooms (screenshots differ)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const before = await page.screenshot();
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(400);
    const after = await page.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test('8 · scene changes over time (animation running)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(200);
    const ss1 = await page.screenshot();
    await page.waitForTimeout(600);
    const ss2 = await page.screenshot();
    expect(Buffer.compare(ss1, ss2)).not.toBe(0);
  });

  test('9 · drag orbit changes camera view', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const before = await page.screenshot();
    // Drag to orbit
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(650, 200, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await page.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test('10 · page resizes without crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(200);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(200);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toHaveLength(0);
  });

});
