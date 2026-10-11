import { expect, test } from './fixtures';

const routes = [
  '/', '/es/', '/gallery/', '/es/gallery/', '/videos/',
  '/lawn-care/', '/es/lawn-care/', '/tree-removal/', '/es/tree-removal/',
  '/emergency-tree-removal/', '/es/emergency-tree-removal/',
  '/service-areas/', '/es/service-areas/dekalb-il/',
  '/pricing.html', '/card.html', '/privacy.html', '/terms.html',
];
const widths = [320, 375, 640, 768, 1024, 1280, 1440, 1920];
const services = [
  'tree-removal', 'tree-trimming-stump-grinding', 'lawn-care',
  'landscaping-design', 'snow-removal', 'leaf-removal',
  'gutter-cleaning', 'pressure-washing',
];

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  // Layout checks stay local: no analytics, provider calls, or form submissions.
  await page.route('**/*', (route) =>
    new URL(route.request().url()).origin === new URL(baseURL!).origin
      ? route.continue()
      : route.abort(),
  );
});

for (const width of widths) {
  test(`pages and headers fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'load' });
      expect(response?.ok(), route).toBeTruthy();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - innerWidth,
      );
      expect(overflow, `${route}: page overflow`).toBeLessThanOrEqual(1);

      if (await page.locator('#header').count()) {
        const brand = await page.locator('#header nav > div').first().boundingBox();
        const controls = await page.locator('#header .desktop-nav:visible, #header nav > .lg\\:hidden:visible').boundingBox();
        expect(brand, `${route}: brand`).not.toBeNull();
        expect(controls, `${route}: navigation`).not.toBeNull();
        expect(brand!.x, route).toBeGreaterThanOrEqual(0);
        expect(brand!.x + brand!.width, `${route}: overlapping header`).toBeLessThanOrEqual(controls!.x + 1);
        expect(controls!.x + controls!.width, `${route}: clipped header controls`).toBeLessThanOrEqual(width + 1);
      }
    }
  });
}

for (const viewport of [{ width: 320, height: 240 }, { width: 667, height: 375 }]) {
  test(`mobile menus scroll within ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of ['/', '/es/', '/gallery/', '/es/gallery/', '/videos/', '/lawn-care/', '/es/lawn-care/', '/service-areas/']) {
      await page.goto(route, { waitUntil: 'load' });
      const button = page.locator('#mobileMenuButton');
      const menu = page.locator('#mobileMenu');
      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      const box = await menu.boundingBox();
      expect(box!.y, route).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, `${route}: menu below viewport`).toBeLessThanOrEqual(viewport.height + 1);

      const lastLink = menu.locator('a').last();
      await lastLink.focus();
      await lastLink.scrollIntoViewIfNeeded();
      await expect(lastLink, `${route}: last action is reachable`).toBeInViewport({ ratio: 1 });
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();
    }
  });
}

for (const width of [320, 375, 640, 768]) {
  test(`service content and actions fit at ${width}px in both languages`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    for (const lang of ['', 'es/']) {
      for (const service of [...services, 'emergency-tree-removal']) {
        const route = `/${lang}${service}/`;
        await page.goto(route, { waitUntil: 'load' });
        await expect(page.locator('.service-content'), route).toHaveCount(1);
        await expect(page.locator('.service-cta'), route).toHaveCount(1);
        const overflow = await page.locator('.when-card, .service-cta, .service-cta a').evaluateAll((elements) =>
          elements.map((el) => ({
            text: (el as HTMLElement).innerText,
            overflow: el.scrollWidth - el.clientWidth,
          })),
        );
        for (const item of overflow) {
          expect(item.overflow, `${route}: ${item.text}`).toBeLessThanOrEqual(1);
        }

        if (await page.locator('.when-ring').count()) {
          const ring = await page.locator('.when-ring').boundingBox();
          const card = await page.locator('.when-card').boundingBox();
          expect(ring!.x, route).toBeGreaterThanOrEqual(card!.x);
          expect(ring!.x + ring!.width, `${route}: ring exceeds card`).toBeLessThanOrEqual(card!.x + card!.width);
          const labels = await page.locator('.when-months span').evaluateAll((elements) =>
            elements.map((el) => {
              const box = el.getBoundingClientRect();
              return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
            }),
          );
          for (const label of labels) {
            expect(label.left, route).toBeGreaterThanOrEqual(ring!.x - 1);
            expect(label.right, route).toBeLessThanOrEqual(ring!.x + ring!.width + 1);
            expect(label.top, route).toBeGreaterThanOrEqual(ring!.y - 1);
            expect(label.bottom, route).toBeLessThanOrEqual(ring!.y + ring!.height + 1);
          }
        }
        for (const action of await page.locator('.service-cta a').all()) {
          const box = await action.boundingBox();
          expect(box!.height, `${route}: action target`).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
}

test('seasonal labels scale with a narrower card, not a fixed pixel radius', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/lawn-care/', { waitUntil: 'load' });
  await page.locator('.when-card').evaluate((el) => {
    (el as HTMLElement).style.maxWidth = '180px';
  });
  const ring = await page.locator('.when-ring').boundingBox();
  expect(ring!.width).toBeLessThan(212);
  const overflow = await page.locator('.when-ring').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  for (const label of await page.locator('.when-months span').all()) {
    const box = await label.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(ring!.x - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(ring!.x + ring!.width + 1);
    expect(box!.y).toBeGreaterThanOrEqual(ring!.y - 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(ring!.y + ring!.height + 1);
  }
});

test('video players keep a usable minimum width across screen sizes', async ({ page }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/videos/', { waitUntil: 'load' });
    const sizes = await page.locator('.video-grid .video-wrapper').evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect().width),
    );
    expect(sizes).toHaveLength(38);
    for (const size of sizes) {
      expect(size, `player at ${width}px`).toBeGreaterThanOrEqual(278);
    }
  }
});

test('pricing cards and subtitles fit in English and Spanish', async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/pricing.html', { waitUntil: 'load' });
    for (const lang of ['en', 'es']) {
      await page.locator(`button[data-lang="${lang}"]`).click();
      const subtitleOverflow = await page.locator('.subtitle:visible').evaluate((el) =>
        el.scrollWidth - el.clientWidth,
      );
      expect(subtitleOverflow, `${lang} subtitle at ${width}px`).toBeLessThanOrEqual(1);
      const cards = page.locator('.plan-card:visible');
      await expect(cards).toHaveCount(3);
      for (const card of await cards.all()) {
        const box = await card.boundingBox();
        expect(box!.width, `${lang} plan at ${width}px`).toBeGreaterThanOrEqual(272);
        expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
      }
    }
  }
});

test('standalone legal pages retain their authored paragraph spacing', async ({ page }) => {
  for (const route of ['/privacy.html', '/terms.html']) {
    await page.goto(route, { waitUntil: 'load' });
    await expect(page.locator('main section > p').first(), route).toHaveCSS('line-height', '28px');
  }
});
