import { expect, test } from './fixtures';

for (const route of ['/', '/tree-removal/', '/lawn-care/', '/es/tree-removal/']) {
  test(`content remains readable without JavaScript on ${route}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? '3000'}${route}`);
    const hiddenContent = await page.locator('.reveal, .reveal-left, .reveal-right').evaluateAll((elements) =>
      elements.filter((element) => getComputedStyle(element).opacity === '0').length,
    );
    expect(hiddenContent).toBe(0);
    await context.close();
  });
}

test('homepage content stays readable if motion script fails', async ({ page }) => {
  await page.route('**/assets/js/motion.js', (route) => route.abort());
  await page.goto('/');
  expect(await page.locator('.reveal').evaluateAll((elements) =>
    elements.filter((element) => getComputedStyle(element).opacity === '0').length,
  )).toBe(0);
});

test('homepage trust chips are plain facts that stay inside the viewport', async ({ page }) => {
  // Round 4: no tooltip chips, no shield/certificate/star icons; the gallery chip is a real link.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('.trust-chip-details')).toHaveCount(0);
    await expect(page.locator('#home .fa-shield-alt, #home .fa-certificate, #home .fa-star')).toHaveCount(0);
    const chips = page.locator('.hero-trust-grid .trust-chip');
    await expect(chips).toHaveCount(4);
    for (let index = 0; index < 4; index++) {
      const bounds = await chips.nth(index).boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
    await expect(page.locator('.hero-trust-grid a.trust-chip-link')).toHaveAttribute('href', '/gallery/');
  }
});
