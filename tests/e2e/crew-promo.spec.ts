import { expect, test } from './fixtures';
import { mediaItem, videosPageIds } from './media-manifest';

// The narrated crew promo (EN + ES cuts): captioned, language-marked, the right cut on
// each home page, and linked in /videos/ structured data.

const PROMOS = [
  { id: 'crew-promo-2026-en', lang: 'en', label: 'English' },
  { id: 'crew-promo-2026-es', lang: 'es', label: 'Español' },
] as const;

test('/videos/ promo cards carry captions, their language, and no crew-cam decoration', async ({ page, request }) => {
  await page.goto('/videos/', { waitUntil: 'domcontentloaded' });
  for (const { id, lang, label } of PROMOS) {
    const item = mediaItem(id);
    expect(videosPageIds).toContain(id);
    const card = page.locator('.video-grid .video-card').nth(videosPageIds.indexOf(id));
    await expect(card.locator('source')).toHaveAttribute('src', `/${item.src}`);
    const track = card.locator('track[kind="captions"]');
    await expect(track).toHaveAttribute('srclang', lang);
    await expect(track).toHaveAttribute('label', label);
    await expect(track).toHaveAttribute('default', '');
    const vtt = await request.get((await track.getAttribute('src'))!);
    expect(vtt.ok(), `${id} captions`).toBeTruthy();
    expect(await vtt.text()).toMatch(/^WEBVTT\n/);
    await expect(card.locator('.video-lang')).toHaveText(label);
    await expect(card.locator('.video-lang')).toHaveAttribute('lang', lang);
    // Only the Spanish parts are marked Spanish; the card's service label stays in the page language.
    if (lang === 'en') await expect(card.locator('video')).not.toHaveAttribute('lang', /.+/);
    else await expect(card.locator('video')).toHaveAttribute('lang', lang);
    await expect(card).not.toHaveAttribute('lang', /.+/);
    const decorations = await card.evaluate((el) => [getComputedStyle(el, '::before').display, getComputedStyle(el, '::after').display]);
    expect(decorations).toEqual(['none', 'none']);
  }
});

for (const { route, id, lang, label, aria } of [
  { route: '/', id: 'crew-promo-2026-en', lang: 'en', label: 'English', aria: 'Meet the Hernandez Landscape crew' },
  { route: '/es/', id: 'crew-promo-2026-es', lang: 'es', label: 'Español', aria: 'Conozca al equipo de Hernandez Landscape' },
] as const) {
  test(`${route} opens its video strip with the ${label} promo cut and captions`, async ({ page, request }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const card = page.locator('.video-strip .video-card').first();
    await expect(card.locator('video')).toHaveAttribute('aria-label', aria);
    await expect(card.locator('source')).toHaveAttribute('src', new RegExp(`${id}\\.mp4$`));
    const track = card.locator('track[kind="captions"]');
    await expect(track).toHaveAttribute('srclang', lang);
    await expect(track).toHaveAttribute('label', label);
    const vtt = await request.get(new URL((await track.getAttribute('src'))!, page.url()).pathname);
    expect(vtt.ok()).toBeTruthy();
    // No English-only data-es-* leftovers on the built Spanish page.
    expect(await card.evaluate((el) => el.outerHTML.includes('data-es-'))).toBe(route === '/');
  });
}

test('/videos/ structured data lists both promo cuts as parts of the page', async ({ page }) => {
  await page.goto('/videos/', { waitUntil: 'domcontentloaded' });
  const graph = (await page.locator('script[type="application/ld+json"]').allTextContents())
    .flatMap((b) => JSON.parse(b)['@graph'] ?? [JSON.parse(b)]);
  const collection = graph.find((n: Record<string, any>) => n['@type'] === 'CollectionPage');
  const parts = (collection.hasPart as Array<{ '@id': string }>).map((p) => p['@id']);
  for (const { id, lang } of PROMOS) {
    const node = graph.find((n: Record<string, any>) => n['@id']?.endsWith(`#${id}`));
    expect(node, id).toBeTruthy();
    expect(node.inLanguage).toBe(lang);
    expect(node.contentUrl).toMatch(new RegExp(`/${mediaItem(id).src}$`));
    expect(parts).toContain(node['@id']);
  }
});
