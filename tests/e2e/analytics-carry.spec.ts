import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

// Codex review: Google Tag Manager loads late (round 4, research 03 R19), so a tracked
// click that leaves the page before the container has loaded must not be lost. The
// fixture aborts googletagmanager.com, i.e. the container never arrives here.

type Entry = { event?: string; [key: string]: unknown };
const layer = (page: Page) => page.evaluate(() => ((window as unknown as { dataLayer?: Entry[] }).dataLayer ?? []).map((e) => ({ ...e })));
const QUEUE_KEY = 'hls:pendingEvents';

test('a quote click that leaves the page before GTM loads reaches the next page\'s dataLayer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tree-removal/', { waitUntil: 'domcontentloaded' });
  await Promise.all([
    page.waitForURL(/\/#quote$/),
    page.locator('#header .header-cta').click(),
  ]);
  await page.waitForLoadState('domcontentloaded');
  const events = await layer(page);
  const carried = events.filter((e) => e.event === 'quote_cta_click');
  expect(carried).toEqual([{ event: 'quote_cta_click', link_url: '/#quote' }]);
  // after the container's own start event, and replayed once
  expect(events.findIndex((e) => e.event === 'gtm.js')).toBeLessThan(events.findIndex((e) => e.event === 'quote_cta_click'));
  expect(await page.evaluate((k) => sessionStorage.getItem(k), QUEUE_KEY)).toBeNull();
  // GTM never loads in this test, so leaving again carries it on once more: one copy, not two.
  await page.reload({ waitUntil: 'domcontentloaded' });
  expect((await layer(page)).filter((e) => e.event === 'quote_cta_click')).toHaveLength(1);
});

test('the emergency page\'s mobile bar estimate carries both of its events', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/emergency-tree-removal/', { waitUntil: 'load' });
  await page.evaluate(() => window.scrollTo(0, 1200));
  const estimate = page.locator('[data-mobile-call-cta-estimate]');
  await expect(estimate).toBeVisible();
  await Promise.all([page.waitForURL(/\/#quote$/), estimate.click()]);
  await page.waitForLoadState('domcontentloaded');
  const names = (await layer(page)).map((e) => e.event);
  expect(names).toContain('quote_cta_click');
  expect(names).toContain('estimate_click');
});

test('nothing is carried once GTM has loaded on the page', async ({ page }) => {
  // a stub container: marks itself loaded, like gtm.js does
  await page.route(/googletagmanager\.com\/gtm\.js/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.google_tag_manager = { "GTM-NJ4DPSC9": { dataLayer: {} } };' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tree-removal/', { waitUntil: 'load' });
  await page.mouse.move(5, 5);
  await page.keyboard.press('Shift');
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { google_tag_manager?: unknown }).google_tag_manager))).toBe(true);
  await Promise.all([page.waitForURL(/\/#quote$/), page.locator('#header .header-cta').click()]);
  await page.waitForLoadState('domcontentloaded');
  expect((await layer(page)).filter((e) => e.event === 'quote_cta_click')).toHaveLength(0);
});

test('replay accepts only the site\'s own events, keys and short values, then clears the queue', async ({ page }) => {
  // Seeded before analytics.js runs (after the previous page has saved its own queue).
  const long = 'x'.repeat(300);
  const seeds: Record<string, unknown> = {
    mixed: [
      { event: 'call_click', params: { link_url: 'tel:18155011478' }, ago: 0 },
      { event: 'estimate_click', params: { source: 'mobile_sticky_cta', email: 'a@b.c', link_url: long }, ago: 0 },
      { event: 'gtm.js', params: {}, ago: 0 },
      { event: 'lead_submit_success', params: { source: { nested: 1 } }, ago: 0 },
      { event: 'phone_click', params: { source: 'mobile_sticky_cta' }, ago: 10 * 60 * 1000 },
      { event: 'sms_click', params: { source: 42 }, ago: 0 },
      { event: '<img src=x>', params: {}, ago: 0 },
      'not an object',
      { event: 'quote_cta_click', params: ['/#quote'], ago: 0 },
      { event: 'call_click', params: { link_url: 'tel:18155011478' }, ago: -60 * 60 * 1000 },
    ],
    notjson: '{not json',
    toolong: [{ event: 'call_click', params: { link_url: 'x'.repeat(150) }, ago: 0 }].concat(Array.from({ length: 40 }, () => ({ event: 'sms_click', params: { source: 'y'.repeat(150) }, ago: 0 }))),
  };
  await page.addInitScript(([key, seedMap]) => {
    const name = new URLSearchParams(location.search).get('seed');
    if (!name) return;
    const seed = (seedMap as Record<string, unknown>)[name];
    const value = typeof seed === 'string'
      ? seed
      : JSON.stringify((seed as Array<Record<string, unknown> | string>).map((item) =>
        typeof item === 'object' && item && 'ago' in item ? { event: item.event, params: item.params, at: Date.now() - (item.ago as number) } : item));
    sessionStorage.setItem(key as string, value);
  }, [QUEUE_KEY, seeds]);

  await page.goto('/tree-removal/?seed=mixed', { waitUntil: 'domcontentloaded' });
  const replayed = (await layer(page)).filter((e) => !String(e.event).startsWith('gtm.'));
  expect(replayed).toEqual([
    { event: 'call_click', link_url: 'tel:18155011478' },
    { event: 'estimate_click', source: 'mobile_sticky_cta' },
    { event: 'lead_submit_success' },
    { event: 'sms_click', source: 42 },
    { event: 'quote_cta_click' },
  ]);
  expect(await page.evaluate((k) => sessionStorage.getItem(k), QUEUE_KEY)).toBeNull();

  for (const seed of ['notjson', 'toolong']) {
    // (a directory URL: some static servers redirect *.html and drop the query)
    await page.goto(`/lawn-care/?seed=${seed}`, { waitUntil: 'domcontentloaded' });
    expect((await layer(page)).filter((e) => !String(e.event).startsWith('gtm.')), seed).toEqual([]);
    expect(await page.evaluate((k) => sessionStorage.getItem(k), QUEUE_KEY)).toBeNull();
  }
});
