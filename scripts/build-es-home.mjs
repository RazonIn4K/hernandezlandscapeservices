#!/usr/bin/env node
// Builds the Spanish home (es/index.html) from the English home (index.html) and
// the Spanish dictionary in assets/js/i18n.js (round 4; research 03 R5, 05 X3).
//
// Same chapters, same request forms (endpoint, field names, hidden fields and
// scripts), so a Spanish lead reaches the owner exactly like an English one. What
// changes: the words (every data-i18n-* key), the head metadata, the shared
// Spanish header, page links (Spanish twins where they exist) and asset paths
// (rooted, because the page lives one folder down).
//
// Edit index.html or i18n.js, then run `node scripts/build-es-home.mjs`.
// `--check` fails if es/index.html is out of date (runs in test:ci).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { renderSiteHeader, altFor, TWINS } from './site-header.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const OUT = path.join(ROOT, 'es', 'index.html');

const fail = (message) => {
  console.error(`build-es-home: ${message}`);
  process.exit(1);
};

// ---- Dictionary (the object literal in i18n.js is plain data) ----
const i18n = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'i18n.js'), 'utf8');
const dictStart = i18n.indexOf('const translations = {');
const dictEnd = i18n.indexOf('\n  };', dictStart);
if (dictStart < 0 || dictEnd < 0) fail('cannot find the translations object in assets/js/i18n.js');
const dictionary = vm.runInNewContext(`(${i18n.slice(dictStart + 'const translations = '.length, dictEnd + 4)})`);
const es = (key) => {
  const value = dictionary.es[key];
  if (typeof value !== 'string') fail(`no Spanish for "${key}" (add it to assets/js/i18n.js)`);
  return value;
};

// ---- Head metadata for /es/ (unchanged from the hand-written Spanish page) ----
const HEAD = `    <title>Paisajismo y retiro de árboles en DeKalb | Hernandez</title>
    <meta name="description" content="Servicios de paisajismo y retiro de árboles en DeKalb County. Cotización gratis. Llame al (815) 501-1478 — se habla español." />
    <meta name="robots" content="index, follow, max-image-preview:large" />

    <meta property="og:title" content="Paisajismo y retiro de árboles en DeKalb | Hernandez" />
    <meta property="og:description" content="Servicios de paisajismo y retiro de árboles en DeKalb County. Cotización gratis. Se habla español." />
    <meta property="og:image" content="https://hernandezlandscapeservices.com/hernandez_images/google-profile-2026-tree-climber-canopy.jpg" />
    <meta property="og:image:alt" content="Equipo de Hernandez Landscape trabajando en árboles en DeKalb County" />
    <meta property="og:url" content="https://hernandezlandscapeservices.com/es/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Hernandez Landscape & Tree Service LLC" />
    <meta property="og:locale" content="es_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Paisajismo y retiro de árboles en DeKalb | Hernandez" />
    <meta name="twitter:description" content="Paisajismo y retiro de árboles en DeKalb County. Cotización gratis al (815) 501-1478." />
    <meta name="twitter:image" content="https://hernandezlandscapeservices.com/hernandez_images/google-profile-2026-tree-climber-canopy.jpg" />
    <meta name="twitter:image:alt" content="Equipo de Hernandez Landscape trabajando en árboles en DeKalb County" />

    <link rel="canonical" href="https://hernandezlandscapeservices.com/es/" />
    <link rel="alternate" hreflang="en" href="https://hernandezlandscapeservices.com/" />
    <link rel="alternate" hreflang="es" href="https://hernandezlandscapeservices.com/es/" />
    <link rel="alternate" hreflang="x-default" href="https://hernandezlandscapeservices.com/" />
`;

