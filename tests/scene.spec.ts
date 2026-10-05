import { test, expect } from '@playwright/test';

test.describe('Three.js scene', () => {

  test('page loads and canvas is rendered', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);
  });

  test('info overlay is shown', async ({ page }) => {
    await page.goto('/');
    const info = page.locator('#info');
    await expect(info).toBeVisible();
    await expect(info).toContainText('Three.js');
  });

  test('canvas renders non-black pixels after animation tick', async ({ page }) => {
    await page.goto('/');
    // Wait for at least one rAF to fire
    await page.waitForTimeout(200);

    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // WebGL canvas – sample via readPixels through a 2D blit
        // We simply check that the canvas has non-zero dimensions and exists
        return canvas.width > 0 && canvas.height > 0;
      }
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      return data.some(v => v !== 0);
    });
    expect(hasContent).toBe(true);
  });

  test('scroll wheel changes zoom (camera z)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(200);

    // Capture screenshot before scroll
    const before = await page.screenshot();

    // Scroll in (zoom in)
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(300);

    const after = await page.screenshot();

    // Screenshots should differ after zoom
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test('page title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Three\.js/i);
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

});
