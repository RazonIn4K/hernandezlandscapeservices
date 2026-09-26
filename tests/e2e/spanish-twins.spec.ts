import { expect, test } from './fixtures';

// Round 6 (SEO, 07-serp §4; 06 C12/C13): every English service and area page has a
// Spanish twin: lang="es", Spanish title, self-canonical, reciprocal hreflang with
// x-default -> English, linked both ways, and listed in the sitemap.

const SITE = 'https://hernandezlandscapeservices.com';
const TWINS = [
  ['/snow-removal/', '/es/snow-removal/', 'Remoción de nieve en DeKalb, IL | Hernandez'],
  ['/gutter-cleaning/', '/es/gutter-cleaning/', 'Limpieza de canaletas en DeKalb, IL | Hernandez'],
  ['/pressure-washing/', '/es/pressure-washing/', 'Lavado a presión en DeKalb, IL | Hernandez'],
  ['/leaf-removal/', '/es/leaf-removal/', 'Recolección de hojas en DeKalb, IL | Hernandez'],
  ['/service-areas/', '/es/service-areas/', 'Áreas de servicio en el Condado de DeKalb | Hernandez'],
  ['/service-areas/dekalb-il/', '/es/service-areas/dekalb-il/', 'Jardinería y árboles en DeKalb, IL | Hernandez Landscape'],
] as const;

test('each Spanish twin is a proper pair of its English page', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const [en, es, title] of TWINS) {
    for (const [path, lang] of [[en, 'en'], [es, 'es']] as const) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html'), path).toHaveAttribute('lang', lang);
      await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute('href', `${SITE}${path}`);
      const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
        Object.fromEntries(links.map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])));
      expect(alternates, path).toEqual({ en: `${SITE}${en}`, es: `${SITE}${es}`, 'x-default': `${SITE}${en}` });
      const other = lang === 'en' ? es : en;
      await expect(page.locator('#header .lang-link').first(), path).toHaveAttribute('href', other);
      expect(sitemap, path).toContain(`<loc>${SITE}${path}</loc>`);
    }
    await page.goto(es, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(title);
    expect(title.length).toBeLessThanOrEqual(60);
    const h1 = (await page.locator('h1').textContent())!.trim();
    await page.goto(en, { waitUntil: 'domcontentloaded' });
    expect(h1, es).not.toBe((await page.locator('h1').textContent())!.trim());
  }
});

// 07-serp §4: Spanish service titles carry the place name; the H1s stay as they were.
test('Spanish lawn and trimming titles name DeKalb', async ({ page }) => {
  for (const [path, title, h1] of [
    ['/es/lawn-care/', 'Cuidado del césped y corte de pasto en DeKalb | Hernandez', 'Cuidado del césped en DeKalb, IL'],
    ['/es/tree-trimming-stump-grinding/', 'Poda de árboles y remoción de tocones en DeKalb | Hernandez', 'Poda de árboles y molienda de tocones en DeKalb County'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page, path).toHaveTitle(title);
    expect(title.length).toBeLessThanOrEqual(60);
    await expect(page.locator('meta[property="og:title"]'), path).toHaveAttribute('content', title);
    await expect(page.locator('meta[name="twitter:title"]'), path).toHaveAttribute('content', title);
    await expect(page.locator('h1'), path).toHaveText(h1);
  }
});

test('the Spanish nav and hub reach every Spanish area and service page', async ({ page }) => {
  await page.goto('/es/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#header .desktop-nav a', { hasText: 'Zonas de servicio' })).toHaveAttribute('href', '/es/service-areas/');
  await page.goto('/es/service-areas/', { waitUntil: 'domcontentloaded' });
  const links = await page.locator('main a[href]').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  for (const href of ['/es/service-areas/dekalb-il/', '/es/service-areas/sycamore-il/', '/es/service-areas/cortland-il/', '/es/service-areas/malta-il/', '/es/service-areas/genoa-il/', '/es/service-areas/kingston-il/',
    '/es/lawn-care/', '/es/tree-removal/', '/es/landscaping-design/', '/es/snow-removal/', '/es/leaf-removal/', '/es/gutter-cleaning/', '/es/pressure-washing/']) {
    expect(links, href).toContain(href);
  }
  // Six confirmed towns only.
  const towns = await page.locator('main h3').allTextContents();
  expect(towns.map((t) => t.trim())).toEqual(['DeKalb, IL', 'Sycamore, IL', 'Cortland, IL', 'Malta, IL', 'Genoa, IL', 'Kingston, IL']);
});
