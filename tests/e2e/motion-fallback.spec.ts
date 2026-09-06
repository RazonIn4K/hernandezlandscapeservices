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

test('homepage project details remain inside the viewport when opened', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const details = page.locator('.trust-chip-details');
    for (let index = 0; index < await details.count(); index++) {
      const item = details.nth(index);
      await item.locator('summary').click();
      await expect(item).toHaveAttribute('open', '');
      const bounds = await item.locator('.trust-tip').boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await item.locator('summary').click();
    }
  }
});
