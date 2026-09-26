#!/usr/bin/env node
// Writes the shared header (scripts/site-header.mjs) into every static page that
// has one. Idempotent; `--check` fails if any page drifted (runs in test:ci).
// The homepage keeps its own hand-written copy (in-page anchors); the Spanish
// home (scripts/build-es-home.mjs) and town pages (scripts/generate_local_pages.js)
// render theirs from the same module.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSiteHeader, altFor } from './site-header.mjs';
import { withIconSprite } from './icons.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

// route -> options. quoteHref keeps each page's own "free quote" target.
const PAGES = {
  '/tree-removal/': { quoteHref: '/#quote' },
  '/emergency-tree-removal/': { quoteHref: '/#quote' },
  '/tree-trimming-stump-grinding/': { quoteHref: '/#quote' },
  '/lawn-care/': { quoteHref: '/#quote' },
  '/landscaping-design/': { quoteHref: '/#quote' },
  '/gutter-cleaning/': { quoteHref: '/#quote' },
  '/leaf-removal/': { quoteHref: '/#quote' },
  '/pressure-washing/': { quoteHref: '/#quote' },
  '/snow-removal/': { quoteHref: '/#quote' },
  '/service-areas/': { quoteHref: '/#quote', current: 'areas' },
  '/service-areas/dekalb-il/': { quoteHref: '/#quote' },
  '/service-areas/sycamore-il/': { quoteHref: '/#quote' },
  '/service-areas/cortland-il/': { quoteHref: '/#quote' },
  '/service-areas/malta-il/': { quoteHref: '/#quote' },
  '/service-areas/genoa-il/': { quoteHref: '/#quote' },
  '/service-areas/kingston-il/': { quoteHref: '/#quote' },
  '/gallery/': { quoteHref: '/#quote', current: 'work' },
  '/videos/': { quoteHref: '/#quote', current: 'videos' },
  // /es/ gets this header from scripts/build-es-home.mjs.
  '/es/tree-removal/': { quoteHref: '/es/?service=tree-service#quote' },
  '/es/emergency-tree-removal/': { quoteHref: '/es/?service=tree-service#quote' },
  '/es/tree-trimming-stump-grinding/': { quoteHref: '/es/?service=tree-service#quote' },
  '/es/lawn-care/': { quoteHref: '/es/?service=lawn-care#quote' },
  '/es/landscaping-design/': { quoteHref: '/es/?service=landscaping#quote' },
  '/es/snow-removal/': { quoteHref: '/es/?service=snow-removal#quote' },
  '/es/gutter-cleaning/': { quoteHref: '/es/?service=gutter-cleaning#quote' },
  '/es/pressure-washing/': { quoteHref: '/es/?service=pressure-washing#quote' },
  '/es/leaf-removal/': { quoteHref: '/es/?service=leaf-removal#quote' },
  '/es/service-areas/': { quoteHref: '/es/#quote', current: 'areas' },
};

export function headerFor(route) {
  const o = PAGES[route];
  return renderSiteHeader({ lang: route.startsWith('/es/') ? 'es' : 'en', alt: altFor(route), ...o });
}

const drifted = [];
for (const route of Object.keys(PAGES)) {
  const file = path.join(ROOT, route.replace(/^\//, ''), 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const start = html.search(/^[ \t]*<header\b/m);
  const end = html.indexOf('</header>', start);
  if (start < 0 || end < 0) throw new Error(`${route}: no <header> block`);
  const next = withIconSprite(html.slice(0, start) + headerFor(route) + html.slice(end + '</header>'.length));
  if (next === html) continue;
  drifted.push(route);
  if (!CHECK) fs.writeFileSync(file, next);
}
if (CHECK && drifted.length) {
  console.error(`apply-site-header --check: ${drifted.length} page(s) out of sync:\n  ${drifted.join('\n  ')}`);
  console.error('Run: node scripts/apply-site-header.mjs');
  process.exit(1);
}
console.log(`apply-site-header${CHECK ? ' --check' : ''}: ${Object.keys(PAGES).length} pages, ${drifted.length} ${CHECK ? 'drifted' : 'written'}.`);
