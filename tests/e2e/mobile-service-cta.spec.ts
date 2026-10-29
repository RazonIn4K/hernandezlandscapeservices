import { expect, test } from './fixtures';

for (const route of ['/lawn-care/', '/es/lawn-care/', '/tree-removal/', '/es/landscaping-design/']) {
  test(`${route} hides the fixed contact bar when its service actions are visible`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const bar = page.locator('[data-mobile-call-cta]');
    const panel = page.locator('.service-cta').first();
    await expect(bar).toBeVisible();
    await panel.scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
    await expect(panel.locator('a').first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeVisible();
  });
}

test('service contact panel also suppresses the bar without IntersectionObserver', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { Reflect.deleteProperty(window, 'IntersectionObserver'); });
  await page.goto('/lawn-care/', { waitUntil: 'load' });
  const bar = page.locator('[data-mobile-call-cta]');
  await expect(bar).toBeVisible();
  await page.locator('.service-cta').scrollIntoViewIfNeeded();
  await expect(bar).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(bar).toBeVisible();
});


test('emergency request panel is not covered by the fixed contact bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tree-removal/', { waitUntil: 'domcontentloaded' });
  const bar = page.locator('[data-mobile-call-cta]');
  await page.locator('#emergency-dispatch').scrollIntoViewIfNeeded();
  await expect(bar).toBeHidden();
  await expect(page.locator('#emergency-dispatch [data-emergency-dispatch]')).toBeVisible();
});
