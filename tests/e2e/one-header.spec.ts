import { expect, test } from './fixtures';

// Round 4 · One header on every page with a visible language link (research 03 R5, 05 X7/X13).

const linked: Array<[string, string, 'es' | 'en', string]> = [
  ['/tree-removal/', '/es/tree-removal/', 'es', 'Español'],
  ['/emergency-tree-removal/', '/es/emergency-tree-removal/', 'es', 'Español'],
  ['/lawn-care/', '/es/lawn-care/', 'es', 'Español'],
  ['/service-areas/sycamore-il/', '/es/service-areas/sycamore-il/', 'es', 'Español'],
  ['/gutter-cleaning/', '/es/', 'es', 'Español (inicio)'],
  ['/service-areas/', '/es/', 'es', 'Español (inicio)'],
  ['/service-areas/dekalb-il/', '/es/', 'es', 'Español (inicio)'],
  ['/es/', '/', 'en', 'English'],
  ['/es/tree-removal/', '/tree-removal/', 'en', 'English'],
  ['/es/service-areas/genoa-il/', '/service-areas/genoa-il/', 'en', 'English'],
];

for (const [route, href, lang, label] of linked) {
  test(`${route}: one header with a visible ${label} link to ${href}`, async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('header')).toHaveCount(1);
      const link = page.locator('#header .lang-link:visible');
      await expect(link, `${route} @${width}`).toHaveCount(1);
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('hreflang', lang);
      await expect(link).toHaveAttribute('lang', lang);
      await expect(link).toHaveText(label, { useInnerText: false });
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      if (width === 1440) await expect(page.locator('#header .header-tel')).toHaveText('(815) 501-1478');
    }
  });
}

test('every page with a header uses the shared one (same brand, nav and phone)', async ({ page }) => {
  for (const route of ['/', '/gallery/', '/videos/', '/tree-removal/', '/service-areas/', '/es/', '/es/lawn-care/', '/es/service-areas/malta-il/']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#header.site-header'), route).toHaveCount(1);
    await expect(page.locator('#header .desktop-nav > a:not(.header-cta):not(.lang-link):not(.header-tel)'), route).toHaveCount(5);
    await expect(page.locator('#header a[href="tel:18155011478"].header-tel'), route).toHaveCount(1);
  }
});

test('/es/ has no blank band between the header and the hero, and its bar waits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/es/', { waitUntil: 'domcontentloaded' });
  const headerBottom = await page.locator('#header').evaluate((el) => el.getBoundingClientRect().bottom);
  const heroTop = await page.locator('[data-weather-hero]').evaluate((el) => el.getBoundingClientRect().top);
  expect(heroTop).toBeLessThanOrEqual(headerBottom);
  const bar = page.locator('[data-mobile-call-cta]');
  await expect(bar).not.toBeVisible();
  const callBottom = await page.locator('[data-hero-call]').evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y + 20), callBottom);
  await expect(bar).toBeVisible();
});
