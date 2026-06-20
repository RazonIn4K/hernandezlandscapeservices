#!/usr/bin/env node
/**
 * Browser-check the generated publish artifact across public routes and common
 * viewport widths. This catches small utility-page overflow that the main e2e
 * suite may not exercise.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLISH_DIR = path.join(ROOT, 'publish');
const SITEMAP_PATH = path.join(PUBLISH_DIR, 'sitemap.xml');
const OUT_DIR = path.join(ROOT, 'test-results', 'publish-layout-sweep');

const EXTRA_ROUTES = [
  '/',
  '/card.html',
  '/pricing.html',
  '/pay/success.html',
  '/pay/cancel.html',
  '/privacy.html',
  '/terms.html',
  '/qr-stickers-print.html',
];

const VIEWPORTS = [
  ['xs320', { width: 320, height: 740 }],
  ['mobile390', { width: 390, height: 844 }],
  ['tablet768', { width: 768, height: 1024 }],
  ['desktop1440', { width: 1440, height: 1000 }],
];

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!fs.existsSync(PUBLISH_DIR)) {
  fail('publish/ is missing. Run npm run publish:prepare first.');
}

if (!fs.existsSync(SITEMAP_PATH)) {
  fail('publish/sitemap.xml is missing. Run npm run publish:prepare first.');
}

const contentTypeFor = (filePath) => MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';

const resolveRequestPath = (requestUrl) => {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const decodedPath = decodeURIComponent(url.pathname);
  let relPath = decodedPath.replace(/^\/+/, '');
  if (!relPath) relPath = 'index.html';

  let candidate = path.resolve(PUBLISH_DIR, relPath);
  if (!candidate.startsWith(PUBLISH_DIR)) return null;

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, 'index.html');
  }

  if (!fs.existsSync(candidate) && !path.extname(candidate)) {
    const htmlCandidate = `${candidate}.html`;
    if (fs.existsSync(htmlCandidate)) candidate = htmlCandidate;
  }

  if (!candidate.startsWith(PUBLISH_DIR) || !fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    return null;
  }

  return candidate;
};

const createStaticServer = () => {
  const server = http.createServer((req, res) => {
    const filePath = resolveRequestPath(req.url ?? '/');
    if (!filePath) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'content-type': contentTypeFor(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve static server port.'));
        return;
      }
      resolve({ server, baseURL: `http://127.0.0.1:${address.port}` });
    });
  });
};

const loadRoutes = () => {
  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const sitemapRoutes = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)]
    .map((match) => match[1] || '/')
    .map((route) => (route === '' ? '/' : route));

  return [...new Set([...sitemapRoutes, ...EXTRA_ROUTES])].sort((a, b) => a.localeCompare(b));
};

const inspectPage = async (page, baseURL) => page.evaluate((origin) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const doc = document.documentElement;
  const overflow = Math.max(doc.scrollWidth, document.body.scrollWidth) - width;
  const escaped = [];
  const ignoredTags = new Set(['HTML', 'BODY', 'SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'NOSCRIPT']);

  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (ignoredTags.has(el.tagName)) continue;

    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (style.position === 'fixed' && (el.id === 'mobileMenu' || el.id === 'mobile-menu')) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    if (rect.bottom < 0 || rect.top > height) continue;

    if (rect.left < -4 || rect.right > width + 4) {
      escaped.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        className: String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 5).join('.'),
        text: (el.innerText || el.alt || '').trim().slice(0, 80),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      });
      if (escaped.length >= 10) break;
    }
  }

  const brokenVisibleImages = Array.from(document.images)
    .filter((img) => (img.currentSrc || img.src || '').startsWith(origin))
    .filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= height && rect.width > 1 && rect.height > 1;
    })
    .filter((img) => img.complete && img.naturalWidth === 0)
    .map((img) => img.currentSrc || img.src || img.alt)
    .slice(0, 10);

  return {
    overflow,
    escaped,
    brokenVisibleImages,
    title: document.title,
  };
}, baseURL);

const run = async () => {
  const routes = loadRoutes();
  const { server, baseURL } = await createStaticServer();
  const browser = await chromium.launch();
  const failures = [];
  const summary = [];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  try {
    for (const [viewportName, viewport] of VIEWPORTS) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
      });

      for (const route of routes) {
        const page = await context.newPage();
        const badResponses = [];

        page.on('response', (response) => {
          const url = response.url();
          if (!url.startsWith(baseURL)) return;
          const status = response.status();
          if (status >= 400) badResponses.push(`${status} ${url.replace(baseURL, '')}`);
        });

        const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(250);

        const status = response ? response.status() : 0;
        const metrics = await inspectPage(page, baseURL);
        const label = `${viewportName} ${route}`;

        summary.push({
          route,
          viewportName,
          status,
          overflow: Math.round(metrics.overflow),
          escaped: metrics.escaped.length,
          brokenVisibleImages: metrics.brokenVisibleImages.length,
          badResponses: badResponses.length,
        });

        if (status >= 400) failures.push(`${label}: HTTP ${status}`);
        if (badResponses.length) failures.push(`${label}: bad responses ${badResponses.slice(0, 6).join(', ')}`);
        if (metrics.overflow > 4) failures.push(`${label}: horizontal overflow ${Math.round(metrics.overflow)}px`);
        if (metrics.escaped.length) failures.push(`${label}: visible viewport escape ${JSON.stringify(metrics.escaped)}`);
        if (metrics.brokenVisibleImages.length) {
          failures.push(`${label}: broken visible images ${metrics.brokenVisibleImages.join(', ')}`);
        }
        if (!metrics.title) failures.push(`${label}: missing document title`);

        if (failures.length) {
          const safeRoute = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
          await page.screenshot({
            path: path.join(OUT_DIR, `${viewportName}-${safeRoute}-failure.png`),
            fullPage: false,
          });
        }

        await page.close();
      }

      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  const byViewport = new Map();
  for (const row of summary) {
    const current = byViewport.get(row.viewportName) || {
      count: 0,
      overflow: 0,
      escaped: 0,
      brokenVisibleImages: 0,
      badResponses: 0,
    };
    current.count += 1;
    current.overflow += row.overflow > 4 ? 1 : 0;
    current.escaped += row.escaped > 0 ? 1 : 0;
    current.brokenVisibleImages += row.brokenVisibleImages > 0 ? 1 : 0;
    current.badResponses += row.badResponses > 0 ? 1 : 0;
    byViewport.set(row.viewportName, current);
  }

  for (const [viewportName, row] of byViewport) {
    console.log(
      `${viewportName}: ${row.count} routes, overflow=${row.overflow}, escaped=${row.escaped}, ` +
        `brokenImages=${row.brokenVisibleImages}, badResponses=${row.badResponses}`,
    );
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));

  if (failures.length) {
    fs.writeFileSync(path.join(OUT_DIR, 'failures.txt'), failures.join('\n'));
    console.error(`Publish layout sweep failed with ${failures.length} issue(s).`);
    for (const failure of failures.slice(0, 25)) console.error(`  - ${failure}`);
    process.exit(1);
  }

  fs.rmSync(path.join(OUT_DIR, 'failures.txt'), { force: true });
  console.log(`Publish layout sweep passed for ${routes.length} routes across ${VIEWPORTS.length} viewport sizes.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
