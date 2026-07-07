#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ORIGIN = 'https://hernandezlandscapeservices.com';
const EXCLUDED_DIRS = new Set([
  '.claude',
  '.git',
  '_media-archive',
  'node_modules',
  'playwright-report',
  'publish',
  'test-results',
  'tmp',
]);
// privacy/terms are utility pages; gallery.html/videos.html are meta-refresh
// redirect stubs for the old .html routes (canonical points at /gallery/ and
// /videos/) — none of them need the full OG/Twitter card set.
const UTILITY_INDEXABLE = new Set(['privacy.html', 'terms.html', 'gallery.html', 'videos.html']);
const BANNED_EXTERNAL_LINKS = [
  {
    label: 'incorrect Yelp entity link',
    pattern: /yelp\.com\/biz\/hernandez-lawn-care-chicago/i,
  },
];

// SERP display limits (measured on entity-decoded text).
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 70;
const DESCRIPTION_MAX_LENGTH = 155;

// Standard favicon/manifest head block — the exact asset set index.html ships.
// Every shipped page must reference all of these (P1-8).
const FAVICON_REQUIREMENTS = [
  { label: 'favicon.ico icon link', pattern: /<link\b[^>]*rel=["']icon["'][^>]*href=["']\/favicon\.ico["'][^>]*>/i },
  { label: 'favicon-32x32.png icon link', pattern: /<link\b[^>]*rel=["']icon["'][^>]*href=["']\/favicon-32x32\.png["'][^>]*>/i },
  { label: 'favicon-16x16.png icon link', pattern: /<link\b[^>]*rel=["']icon["'][^>]*href=["']\/favicon-16x16\.png["'][^>]*>/i },
  { label: 'apple-touch-icon link', pattern: /<link\b[^>]*rel=["']apple-touch-icon["'][^>]*href=["']\/apple-touch-icon\.png["'][^>]*>/i },
  { label: 'manifest link', pattern: /<link\b[^>]*rel=["']manifest["'][^>]*href=["']\/manifest\.json["'][^>]*>/i },
  { label: 'theme-color meta', pattern: /<meta\b[^>]*name=["']theme-color["'][^>]*>/i },
];

// Placeholder-href lint (P1-10): hrefs must never ship placeholder values.
const PLACEHOLDER_HREF_PATTERN = /YOUR_|PLACEHOLDER|g\.page\/r\/YOUR|\{\{/i;
// ============================================================================
// LOUD EXCEPTION — remove when B-1 lands (SEO_AUDIT_PLAN.md "Blocked on owner").
// card.html's printed-QR "Reviews" button still carries the literal
// https://g.page/r/YOUR_GOOGLE_REVIEW_LINK placeholder because the owner has
// not yet provided the real Google Business Profile review short-link (B-1).
// The exception below allows EXACTLY that one href, ONLY in card.html, and
// ONLY while the anchoring "TODO(B-1)" comment sits directly above it.
// When B-1 lands: replace the href in card.html, delete its TODO(B-1)
// comment, and delete this exception so the lint guards card.html again.
// ============================================================================
const PLACEHOLDER_HREF_EXCEPTIONS = [
  {
    file: 'card.html',
    href: 'https://g.page/r/YOUR_GOOGLE_REVIEW_LINK',
    anchorComment: 'TODO(B-1)',
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

// Decode the handful of entities used in this repo so length checks measure
// rendered characters (e.g. "&amp;" counts as 1), matching what SERPs show.
function decodeEntities(text) {
  return text
    .replace(/&amp;|&#38;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

function checkPlaceholderHrefs(relPath, html) {
  const lines = html.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const match of lines[i].matchAll(/href=["']([^"']*)["']/gi)) {
      const href = match[1];
      if (!PLACEHOLDER_HREF_PATTERN.test(href)) continue;

      const exception = PLACEHOLDER_HREF_EXCEPTIONS.find(
        (entry) => entry.file === relPath && entry.href === href,
      );
      if (exception) {
        // The exception only holds while its TODO comment is anchored within
        // the 5 lines directly above the placeholder href.
        const context = lines.slice(Math.max(0, i - 5), i).join('\n');
        if (context.includes(exception.anchorComment)) {
          warn(`${relPath}:${i + 1}: placeholder href allowed by documented ${exception.anchorComment} exception (pending B-1): ${href}`);
          continue;
        }
      }
      fail(`${relPath}:${i + 1}: placeholder href must not ship: ${href}`);
    }
  }
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
  if (title && decodeEntities(title).length > TITLE_MAX_LENGTH) {
    fail(`${relPath}: title is ${decodeEntities(title).length} characters (max ${TITLE_MAX_LENGTH})`);
  }
  if (h1Count !== 1) fail(`${relPath}: expected exactly one <h1>, found ${h1Count}`);

  for (const requirement of FAVICON_REQUIREMENTS) {
    if (!requirement.pattern.test(html)) {
      fail(`${relPath}: missing ${requirement.label} (standard favicon head block)`);
    }
  }

  checkPlaceholderHrefs(relPath, html);

  if (canonical && !canonical.startsWith(`${SITE_ORIGIN}/`)) {
    fail(`${relPath}: canonical must be an absolute ${SITE_ORIGIN} URL`);
  }

  if (isNoindex) {
    if (!robots) fail(`${relPath}: noindex page is missing robots meta`);
    if (canonical) noindexCanonicals.set(canonical, relPath);
  } else {
    if (!description) fail(`${relPath}: indexable page is missing meta description`);
    if (!canonical) fail(`${relPath}: indexable page is missing canonical link`);
    if (description) {
      const decodedLength = decodeEntities(description).length;
      if (decodedLength < DESCRIPTION_MIN_LENGTH || decodedLength > DESCRIPTION_MAX_LENGTH) {
        fail(`${relPath}: meta description is ${decodedLength} characters (must be ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH})`);
      }
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
