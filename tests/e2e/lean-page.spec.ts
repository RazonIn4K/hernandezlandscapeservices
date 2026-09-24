import { expect, test } from './fixtures';

// Round 4 · Cheaper map, leaner cache, faster first paint (research 03 R9/R11/R18, 05 X9).

test('one render-blocking stylesheet; Stencil and italic faces load after the page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const blocking = await page.locator('head link[rel="stylesheet"]:not([data-late-fonts])').evaluateAll((links) =>
    links.map((l) => (l as HTMLLinkElement).getAttribute('href')));
  expect(blocking).toHaveLength(1);
  expect(blocking[0]).toMatch(/^\/assets\/css\/site\.css\?v=/);
  await expect(page.locator('head link[data-late-fonts]')).toHaveCount(1);
});

test('the Big Shoulders fallback keeps the H1 on the same lines while the webfont loads', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium' && testInfo.project.name !== 'chrome-local', 'Local font metrics differ per engine.');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const h1 = page.locator('#home h1');
  const real = await h1.evaluate((el) => el.getBoundingClientRect().height);
  await page.evaluate(() => document.documentElement.style.setProperty('--display', '"Big Shoulders Fallback", "Big Shoulders Fallback Wide", sans-serif'));
  const fallback = await h1.evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.abs(fallback - real), 'no reflow of the H1 on font swap').toBeLessThanOrEqual(2);
});

test('the service area shows an inline field map, not a Google Maps iframe', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('iframe')).toHaveCount(0);
  const map = page.locator('svg.field-map');
  await expect(map).toHaveAttribute('role', 'img');
  await expect(map.locator('title')).toHaveText(/not to scale/);
  await expect(map.locator('text')).toHaveText(['Kingston', 'Genoa', 'Sycamore', 'Cortland', 'Malta', 'DeKalb', 'N']);
  const link = page.locator('.field-map-link');
  await expect(link).toHaveAttribute('href', 'https://www.google.com/maps/place/Hernandez+Landscape+%26+Tree+Service+LLC/@41.9353196,-88.7400065,17z/');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('the service worker installs only the core shell', async ({ request }) => {
  const sw = await (await request.get('/sw.js')).text();
  const list = sw.slice(sw.indexOf('const URLS_TO_CACHE = ['), sw.indexOf('];', sw.indexOf('const URLS_TO_CACHE')));
  const urls = [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  expect(urls).toContain('/');
  expect(urls).toContain('/es/');
  expect(urls.some((u) => u.startsWith('/assets/css/site.css'))).toBe(true);
  for (const banned of ['/pay/', '/card.html', '/pricing.html', '/gallery/', '/videos/', '/tree-removal/']) {
    expect(urls.some((u) => u.startsWith(banned)), banned).toBe(false);
  }
  expect(urls.length).toBeLessThanOrEqual(25);
  for (const url of urls) {
    const res = await request.get(url);
    expect(res.ok(), url).toBe(true);
  }
});
