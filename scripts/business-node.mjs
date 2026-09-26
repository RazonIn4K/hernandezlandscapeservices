#!/usr/bin/env node
// One business entity on every page (round 6; research 06 C1, C2, C3).
//
// The home page's JSON-LD (index.html, mirrored byte-for-byte in schema.jsonld and
// guarded by verify-nap) is the single source. Every other page with JSON-LD carries
// a slim copy of that node under the same @id: name, URL, logo, NAP, geo, hours,
// the six confirmed towns, sameAs and languages. Page-specific: only `image` (the
// page's existing business image, else the logo). Never aggregateRating or reviews.
//
// Used by scripts/generate_local_pages.js and scripts/build-es-home.mjs for the
// pages they generate, and run directly for the hand-written pages:
//   node scripts/business-node.mjs          rewrite every page's business node
//   node scripts/business-node.mjs --check  fail if any page has drifted

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG_ID = 'https://hernandezlandscapeservices.com/#organization';
const TYPE = 'HomeAndConstructionBusiness';
// Order of the slim node's keys (image is inserted after logo).
const SLIM_KEYS = ['@type', '@id', 'name', 'url', 'logo', 'telephone', 'email', 'address', 'geo', 'openingHoursSpecification', 'priceRange', 'areaServed', 'sameAs', 'knowsLanguage'];
const SOURCE_PAGE = 'index.html';
const EXCLUDED_DIRS = new Set(['.claude', '.git', '_media-archive', 'node_modules', 'playwright-report', 'publish', 'test-results', 'tmp', 'vendor']);
const LD_RE = /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi;

let source;
function sourceNode() {
  if (source) return source;
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema.jsonld'), 'utf8'));
  const node = (schema['@graph'] ?? [schema]).find((n) => n['@id'] === ORG_ID);
  if (!node) throw new Error(`schema.jsonld: no node with @id ${ORG_ID}`);
  for (const key of SLIM_KEYS) if (node[key] === undefined) throw new Error(`schema.jsonld: business node has no ${key}`);
  source = node;
  return source;
}

/** The slim business node, with the page's own image. */
export function businessNode(image) {
  const src = sourceNode();
  const node = {};
  for (const key of SLIM_KEYS) {
    node[key] = structuredClone(src[key]);
    if (key === 'logo') node.image = image || src.logo;
  }
  return node;
}

// Every {...} span in a JSON text, outermost last, skipping braces inside strings.
function objectSpans(text) {
  const spans = [];
  const stack = [];
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i += 1;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') stack.push(i);
    else if (ch === '}') spans.push([stack.pop(), i + 1]);
  }
  return spans;
}

const isBusiness = (v) => v && [].concat(v['@type'] ?? []).includes(TYPE);
const isOrgRef = (v) => v && Object.keys(v).length === 1 && v['@id'] === ORG_ID;

// Serialize a node where it sits: nested lines take the indentation of the line the
// object starts on, one indent unit deeper per level (unit read from the block).
function serializeAt(node, text, start, end) {
  const lineStart = text.lastIndexOf('\n', start) + 1;
  const base = text.slice(lineStart, start).match(/^\s*/)[0];
  const inner = text.slice(start, end).match(/\n(\s*)\S/);
  const unit = inner && inner[1].length > base.length ? inner[1].length - base.length : 2;
  return JSON.stringify(node, null, unit).split('\n').map((line, i) => (i ? base + line : line)).join('\n');
}

/**
 * Rewrite the business node(s) in a page's JSON-LD from the single source.
 * Any HomeAndConstructionBusiness object is replaced in place; a page that only
 * references the @id (gallery, videos) gets its first reference expanded.
 */
export function applyBusinessNode(html) {
  const blocks = [...html.matchAll(LD_RE)];
  const found = blocks.map((m) => {
    const spans = objectSpans(m[2])
      .map(([s, e]) => { try { return { s, e, v: JSON.parse(m[2].slice(s, e)) }; } catch { return null; } })
      .filter(Boolean);
    return spans;
  });
  const hasDefinition = found.some((spans) => spans.some((x) => isBusiness(x.v)));
  let expanded = false;
  let out = '';
  let last = 0;
  blocks.forEach((m, b) => {
    const text = m[2];
    let targets = found[b].filter((x) => isBusiness(x.v));
    // Keep only outermost business objects.
    targets = targets.filter((x) => !targets.some((y) => y !== x && y.s <= x.s && x.e <= y.e));
    if (!hasDefinition && !expanded) {
      const ref = found[b].find((x) => isOrgRef(x.v));
      if (ref) { targets = [ref]; expanded = true; }
    }
    let next = text;
    for (const x of targets.sort((a, c) => c.s - a.s)) {
      const image = typeof x.v.image === 'string' ? x.v.image : undefined;
      next = next.slice(0, x.s) + serializeAt(businessNode(image), next, x.s, x.e) + next.slice(x.e);
    }
    out += html.slice(last, m.index) + m[1] + next + m[3];
    last = m.index + m[0].length;
  });
  return out + html.slice(last);
}

/** Problems a page's JSON-LD must never have (06 C3), plus a missing business node. */
export function businessProblems(html) {
  const problems = [];
  const blocks = [...html.matchAll(LD_RE)];
  if (!blocks.length) return problems;
  let defined = false;
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    if ('aggregateRating' in v) problems.push('aggregateRating');
    if ('review' in v || [].concat(v['@type'] ?? []).includes('Review')) problems.push('review markup');
    if (v['@id'] === ORG_ID && Object.keys(v).length > 1) defined = true;
    Object.values(v).forEach(walk);
  };
  for (const m of blocks) {
    try { walk(JSON.parse(m[2])); } catch (e) { problems.push(`invalid JSON-LD (${e.message})`); }
  }
  const text = blocks.map((m) => m[2]).join('\n');
  if ((text.includes(`"${TYPE}"`) || text.includes(ORG_ID)) && !defined) problems.push(`no ${ORG_ID} definition`);
  return problems;
}

function walkHtml(dir = ROOT) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) files.push(...walkHtml(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.html')) {
      files.push(path.relative(ROOT, path.join(dir, entry.name)).replaceAll(path.sep, '/'));
    }
  }
  return files.sort();
}

function main() {
  const check = process.argv.includes('--check');
  const drifted = [];
  const problems = [];
  let pages = 0;
  for (const rel of walkHtml()) {
    const file = path.join(ROOT, rel);
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('application/ld+json')) continue;
    const next = rel === SOURCE_PAGE ? html : applyBusinessNode(html);
    // Checked on what ships: the page as written (--check) or as rewritten.
    for (const p of businessProblems(check ? html : next)) problems.push(`${rel}: ${p}`);
    if (rel === SOURCE_PAGE || !next.includes(ORG_ID)) continue;
    pages += 1;
    if (next !== html) {
      drifted.push(rel);
      if (!check) fs.writeFileSync(file, next);
    }
  }
  if (problems.length) {
    console.error(`business-node: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  if (check) {
    if (drifted.length) {
      console.error(`business-node --check: ${drifted.length} page(s) drifted from schema.jsonld. Run: node scripts/business-node.mjs\n  - ${drifted.join('\n  - ')}`);
      process.exit(1);
    }
    console.log(`business-node --check: ${pages} pages in sync with schema.jsonld.`);
  } else {
    console.log(`business-node: ${pages} pages, ${drifted.length} rewritten.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
