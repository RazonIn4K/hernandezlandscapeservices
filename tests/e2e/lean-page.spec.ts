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

// Round 4 · Analytics after the page (research 03 R19). The fixture aborts the
// third-party requests; these tests only watch when the loader asks for them.
const GTM_INIT = () => {
  const w = window as unknown as { __gtmAt?: number; __loadAt?: number };
  window.addEventListener('load', () => { w.__loadAt = performance.now(); });
  new MutationObserver((records) => {
    for (const r of records) {
      for (const n of Array.from(r.addedNodes)) {
        if (n instanceof HTMLScriptElement && n.src.includes('googletagmanager.com/gtm.js') && w.__gtmAt === undefined) {
          w.__gtmAt = performance.now();
        }
      }
    }
  }).observe(document, { childList: true, subtree: true });
};

test('deferred Google Tag Manager: the queue starts at once, the container after load and idle', async ({ page }) => {
  await page.addInitScript(GTM_INIT);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const early = await page.evaluate(() => ({
    events: ((window as unknown as { dataLayer?: Array<{ event?: string }> }).dataLayer ?? []).map((e) => e.event),
    track: typeof (window as unknown as { hlsTrack?: unknown }).hlsTrack,
    umami: document.querySelectorAll('script[data-website-id][src*="umami"]').length,
  }));
  expect(early.events[0]).toBe('gtm.js');
  expect(early.track).toBe('function');
  expect(early.umami, 'Umami still loads as before').toBe(1);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __gtmAt?: number }).__gtmAt), { timeout: 8000 }).toBeGreaterThan(0);
  const at = await page.evaluate(() => ({ gtm: (window as unknown as { __gtmAt: number }).__gtmAt, load: (window as unknown as { __loadAt: number }).__loadAt }));
  expect(at.load).toBeGreaterThan(0);
  expect(at.gtm, 'container requested only after the load event').toBeGreaterThanOrEqual(at.load);
  await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(1);
});

test('deferred Google Tag Manager: the first key press loads it without waiting for idle', async ({ page }) => {
  await page.addInitScript(() => {
    // Hold idle callbacks so only the interaction can trigger the container.
    (window as unknown as { requestIdleCallback: () => number }).requestIdleCallback = () => 0;
  });
  await page.addInitScript(GTM_INIT);
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(0);
  const clicksBefore = await page.evaluate(() => {
    (window as unknown as { hlsTrack: (e: string, p?: object) => void }).hlsTrack('quote_cta_click', { link_url: '#quote' });
    return ((window as unknown as { dataLayer: Array<{ event?: string }> }).dataLayer).filter((e) => e.event === 'quote_cta_click').length;
  });
  expect(clicksBefore, 'events are queued before the container arrives').toBe(1);
  await page.keyboard.press('Shift');
  await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(1);
  await page.mouse.move(10, 10);
  await page.keyboard.press('Shift');
  await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]'), 'requested once').toHaveCount(1);
});

// Round 5 · Icons are inline SVG (LUXE-CRAFT-BAR F): no icon font, and every icon's
// <use> finds its symbol in the page's own sprite.
test('icons need no font: every icon resolves to a symbol in the page', async ({ page }) => {
  for (const path of ['/', '/es/', '/videos/', '/gallery/', '/emergency-tree-removal/', '/es/service-areas/malta-il/']) {
    const fontRequests: string[] = [];
    page.on('request', (r) => { if (/\/assets\/icons\/|fa-(solid|brands)/.test(r.url())) fontRequests.push(r.url()); });
    await page.goto(path, { waitUntil: 'load' });
    const missing = await page.locator('svg.icon use').evaluateAll((uses) =>
      uses.map((u) => u.getAttribute('href') || '').filter((href) => !document.querySelector(`symbol${href}`)));
    expect(missing, path).toEqual([]);
    expect(await page.locator('svg.icon').count(), path).toBeGreaterThanOrEqual(3);
    await expect(page.locator('i.fas, i.fab, i[class*="fa-"]')).toHaveCount(0);
    expect(fontRequests, path).toEqual([]);
    const box = await page.locator('svg.icon').first().boundingBox();
    expect(box!.height).toBeGreaterThan(0);
    page.removeAllListeners('request');
  }
});
