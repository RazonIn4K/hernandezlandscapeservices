#!/usr/bin/env node
/**
 * Build the GitHub Pages publish directory from public runtime files only.
 *
 * The repo contains source docs, tests, scripts, raw media folders, and older
 * unreferenced media. GitHub Pages should publish the website, not the whole
 * working tree.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'publish');

const ROOT_FILES = [
  '404.html',
  '4860d66f-e230-4e8a-9a96-adb5aba6b220.txt',
  'CNAME',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'card.html',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico',
  'gallery.html',
  'googlee573592846ba27d6.html',
  'index.html',
  'manifest.json',
  'pricing.html',
  'privacy.html',
  'qr-stickers-print.html',
  'robots.txt',
  'schema.jsonld',
  'sitemap.xml',
  'sw.js',
  'terms.html',
  'videos.html',
];

const DIRECTORIES = [
  'assets',
  'es',
  'gallery',
  'gutter-cleaning',
  'landscaping-design',
  'lawn-care',
  'leaf-removal',
  'pay',
  'pressure-washing',
  'service-areas',
  'snow-removal',
  'tree-removal',
  'videos',
];

const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

const MEDIA_REF_PATTERN =
  /(?:https?:\/\/[^"'()\s]+\/)?(?:\.\.\/)*hernandez_images\/[A-Za-z0-9._~%+@/-]+/g;

const runtimeFiles = [];
const copiedMedia = new Set();

const shouldSkip = (name) => name === '.DS_Store' || name.startsWith('.');

const FORBIDDEN_PUBLISH_BASENAMES = new Set([
  'credentials.json',
  'firebase-config.js',
  'service-account.json',
]);
const FORBIDDEN_PUBLISH_EXTENSIONS = new Set([
  '.key',
  '.log',
  '.map',
  '.pem',
]);

const assertSafePublishPath = (relPath) => {
  const base = path.basename(relPath).toLowerCase();
  const ext = path.extname(base);
  if (
    FORBIDDEN_PUBLISH_BASENAMES.has(base) ||
    FORBIDDEN_PUBLISH_EXTENSIONS.has(ext) ||
    base === '.env' ||
    base.startsWith('.env.')
  ) {
    throw new Error(`Refusing to publish sensitive or development-only file: ${relPath}`);
  }
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const copyFile = (relPath, { required = false } = {}) => {
  assertSafePublishPath(relPath);
  const src = path.join(ROOT, relPath);
  const dest = path.join(OUT_DIR, relPath);
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
    if (required) throw new Error(`Required publish file is missing: ${relPath}`);
    return false;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  runtimeFiles.push(relPath);
  return true;
};

const copyDir = (relDir) => {
  const srcDir = path.join(ROOT, relDir);
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) return;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldSkip(entry.name)) continue;

    const relPath = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(relPath);
    } else if (entry.isFile()) {
      copyFile(relPath);
    }
  }
};

const normalizeMediaRef = (ref) => {
  const withoutOrigin = ref.replace(/^https?:\/\/[^/]+\//, '');
  return withoutOrigin.replace(/^(?:\.\.\/)+/, '');
};

const collectMediaRefs = () => {
  const refs = new Set();

  for (const relPath of runtimeFiles) {
    const ext = path.extname(relPath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;

    const srcPath = path.join(ROOT, relPath);
    const text = fs.readFileSync(srcPath, 'utf8');
    for (const match of text.matchAll(MEDIA_REF_PATTERN)) {
      refs.add(normalizeMediaRef(match[0]));
    }
  }

  return refs;
};

const copyReferencedMedia = (refs) => {
  for (const relPath of [...refs].sort()) {
    const src = path.join(ROOT, relPath);
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
      throw new Error(`Referenced media file is missing: ${relPath}`);
    }

    const dest = path.join(OUT_DIR, relPath);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    copiedMedia.add(relPath);
  }
};

const SECRET_PATTERNS = [
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['cloud service-account private key', /["']private_key["']\s*:/i],
  ['server-only credential assignment', /(?:TELEGRAM_BOT_TOKEN|N8N_WEBHOOK_URL|ADMIN_PHONE_ALLOWLIST)\s*[:=]/i],
  ['server credential file path', /(?:secrets\.env|service-account\.json)/i],
];

const scanPublishedTextForSecrets = () => {
  for (const relPath of runtimeFiles) {
    if (!TEXT_EXTENSIONS.has(path.extname(relPath).toLowerCase())) continue;
    const text = fs.readFileSync(path.join(OUT_DIR, relPath), 'utf8');
    for (const [label, pattern] of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        throw new Error(`Publish secret scan found ${label} in ${relPath}`);
      }
    }
  }
};

fs.rmSync(OUT_DIR, { recursive: true, force: true });
ensureDir(OUT_DIR);

for (const relPath of ROOT_FILES) {
  copyFile(relPath, { required: true });
}

for (const relDir of DIRECTORIES) {
  copyDir(relDir);
}

copyReferencedMedia(collectMediaRefs());
scanPublishedTextForSecrets();

console.log(`Prepared publish directory: ${path.relative(ROOT, OUT_DIR)}`);
console.log(`  Runtime files copied: ${runtimeFiles.length}`);
console.log(`  Referenced media copied: ${copiedMedia.size}`);
