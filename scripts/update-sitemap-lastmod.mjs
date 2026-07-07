#!/usr/bin/env node
/**
 * Set each sitemap.xml <lastmod> from the page's real git history (P2-11).
 *
 * For every <url> entry the date is:
 *   - today, when the mapped file has uncommitted changes in the working tree
 *     (it is genuinely being modified right now), otherwise
 *   - the file's last commit date: git log -1 --format=%cd --date=short -- <file>
 *
 * Usage: npm run sitemap:lastmod   (run before committing page changes so the
 * sitemap ships accurate dates; media-owned generated regions are untouched —
 * this script only rewrites <lastmod> values).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_ORIGIN = 'https://hernandezlandscapeservices.com';

const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

// Local date (not UTC) so dirty-file dates line up with git's --date=short,
// which also reports in local time.
const today = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

function fileForLoc(loc) {
  if (!loc.startsWith(SITE_ORIGIN)) return null;
  let rel = loc.slice(SITE_ORIGIN.length).replace(/^\//, '');
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  return rel;
}

function lastmodFor(relPath) {
  if (!fs.existsSync(path.join(ROOT, relPath))) {
    throw new Error(`sitemap loc maps to a missing file: ${relPath}`);
  }
  const dirty = git('status', '--porcelain', '--', relPath) !== '';
  if (dirty) return today();
  const committed = git('log', '-1', '--format=%cd', '--date=short', '--', relPath);
  return committed || today();
}

const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
let changes = 0;

const updated = sitemap.replace(
  /(<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>)(\d{4}-\d{2}-\d{2})(<\/lastmod>)/g,
  (match, prefix, loc, currentDate, suffix) => {
    const relPath = fileForLoc(loc);
    if (!relPath) return match;
    const nextDate = lastmodFor(relPath);
    if (nextDate !== currentDate) {
      changes += 1;
      console.log(`  ${loc}: ${currentDate} -> ${nextDate}`);
    }
    return `${prefix}${nextDate}${suffix}`;
  },
);

if (changes) {
  fs.writeFileSync(SITEMAP_PATH, updated);
  console.log(`sitemap.xml: updated ${changes} lastmod value(s) from git history.`);
} else {
  console.log('sitemap.xml: all lastmod values already match git history.');
}
