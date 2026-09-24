import { expect, test } from './fixtures';

// Round 4 · "Show the crew, calm the weather": hero hierarchy, fold and photo.

test.describe('Hero: one clear ask and the number on every width', () => {
  test('phones: quote first, the call with its number, then the text links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const quote = page.locator('.hero-actions .primary-cta');
    await expect(quote).toHaveAttribute('href', '#quote');
    await expect(quote).toContainText('Get a free quote');
    const call = page.locator('.hero-actions a[href="tel:18155011478"]');
    await expect(call).toBeVisible();
    await expect(call).toContainText('(815) 501-1478');
    await expect(page.locator('a.hero-price-link[href="#instant-quote"]')).toBeVisible();
    await expect(page.locator('.hero-storm-link')).toBeVisible();
    await expect(page.locator('#home .emergency-strip')).toBeHidden();
    const box = await call.boundingBox();
    expect(box!.y + box!.height, 'call button inside the first 844px').toBeLessThanOrEqual(844);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('1366x768: calls above the fold, H1 capped, number in the header', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium' && testInfo.project.name !== 'chrome-local', 'Font metrics differ per engine.');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const quote = await page.locator('.hero-actions .primary-cta').boundingBox();
    expect(quote!.y + quote!.height).toBeLessThanOrEqual(768);
    const h1 = await page.locator('#home h1').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { size: parseFloat(cs.fontSize), lines: Math.round(el.getBoundingClientRect().height / parseFloat(cs.lineHeight)), animation: cs.animationName };
    });
    expect(h1.size).toBeLessThanOrEqual(72);
    expect(h1.lines).toBeLessThanOrEqual(3);
    expect(h1.animation, 'no opacity entrance on the LCP heading').toBe('none');
    await expect(page.locator('#header .header-tel')).toBeVisible();
    await expect(page.locator('#header .header-tel')).toHaveText('(815) 501-1478');
  });

  test('the full storm strip returns only in storm mode', async ({ page }) => {
    await page.route('**/assets/data/site-status.json', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: '{"storm":true}',
    }));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#home .emergency-strip')).toBeVisible();
    await expect(page.locator('.hero-storm-link')).toBeHidden();
  });

  test('phones see the crew photo as a clear band above the headline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const photo = await page.locator('#home picture img').boundingBox();
    const heading = await page.locator('#home h1').boundingBox();
    // At least 140px of photo shows between the header and the eyebrow/H1 block.
    expect(heading!.y - 76).toBeGreaterThanOrEqual(140 + 40);
    expect(photo!.y).toBeLessThanOrEqual(80);
  });
});

test.describe('Honest trust signals', () => {
  test('no rating stars or claim-shaped icons on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.fa-star, .fa-shield-alt, .fa-certificate')).toHaveCount(0);
    await expect(page.locator('[data-proof-rail] .fa-check')).toHaveCount(3);
  });

  for (const [path, label] of [
    ['/emergency-tree-removal/', 'Send a storm-damage request'],
    ['/tree-removal/', 'Send a storm-damage request'],
    ['/es/emergency-tree-removal/', 'Enviar solicitud de daños por tormenta'],
    ['/es/tree-removal/', 'Enviar solicitud de daños por tormenta'],
  ] as const) {
    test(`${path} asks for a storm-damage request, not a dispatch`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = page.locator('form[data-emergency-dispatch] button[type="submit"]');
      await expect(submit).toHaveText(label);
      await expect(page.locator('body')).not.toContainText(/Emergency Dispatch|despacho de emergencia/);
    });
  }
});