const JSON_LD = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          "@id": "https://hernandezlandscapeservices.com/es/#service",
          "name": "Servicios de paisajismo y árboles",
          "inLanguage": "es",
          "provider": {
            "@type": "HomeAndConstructionBusiness",
            "name": "Hernandez Landscape & Tree Service LLC",
            "image": "https://hernandezlandscapeservices.com/hernandez_images/web_Logo_New_256.png",
            "telephone": "+1-815-501-1478",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "1029 Lewis St",
              "addressLocality": "DeKalb",
              "addressRegion": "IL",
              "postalCode": "60115",
              "addressCountry": "US"
            }
          },
          "areaServed": [
            { "@type": "City", "name": "DeKalb", "containedInPlace": { "@type": "State", "name": "Illinois" } },
            { "@type": "City", "name": "Sycamore", "containedInPlace": { "@type": "State", "name": "Illinois" } },
            { "@type": "City", "name": "Cortland", "containedInPlace": { "@type": "State", "name": "Illinois" } }
          ],
          "description": "Paisajismo, corte de pasto, poda y retiro de árboles en DeKalb County, IL."
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://hernandezlandscapeservices.com/es/#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Inicio (ES)", "item": "https://hernandezlandscapeservices.com/es/" }
          ]
        }
      ]
    }
    </script>`;

// ---- Helpers ----
const escAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const once = (html, from, to, label) => {
  const n = html.split(from).length - 1;
  if (n !== 1) fail(`${label}: expected one match in index.html, found ${n}`);
  return html.split(from).join(to);
};
const isRelative = (url) => url && !/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(url);
const rootUrl = (url) => (isRelative(url) ? `/${url}` : url);
const rootSrcset = (srcset) =>
  srcset
    .split(',')
    .map((part) => {
      const [url, ...descriptor] = part.trim().split(/\s+/);
      return [rootUrl(url), ...descriptor].join(' ');
    })
    .join(', ');

/** Page links: the Spanish twin where one exists, else the English page marked hreflang="en". */
function pageHref(href) {
  const url = rootUrl(href);
  if (!url.startsWith('/') || url.startsWith('//')) return { href: url };
  const [pathPart, rest = ''] = url.split(/(?=[?#])/);
  if (pathPart === '/' || pathPart === '/index.html') return { href: `/es/${rest}` };
  if (pathPart.startsWith('/es/')) return { href: url };
  if (TWINS.includes(pathPart)) return { href: `/es${pathPart}${rest}` };
  if (/\.(?:png|jpe?g|webp|gif|svg|ico|json|xml|pdf|mp4|css|js|woff2?)$/i.test(pathPart)) return { href: url };
  return { href: url, english: true };
}

const ATTR_RE = /([^\s=>\/]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
const TAG_RE = /<([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/y;

function parseAttrs(source) {
  const attrs = [];
  for (const m of source.matchAll(ATTR_RE)) {
    const raw = m[2];
    const value = raw === undefined ? null : raw.replace(/^["']|["']$/g, '');
    attrs.push({ name: m[1], value });
  }
  return attrs;
}

/** Rewrites one opening tag: translated attributes, rooted assets, Spanish page links. */
function rewriteTag(name, attrSource, selfClose) {
  const attrs = parseAttrs(attrSource);
  const get = (n) => attrs.find((a) => a.name === n);
  const set = (n, v) => {
    const a = get(n);
    if (a) a.value = v;
    else attrs.push({ name: n, value: v });
  };
  for (const [keyAttr, target] of [
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-title', 'title'],
    ['data-i18n-aria-label', 'aria-label'],
    ['data-i18n-alt', 'alt'],
  ]) {
    const key = get(keyAttr);
    if (key) set(target, es(key.value));
  }
  for (const n of ['src', 'data-poster', 'poster']) {
    const a = get(n);
    if (a && a.value !== null) a.value = rootUrl(a.value);
  }
  for (const n of ['srcset', 'imagesrcset']) {
    const a = get(n);
    if (a && a.value) a.value = rootSrcset(a.value);
  }
  if (name.toLowerCase() === 'a') {
    const a = get('href');
    if (a && a.value) {
      const mapped = pageHref(a.value);
      a.value = mapped.href;
      if (mapped.english && !get('hreflang')) attrs.push({ name: 'hreflang', value: 'en' });
    }
  }
  const out = attrs.map((a) => (a.value === null ? a.name : `${a.name}="${escAttr(decode(a.value))}"`)).join(' ');
  return `<${name}${out ? ' ' + out : ''}${selfClose ? ' /' : ''}>`;
}

// Attribute values are re-escaped on output, so decode the few entities the
// source uses first (keeps "&amp;" from becoming "&amp;amp;").
const decode = (value) =>
  value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Index just past the element that starts with the opening tag ending at `from`. */
function closeOf(html, name, from) {
  const open = new RegExp(`<${name}(?=[\\s>/])`, 'gi');
  const close = new RegExp(`</${name}\\s*>`, 'gi');
  let depth = 1;
  let pos = from;
  for (;;) {
    open.lastIndex = pos;
    close.lastIndex = pos;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) fail(`unclosed <${name}> near: ${html.slice(from - 80, from).trim()}`);
    if (o && o.index < c.index) {
      depth++;
      pos = o.index + 1;
      continue;
    }
    depth--;
    if (depth === 0) return { start: c.index, end: c.index + c[0].length };
    pos = c.index + 1;
  }
}

/** Walks the markup once: translates keyed elements and rewrites every opening tag. */
function translate(html) {
  let out = '';
  let pos = 0;
  let i = 0;
  while ((i = html.indexOf('<', pos)) !== -1) {
    out += html.slice(pos, i);
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i);
      out += html.slice(i, end + 3);
      pos = end + 3;
      continue;
    }
    TAG_RE.lastIndex = i;
    const m = TAG_RE.exec(html);
    if (!m) {
      out += '<';
      pos = i + 1;
      continue;
    }
    const [whole, name, attrSource, selfClose] = m;
    const tag = rewriteTag(name, attrSource, selfClose);
    pos = i + whole.length;
    const lower = name.toLowerCase();
    if (lower === 'script' || lower === 'style') {
      const end = html.indexOf(`</${lower}>`, pos);
      out += tag + html.slice(pos, end);
      pos = end;
      continue;
    }
    const key = parseAttrs(attrSource).find((a) => a.name === 'data-i18n-key');
    if (key) {
      const close = closeOf(html, name, pos);
      out += tag + es(key.value) + html.slice(close.start, close.end);
      pos = close.end;
      continue;
    }
    out += tag;
  }
  return out + html.slice(pos);
}

// ---- Build ----
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

html = once(html, '<!doctype html>\n<html lang="en">', '<!doctype html>\n<!-- Generated by scripts/build-es-home.mjs from index.html and assets/js/i18n.js. Do not edit by hand. -->\n<html lang="es">', 'doctype');

const headStart = html.indexOf('    <title>');
const headEnd = html.indexOf('    <!-- LCP hero');
if (headStart < 0 || headEnd < headStart) fail('head anchors (<title> … <!-- LCP hero) not found');
const head = html.slice(0, headStart) + HEAD + '\n' + html.slice(headEnd, html.indexOf('</head>') + '</head>'.length);
let body = html.slice(html.indexOf('</head>') + '</head>'.length);

const headerMatch = body.match(/^ {4}<header\b[\s\S]*?^ {4}<\/header>/m);
if (!headerMatch || !headerMatch[0].includes('id="header"')) fail('site header not found');
body = body.replace(headerMatch[0], '@@HEADER@@');

const ldStart = body.indexOf('    <script type="application/ld+json">');
const ldEnd = body.indexOf('</script>', ldStart);
if (ldStart < 0 || ldEnd < 0) fail('JSON-LD block not found');
body = body.slice(0, ldStart) + '@@JSONLD@@' + body.slice(ldEnd + '</script>'.length);

body = translate(body);
body = body
  .replace('@@HEADER@@', renderSiteHeader({ lang: 'es', alt: altFor('/es/'), quoteHref: '#quote' }))
  .replace('@@JSONLD@@', JSON_LD);

const next = translate(head) + body;

// Guard rails: nothing still pointing at the old in-place switch or at relative assets.
for (const [label, re] of [
  ['?lang=es link', /\?lang=es/],
  ['EN/ES toggle', /data-lang-switch/],
  ['relative asset path', /\s(?:src|srcset|data-poster|poster)="(?!\/|https?:|data:)/],
]) {
  if (re.test(next)) fail(`generated page still has a ${label}`);
}

const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (CHECK) {
  if (current !== next) fail('es/index.html is out of date. Run: node scripts/build-es-home.mjs');
  console.log('build-es-home --check: es/index.html in sync.');
} else {
  if (current !== next) fs.writeFileSync(OUT, next);
  console.log(`build-es-home: es/index.html ${current === next ? 'unchanged' : 'written'} (${Math.round(next.length / 1024)} KB).`);
}
