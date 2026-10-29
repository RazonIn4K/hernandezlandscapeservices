import { expect, test } from './fixtures';

test('season keyboard changes are immediate', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const selected = page.locator('.month-btn[aria-checked="true"]');
  await selected.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.month-btn[aria-checked="true"]')).toHaveCount(1);
  const durations = await page.locator('.season-ring-disc, .month-btn').evaluateAll(elements => elements.map(el => getComputedStyle(el).transitionDuration));
  expect(durations.every(duration => duration === '0s')).toBeTruthy();
});

test('reduced motion removes FAQ rotation and service photo zoom', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const faq = page.locator('.faq-item:not([open]) summary').first();
  await faq.focus();
  await page.keyboard.press('Enter');
  const indicator = await faq.evaluate(el => ({ transform: getComputedStyle(el, '::after').transform, duration: getComputedStyle(el, '::after').transitionDuration }));
  expect(indicator).toEqual({ transform: 'none', duration: '0s' });
  const photo = page.locator('#services .service-card img').first();
  await photo.hover();
  const motion = await photo.evaluate(el => ({ transform: getComputedStyle(el).transform, duration: getComputedStyle(el).transitionDuration }));
  expect(motion).toEqual({ transform: 'none', duration: '0s' });
});

for (const route of ['/', '/es/']) {
  test(`${route} keeps brand and controls separate at small and enlarged sizes`, async ({ page }) => {
    for (const [width, fontSize] of [[320, '16px'], [390, '32px']] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.addStyleTag({ content: `html { font-size: ${fontSize} !important; }` });
      const brand = page.locator('#header nav > div:first-child');
      const controls = page.locator('#header nav > div:last-child');
      await expect(brand.getByText('Hernandez Landscape')).toBeVisible();
      const [a, b] = await Promise.all([brand.boundingBox(), controls.boundingBox()]);
      expect(a && b && (a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)).toBeTruthy();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  });
}

test.describe('narrow reflow', () => {
  for (const javascriptEnabled of [true, false]) {
    test(`Spanish page fits at 195 CSS pixels with JavaScript ${javascriptEnabled ? 'on' : 'off'}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 195, height: 844 }, javaScriptEnabled: javascriptEnabled, reducedMotion: 'reduce' });
      await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:' + (process.env.PLAYWRIGHT_PORT ?? '3000') + '/es/', { waitUntil: 'load' }); // with scripts off, DOMContentLoaded can precede the stylesheet
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      if (!javascriptEnabled) {
        await page.locator('.nojs-menu summary').click();
        await expect(page.locator('.nojs-menu a').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      }
      await context.close();
    });
  }
});
