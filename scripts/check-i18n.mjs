#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DICTIONARY = path.join(ROOT, 'assets', 'js', 'i18n.js');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'playwright-report', 'publish', 'test-results']);

const source = fs.readFileSync(DICTIONARY, 'utf8');
const esStart = source.indexOf('    es: {');
const esEnd = source.indexOf('\n    },\n  };', esStart);
if (esStart === -1 || esEnd === -1) {
  throw new Error('Unable to locate the Spanish translation object in assets/js/i18n.js');
}

const spanishKeys = new Set();
for (const match of source.slice(esStart, esEnd).matchAll(/^\s*"([^"]+)"\s*:/gm)) {
  spanishKeys.add(match[1]);
}

const htmlFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(absolute);
  }
};
walk(ROOT);

const references = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/data-i18n-(?:key|placeholder|title|aria-label)=["']([^"']+)["']/g)) {
    const locations = references.get(match[1]) || [];
    locations.push(path.relative(ROOT, file));
    references.set(match[1], locations);
  }
}

const javascriptReferences = [path.join(ROOT, 'assets', 'js', 'video-gallery.js')];
for (const file of javascriptReferences) {
  const javascript = fs.readFileSync(file, 'utf8');
  for (const match of javascript.matchAll(/siteI18n\.t\(["']([^"']+)["']/g)) {
    const locations = references.get(match[1]) || [];
    locations.push(path.relative(ROOT, file));
    references.set(match[1], locations);
  }
}

const missing = [...references.keys()].filter((key) => !spanishKeys.has(key)).sort();
if (missing.length) {
  console.error(`Spanish dictionary is missing ${missing.length} referenced key(s):`);
  for (const key of missing) {
    console.error(`  - ${key} (${[...new Set(references.get(key))].join(', ')})`);
  }
  process.exit(1);
}

console.log(`i18n check passed: ${references.size} referenced keys have Spanish translations.`);
