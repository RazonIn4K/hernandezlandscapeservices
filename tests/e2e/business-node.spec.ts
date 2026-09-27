import { expect, test } from './fixtures';

// Round 6 (research 06 C1/C2/C3; 08 low): every page with JSON-LD defines the one
// business entity (@id /#organization) with the home node's hours, geo, sameAs and
// six towns, generated from schema.jsonld by scripts/business-node.mjs. No ratings.

const ORG = 'https://hernandezlandscapeservices.com/#organization';
const TOWNS = ['DeKalb', 'Sycamore', 'Cortland', 'Malta', 'Genoa', 'Kingston'];
const PAGES = ['/', '/es/', '/tree-removal/', '/es/snow-removal/', '/gutter-cleaning/', '/service-areas/', '/service-areas/genoa-il/',
  '/es/service-areas/', '/es/service-areas/dekalb-il/', '/gallery/', '/videos/'];

type Node = Record<string, any>;
const nodesIn = (value: unknown, out: Node[] = []): Node[] => {
  if (Array.isArray(value)) value.forEach((v) => nodesIn(v, out));
  else if (value && typeof value === 'object') {
    out.push(value as Node);
    Object.values(value).forEach((v) => nodesIn(v, out));
  }
  return out;
};

test('every page defines the one business node from the home page', async ({ page, request }) => {
  const home = JSON.parse(await (await request.get('/schema.jsonld')).text());
  const source = home['@graph'].find((n: Node) => n['@id'] === ORG);
  for (const path of PAGES) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = nodesIn(blocks.map((b) => JSON.parse(b)));
    const org = nodes.find((n) => n['@id'] === ORG && Object.keys(n).length > 1);
    expect(org, path).toBeDefined();
    expect(org!['@type'], path).toBe('HomeAndConstructionBusiness');
    for (const key of ['name', 'telephone', 'address', 'geo', 'openingHoursSpecification', 'sameAs', 'areaServed', 'priceRange']) {
      expect(org![key], `${path} ${key}`).toEqual(source[key]);
    }
    expect(org!.areaServed.map((a: Node) => a.name), path).toEqual(TOWNS);
    expect(nodes.some((n) => 'aggregateRating' in n || 'review' in n), path).toBe(false);
  }
});
