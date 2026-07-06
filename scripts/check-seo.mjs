#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ORIGIN = 'https://hernandezlandscapeservices.com';
const EXCLUDED_DIRS = new Set([
  '.git',
  '_media-archive',
  'node_modules',
  'playwright-report',
  'publish',
  'test-results',
  'tmp',
]);
const UTILITY_INDEXABLE = new Set(['privacy.html', 'terms.html']);
const BANNED_EXTERNAL_LINKS = [
  {
    label: 'incorrect Yelp entity link',
    pattern: /yelp\.com\/biz\/hernandez-lawn-care-chicago/i,
  },
];

const failures = [];
const warnings = [];

const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);

const read = (relPath) => fs.readFileSync(path.join(ROOT, relPath), 'utf8');

function walk(dir = ROOT) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...walk(path.join(dir, entry.name)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.relative(ROOT, path.join(dir, entry.name)));
    }
  }

  return files.sort();
}

function matchAttr(html, tagPattern, attrName) {
  const tag = html.match(tagPattern)?.[0];
  if (!tag) return '';
  const attr = tag.match(new RegExp(`${attrName}=["']([^"']+)["']`, 'i'));
  return attr?.[1]?.trim() ?? '';
}

function extractMeta(html, name) {
  return matchAttr(
    html,
    new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`, 'i'),
    'content',
  );
}

function extractProperty(html, property) {
  return matchAttr(
    html,
    new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']${property}["'])[^>]*>`, 'i'),
    'content',
  );
}

function extractCanonical(html) {
  return matchAttr(
    html,
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i,
    'href',
  );
}

function extractTitle(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
}

function isGoogleVerification(html) {
  return html.trim().startsWith('google-site-verification:');
}

function localPathForUrl(url) {
  if (!url.startsWith(`${SITE_ORIGIN}/`)) return '';
  return decodeURI(url.slice(SITE_ORIGIN.length + 1));
}

function fileExistsForPublicUrl(url) {
  const relPath = localPathForUrl(url);
  return relPath && fs.existsSync(path.join(ROOT, relPath));
}

const htmlFiles = walk();
const indexableCanonicals = new Map();
const noindexCanonicals = new Map();

for (const relPath of htmlFiles) {
  const html = read(relPath);
  if (isGoogleVerification(html)) continue;

  for (const bannedLink of BANNED_EXTERNAL_LINKS) {
    if (bannedLink.pattern.test(html)) {
      fail(`${relPath}: contains ${bannedLink.label}`);
    }
  }

  const title = extractTitle(html);
  const description = extractMeta(html, 'description');
  const robots = extractMeta(html, 'robots').toLowerCase();
  const canonical = extractCanonical(html);
  const isNoindex = robots.includes('noindex');
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;

  if (!title) fail(`${relPath}: missing <title>`);
  if (h1Count !== 1) fail(`${relPath}: expected exactly one <h1>, found ${h1Count}`);

  if (canonical && !canonical.startsWith(`${SITE_ORIGIN}/`)) {
    fail(`${relPath}: canonical must be an absolute ${SITE_ORIGIN} URL`);
  }

  if (isNoindex) {
    if (!robots) fail(`${relPath}: noindex page is missing robots meta`);
    if (canonical) noindexCanonicals.set(canonical, relPath);
  } else {
    if (!description) fail(`${relPath}: indexable page is missing meta description`);
    if (!canonical) fail(`${relPath}: indexable page is missing canonical link`);
    if (description && (description.length < 70 || description.length > 180)) {
      warn(`${relPath}: meta description length is ${description.length} characters`);
    }
    if (canonical) indexableCanonicals.set(canonical, relPath);

    if (!UTILITY_INDEXABLE.has(relPath)) {
      const ogTitle = extractProperty(html, 'og:title');
      const ogDescription = extractProperty(html, 'og:description');
      const ogImage = extractProperty(html, 'og:image');
      const ogImageAlt = extractProperty(html, 'og:image:alt');
      const ogUrl = extractProperty(html, 'og:url');
      const twitterCard = extractMeta(html, 'twitter:card');
      const twitterTitle = extractMeta(html, 'twitter:title');
      const twitterDescription = extractMeta(html, 'twitter:description');
      const twitterImage = extractMeta(html, 'twitter:image');
      const twitterImageAlt = extractMeta(html, 'twitter:image:alt');

      if (!ogTitle) fail(`${relPath}: missing og:title`);
      if (!ogDescription) fail(`${relPath}: missing og:description`);
      if (!ogImage) fail(`${relPath}: missing og:image`);
      if (!ogImageAlt) fail(`${relPath}: missing og:image:alt`);
      if (!ogUrl) fail(`${relPath}: missing og:url`);
      if (!twitterCard) fail(`${relPath}: missing twitter:card`);
      if (!twitterTitle) fail(`${relPath}: missing twitter:title`);
      if (!twitterDescription) fail(`${relPath}: missing twitter:description`);
      if (!twitterImage) fail(`${relPath}: missing twitter:image`);
      if (!twitterImageAlt) fail(`${relPath}: missing twitter:image:alt`);
      if (ogImage && !fileExistsForPublicUrl(ogImage)) {
        fail(`${relPath}: og:image does not map to a local public file: ${ogImage}`);
      }
      if (twitterImage && !fileExistsForPublicUrl(twitterImage)) {
        fail(`${relPath}: twitter:image does not map to a local public file: ${twitterImage}`);
      }
    }
  }

  const jsonLdBlocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [index, block] of jsonLdBlocks.entries()) {
    try {
      const data = JSON.parse(block[1].trim());
      if (data['@context'] !== 'https://schema.org') {
        fail(`${relPath}: JSON-LD block ${index + 1} is missing https://schema.org context`);
      }
    } catch (error) {
      fail(`${relPath}: JSON-LD block ${index + 1} is invalid JSON (${error.message})`);
    }
  }
}

const sitemap = read('sitemap.xml');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
for (const [canonical, relPath] of indexableCanonicals) {
  if (!sitemapUrls.has(canonical)) {
    fail(`${relPath}: indexable canonical is missing from sitemap.xml (${canonical})`);
  }
}
for (const [canonical, relPath] of noindexCanonicals) {
  if (sitemapUrls.has(canonical)) {
    fail(`${relPath}: noindex canonical is listed in sitemap.xml (${canonical})`);
  }
}

const robotsTxt = read('robots.txt');
if (!/Sitemap:\s*https:\/\/hernandezlandscapeservices\.com\/sitemap\.xml/i.test(robotsTxt)) {
  fail('robots.txt: missing absolute sitemap URL');
}

try {
  const schema = JSON.parse(read('schema.jsonld'));
  if (schema['@context'] !== 'https://schema.org') {
    fail('schema.jsonld: missing https://schema.org context');
  }
} catch (error) {
  fail(`schema.jsonld: invalid JSON (${error.message})`);
}

console.log(`SEO check: ${htmlFiles.length} HTML files scanned`);
console.log(`  indexable pages: ${indexableCanonicals.size}`);
console.log(`  noindex pages with canonical: ${noindexCanonicals.size}`);
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const message of warnings) console.warn(`  - ${message}`);
}
if (failures.length) {
  console.error(`SEO check failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}

console.log('SEO check passed.');
