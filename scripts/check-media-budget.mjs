#!/usr/bin/env node
/**
 * Check size budgets for media that is actually referenced by public site
 * surfaces. Raw/source files may still exist in hernandez_images, but this
 * guard focuses on assets visitors can reach through the manifest.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'media', 'gallery.json');

const KB = 1024;
const MB = 1024 * KB;

const BUDGETS = {
  image: 650 * KB,
  poster: 350 * KB,
  video: 40 * MB,
  homeGalleryTotal: 5 * MB,
  galleryPageImagesTotal: 7 * MB,
  videosPageTotal: 350 * MB,
};

const fmt = (bytes) => {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.round(bytes / KB)} KB`;
};

const readManifest = () => {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    console.error(`Unable to read ${MANIFEST_PATH}: ${error.message}`);
    process.exit(1);
  }
};

const sizeOf = (relPath) => fs.statSync(path.join(ROOT, relPath)).size;

const manifest = readManifest();
const items = Array.isArray(manifest.items) ? manifest.items : [];
const byId = new Map(items.map((item) => [item.id, item]));
const surfaces = manifest.surfaces ?? {};
const failures = [];

const fail = (message) => failures.push(message);

const surfaceItems = (name) => {
  const ids = Array.isArray(surfaces[name]) ? surfaces[name] : [];
  return ids.map((id) => byId.get(id)).filter(Boolean);
};

const checkFile = (label, relPath, limit) => {
  const size = sizeOf(relPath);
  if (size > limit) {
    fail(`${label}: ${relPath} is ${fmt(size)}; budget is ${fmt(limit)}`);
  }
  return size;
};

const referencedAssets = new Map();

for (const item of items) {
  const isReferenced = Object.values(surfaces)
    .filter(Array.isArray)
    .some((ids) => ids.includes(item.id));
  if (!isReferenced) continue;

  if (item.type === 'image') {
    referencedAssets.set(item.src, { type: 'image', relPath: item.src });
  }

  if (item.type === 'video') {
    referencedAssets.set(item.src, { type: 'video', relPath: item.src });
    if (item.poster) {
      referencedAssets.set(item.poster, { type: 'poster', relPath: item.poster });
    }
  }
}

for (const asset of referencedAssets.values()) {
  checkFile(asset.type, asset.relPath, BUDGETS[asset.type]);
}

// Round 4: right-sized WebP variants (hernandez_images/w/) and ~40 KB posters stay light.
const VARIANT_BUDGETS = { 480: 150 * KB, 800: 350 * KB, 1200: 500 * KB };
const POSTER_SMALL_BUDGET = 100 * KB;
const variantPath = (src, width) =>
  `hernandez_images/w/${path.basename(src).replace(/\.[^.]+$/, '')}-${width}.webp`;
let variantFiles = 0;
let smallPosterTotal = 0;
for (const item of items) {
  if (!Object.values(surfaces).filter(Array.isArray).some((ids) => ids.includes(item.id))) continue;
  for (const width of Array.isArray(item.variants) ? item.variants : []) {
    checkFile(`variant ${width}w`, variantPath(item.src, width), VARIANT_BUDGETS[width] ?? BUDGETS.image);
    variantFiles += 1;
  }
  if (item.posterSmall) smallPosterTotal += checkFile('posterSmall', item.posterSmall, POSTER_SMALL_BUDGET);
}

const homeGalleryTotal = surfaceItems('homeGallery')
  .filter((item) => item.type === 'image')
  .reduce((sum, item) => sum + sizeOf(item.src), 0);
if (homeGalleryTotal > BUDGETS.homeGalleryTotal) {
  fail(`homeGallery total is ${fmt(homeGalleryTotal)}; budget is ${fmt(BUDGETS.homeGalleryTotal)}`);
}

const galleryPageImagesTotal = surfaceItems('galleryPage')
  .filter((item) => item.type === 'image')
  .reduce((sum, item) => sum + sizeOf(item.src), 0);
if (galleryPageImagesTotal > BUDGETS.galleryPageImagesTotal) {
  fail(`galleryPage image total is ${fmt(galleryPageImagesTotal)}; budget is ${fmt(BUDGETS.galleryPageImagesTotal)}`);
}

const videosPageTotal = surfaceItems('videosPage')
  .filter((item) => item.type === 'video')
  .reduce((sum, item) => sum + sizeOf(item.src), 0);
if (videosPageTotal > BUDGETS.videosPageTotal) {
  fail(`videosPage video total is ${fmt(videosPageTotal)}; budget is ${fmt(BUDGETS.videosPageTotal)}`);
}

console.log(`Media budget: ${referencedAssets.size} referenced files checked`);
console.log(`  homeGallery images: ${fmt(homeGalleryTotal)} / ${fmt(BUDGETS.homeGalleryTotal)}`);
console.log(`  galleryPage images: ${fmt(galleryPageImagesTotal)} / ${fmt(BUDGETS.galleryPageImagesTotal)}`);
console.log(`  videosPage videos: ${fmt(videosPageTotal)} / ${fmt(BUDGETS.videosPageTotal)}`);
console.log(`  right-sized variants checked: ${variantFiles}; small posters total: ${fmt(smallPosterTotal)}`);

if (failures.length) {
  console.error(`Media budget failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('All referenced media files are within budget.');
