#!/usr/bin/env node
// Replaces every Font Awesome <i class="fas fa-…"></i> with inline SVG
// (scripts/icons.mjs): sprite references plus a per-page sprite in HTML pages,
// full paths in scripts. `--check` fails if any icon-font markup is left or a
// page's sprite does not match its icons (runs in test:ci).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { replaceIcons, withIconSprite, FA_TAG } from './icons.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const files = execSync('git ls-files "*.html" "assets/js/*.js"', { cwd: ROOT })
  .toString()
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

let changed = 0;
let icons = 0;
const problems = [];
for (const rel of files) {
  const file = path.join(ROOT, rel);
  const src = fs.readFileSync(file, 'utf8');
  const isHtml = rel.endsWith('.html');
  if (CHECK) {
    const n = (src.match(FA_TAG) || []).length;
    if (n) problems.push(`${rel}: ${n} icon-font tag(s)`);
    if (isHtml && withIconSprite(src) !== src) problems.push(`${rel}: icon sprite out of date`);
    continue;
  }
  const { out, count } = replaceIcons(src, { inline: !isHtml });
  const next = isHtml ? withIconSprite(out) : out;
  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
    icons += count;
  }
}
if (CHECK) {
  if (problems.length) {
    console.error(`inline-icons --check:\n  ${problems.join('\n  ')}\nRun: node scripts/inline-icons.mjs`);
    process.exit(1);
  }
  console.log(`inline-icons --check: ${files.length} files, no icon-font markup, sprites in sync.`);
} else {
  console.log(`inline-icons: ${icons} icons inlined; ${changed} files written.`);
}
