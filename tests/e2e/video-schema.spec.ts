import { expect, test } from './fixtures';

// Round 6 item 6 (research 06 C6): /videos/ is a gallery, not a watch page. Its
// VideoObject markup stays only while every item is complete (name, description,
// thumbnailUrl, uploadDate, contentUrl) and points at a video that is on the page.
// If an item loses a required property, drop the VideoObject markup from the gallery
// (per-video watch pages need owner titles and dates first).

test('/videos/ VideoObject items are complete and match the page', async ({ page }) => {
  await page.goto('/videos/', { waitUntil: 'domcontentloaded' });
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const graph = blocks.flatMap((b) => {
    const doc = JSON.parse(b);
    return doc['@graph'] ?? [doc];
  });
  const videos = graph.filter((n: Record<string, any>) => n['@type'] === 'VideoObject');
  expect(videos.length).toBeGreaterThan(0);
  const sources = await page.locator('video source[src], video[src]').evaluateAll((els) =>
    els.map((el) => new URL(el.getAttribute('src')!, location.href).pathname));
  for (const v of videos) {
    for (const key of ['name', 'description', 'thumbnailUrl', 'uploadDate', 'contentUrl']) {
      expect(v[key], `${v['@id']} ${key}`).toBeTruthy();
    }
    expect(v.uploadDate, v['@id']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sources, v['@id']).toContain(new URL(v.contentUrl).pathname);
  }
});
