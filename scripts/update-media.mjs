#!/usr/bin/env node
/**
 * update-media.mjs — regenerate every gallery/media surface from media/gallery.json.
 *
 * Usage: npm run media:update   (or: node scripts/update-media.mjs)
 *
 * media/gallery.json is the single source of truth for gallery/carousel/video
 * media. This script:
 *   1. validates the manifest (required fields, files exist on disk, surface
 *      lists reference real items of the right type);
 *   2. regenerates, between explicit START/END markers:
 *        - the photo cards in gallery.html        (GALLERY:GENERATED)
 *        - the video cards in videos.html         (VIDEOS:GENERATED)
 *        - the staticImages array in assets/js/static-gallery.js
 *                                                 (GALLERY-DATA:GENERATED)
 *        - the gallery <image:image> entries and the videos <video:video>
 *          entries in sitemap.xml                 (GALLERY-IMAGES / GALLERY-VIDEOS)
 *   3. leaves everything outside the markers byte-for-byte untouched (page
 *      entries in sitemap.xml are owned by hand / other tooling).
 *
 * The script is idempotent: running it twice produces zero diff. It is
 * build-time generation into committed HTML (not runtime JS rendering), so
 * crawlers see the full markup. Requires Node 18+; no dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'media', 'gallery.json');

const MARKERS = {
  galleryPage: { start: '<!-- GALLERY:GENERATED:START -->', end: '<!-- GALLERY:GENERATED:END -->' },
  videosPage: { start: '<!-- VIDEOS:GENERATED:START -->', end: '<!-- VIDEOS:GENERATED:END -->' },
  homeGallery: { start: '// GALLERY-DATA:GENERATED:START', end: '// GALLERY-DATA:GENERATED:END' },
  sitemapImages: { start: '<!-- GALLERY-IMAGES:GENERATED:START -->', end: '<!-- GALLERY-IMAGES:GENERATED:END -->' },
  sitemapVideos: { start: '<!-- GALLERY-VIDEOS:GENERATED:START -->', end: '<!-- GALLERY-VIDEOS:GENERATED:END -->' },
};

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---------------------------------------------------------------------------
// Load + validate manifest
// ---------------------------------------------------------------------------

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`media/gallery.json not found at ${MANIFEST_PATH}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`media/gallery.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

const baseUrl = typeof manifest.baseUrl === 'string' ? manifest.baseUrl.replace(/\/+$/, '') : '';
if (!baseUrl) fail('manifest: "baseUrl" is required (e.g. "https://hernandezlandscapeservices.com")');

const items = Array.isArray(manifest.items) ? manifest.items : null;
if (!items) fail('manifest: "items" must be an array');

const byId = new Map();
for (const item of items ?? []) {
  const label = item?.id ? `item "${item.id}"` : `item ${JSON.stringify(item).slice(0, 60)}...`;
  if (!item || typeof item !== 'object') {
    fail('manifest: every entry in "items" must be an object');
    continue;
  }
  if (!item.id || typeof item.id !== 'string') {
    fail(`${label}: "id" (non-empty string) is required`);
    continue;
  }
  if (byId.has(item.id)) {
    fail(`item "${item.id}": duplicate id`);
    continue;
  }
  if (item.type !== 'image' && item.type !== 'video') {
    fail(`${label}: "type" must be "image" or "video"`);
  }
  if (!item.src || typeof item.src !== 'string') {
    fail(`${label}: "src" is required`);
  } else {
    if (!item.src.startsWith('hernandez_images/')) {
      fail(`${label}: "src" must live under hernandez_images/ (got "${item.src}")`);
    }
    if (!fs.existsSync(path.join(ROOT, item.src))) {
      fail(`${label}: src file does not exist on disk: ${item.src}`);
    }
  }
  if (item.type === 'image' && (!item.alt || typeof item.alt !== 'string')) {
    fail(`${label}: images require "alt" text`);
  }
  if (item.type === 'video') {
    if (!item.poster || typeof item.poster !== 'string') {
      fail(`${label}: videos require a "poster" image path`);
    } else if (!fs.existsSync(path.join(ROOT, item.poster))) {
      fail(`${label}: poster file does not exist on disk: ${item.poster}`);
    }
  }
  byId.set(item.id, item);
}

const surfaces = manifest.surfaces && typeof manifest.surfaces === 'object' ? manifest.surfaces : null;
if (!surfaces) fail('manifest: "surfaces" object is required');

const resolveSurface = (name, expectedType) => {
  const list = surfaces?.[name];
  if (!Array.isArray(list)) {
    fail(`surfaces.${name}: must be an array of item ids`);
    return [];
  }
  const resolved = [];
  for (const id of list) {
    const item = byId.get(id);
    if (!item) {
      fail(`surfaces.${name}: unknown item id "${id}"`);
      continue;
    }
    if (item.type !== expectedType) {
      fail(`surfaces.${name}: item "${id}" is a ${item.type}, expected ${expectedType}`);
      continue;
    }
    resolved.push(item);
  }
  return resolved;
};

const galleryPageItems = resolveSurface('galleryPage', 'image');
const homeGalleryItems = resolveSurface('homeGallery', 'image');
const videosPageItems = resolveSurface('videosPage', 'video');
const sitemapImageItems = resolveSurface('sitemapGalleryImages', 'image');
const sitemapVideoItems = resolveSurface('sitemapVideos', 'video');

for (const item of galleryPageItems) {
  if (!item.gallery || (!item.gallery.title && !item.gallery.titleKey)) {
    fail(`item "${item.id}": used on galleryPage but has no gallery.title`);
  }
}
for (const item of homeGalleryItems) {
  if (!item.caption || typeof item.caption !== 'string') {
    fail(`item "${item.id}": used on homeGallery but has no "caption"`);
  }
}
for (const item of sitemapImageItems) {
  if (!item.sitemap?.title || !item.sitemap?.caption) {
    fail(`item "${item.id}": listed in sitemapGalleryImages but sitemap.title/sitemap.caption missing`);
  }
}
for (const item of sitemapVideoItems) {
  if (!item.sitemap?.title || !item.sitemap?.description || !item.sitemap?.publicationDate) {
    fail(`item "${item.id}": listed in sitemapVideos but sitemap.title/description/publicationDate missing`);
  }
}

const referenced = new Set(
  ['galleryPage', 'homeGallery', 'videosPage', 'sitemapGalleryImages', 'sitemapVideos']
    .flatMap((name) => (Array.isArray(surfaces?.[name]) ? surfaces[name] : []))
);
for (const id of byId.keys()) {
  if (!referenced.has(id)) warn(`item "${id}" is not referenced by any surface`);
}

if (errors.length) {
  console.error(`media/gallery.json failed validation with ${errors.length} error(s):`);
  for (const msg of errors) console.error(`  - ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Escaping helpers
// ---------------------------------------------------------------------------

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeXml = escapeHtml;

const escapeJs = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');

const absUrl = (relPath) => `${baseUrl}/${relPath}`;

// ---------------------------------------------------------------------------
// Generators (formatting intentionally mirrors the previous hand-written markup
// so the rendered pages do not change for visitors)
// ---------------------------------------------------------------------------

function renderGalleryCards(list) {
  const cards = list.map((item, index) => {
    const loading = index < 5 ? 'eager' : 'lazy';
    const alt = item.gallery?.alt ?? item.alt;
    const keyAttr = item.gallery?.titleKey ? ` data-i18n-key="${escapeHtml(item.gallery.titleKey)}"` : '';
    const title = item.gallery?.title ?? '';
    return [
      '                <div class="gallery-item group">',
      `                    <img src="${escapeHtml(item.src)}" loading="${loading}" alt="${escapeHtml(alt)}" class="">`,
      '                    <div class="gallery-overlay">',
      '                        <div class="text-center p-4">',
      `                            <h3${keyAttr}>${escapeHtml(title)}</h3>`,
      '                        </div>',
      '                    </div>',
      '                </div>',
    ].join('\n');
  });
  return cards.join('\n\n');
}

function renderVideoCards(list) {
  const cards = list.map((item) => [
    '                <div class="video-card group">',
    '                    <div class="video-wrapper relative">',
    `                        <video controls preload="none" poster="${escapeHtml(item.poster)}" class="w-full h-full object-cover">`,
    `                            <source src="${escapeHtml(item.src)}" type="video/mp4">`,
    '                            Your browser does not support the video tag.',
    '                        </video>',
    '                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300 bg-black bg-opacity-20">',
    '                            <i class="fas fa-play-circle text-white text-5xl opacity-80"></i>',
    '                        </div>',
    '                    </div>',
    '                </div>',
  ].join('\n'));
  return cards.join('\n\n');
}

function renderStaticImagesArray(list) {
  const objects = list.map((item) => [
    '      {',
    `        src: '${escapeJs(item.src)}',`,
    `        alt: '${escapeJs(item.alt)}',`,
    `        caption: '${escapeJs(item.caption)}'`,
    '      }',
  ].join('\n'));
  return objects.join(',\n');
}

function renderSitemapImages(list) {
  const entries = list.map((item) => [
    '    <image:image>',
    `      <image:loc>${escapeXml(absUrl(item.src))}</image:loc>`,
    `      <image:title>${escapeXml(item.sitemap.title)}</image:title>`,
    `      <image:caption>${escapeXml(item.sitemap.caption)}</image:caption>`,
    '    </image:image>',
  ].join('\n'));
  return entries.join('\n');
}

function renderSitemapVideos(list) {
  const entries = list.map((item) => [
    '    <video:video>',
    `      <video:thumbnail_loc>${escapeXml(absUrl(item.poster))}</video:thumbnail_loc>`,
    `      <video:title>${escapeXml(item.sitemap.title)}</video:title>`,
    `      <video:description>${escapeXml(item.sitemap.description)}</video:description>`,
    `      <video:content_loc>${escapeXml(absUrl(item.src))}</video:content_loc>`,
    `      <video:publication_date>${escapeXml(item.sitemap.publicationDate)}</video:publication_date>`,
    '      <video:family_friendly>yes</video:family_friendly>',
    '    </video:video>',
  ].join('\n'));
  return entries.join('\n');
}

// ---------------------------------------------------------------------------
// Marker splicing
// ---------------------------------------------------------------------------

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

function spliceBetweenMarkers(content, marker, body, file) {
  for (const m of [marker.start, marker.end]) {
    const n = countOccurrences(content, m);
    if (n !== 1) {
      fail(`${file}: expected exactly one "${m}" marker, found ${n}`);
      return content;
    }
  }
  const startEnd = content.indexOf(marker.start) + marker.start.length;
  const endIdx = content.indexOf(marker.end);
  if (endIdx < startEnd) {
    fail(`${file}: "${marker.end}" appears before "${marker.start}"`);
    return content;
  }
  // Keep the END marker's own line indentation: cut at the start of its line.
  const endLineStart = content.lastIndexOf('\n', endIdx) + 1;
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const normalizedBody = body.replace(/\n/g, eol);
  return content.slice(0, startEnd) + eol + normalizedBody + eol + content.slice(endLineStart);
}

function updateFile(relPath, transforms) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    fail(`${relPath}: file not found`);
    return;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;
  for (const { marker, body } of transforms) {
    updated = spliceBetweenMarkers(updated, marker, body, relPath);
  }
  if (errors.length) return;
  if (updated === original) {
    console.log(`  ${relPath}: unchanged`);
  } else {
    fs.writeFileSync(filePath, updated);
    console.log(`  ${relPath}: updated`);
  }
}

console.log(
  `media/gallery.json: ${byId.size} items ` +
  `(${[...byId.values()].filter((i) => i.type === 'image').length} images, ` +
  `${[...byId.values()].filter((i) => i.type === 'video').length} videos)`
);

updateFile('gallery.html', [
  { marker: MARKERS.galleryPage, body: renderGalleryCards(galleryPageItems) },
]);
updateFile('videos.html', [
  { marker: MARKERS.videosPage, body: renderVideoCards(videosPageItems) },
]);
updateFile('assets/js/static-gallery.js', [
  { marker: MARKERS.homeGallery, body: renderStaticImagesArray(homeGalleryItems) },
]);
updateFile('sitemap.xml', [
  { marker: MARKERS.sitemapImages, body: renderSitemapImages(sitemapImageItems) },
  { marker: MARKERS.sitemapVideos, body: renderSitemapVideos(sitemapVideoItems) },
]);

if (errors.length) {
  console.error(`Failed with ${errors.length} error(s):`);
  for (const msg of errors) console.error(`  - ${msg}`);
  process.exit(1);
}
for (const msg of warnings) console.warn(`  warning: ${msg}`);
console.log('Done. Review the diff, then commit.');
