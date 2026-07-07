#!/usr/bin/env node
/**
 * NAP drift gate (SEO_AUDIT_PLAN.md P1-3).
 *
 * Asserts the confirmed business NAP tuple is the ONLY NAP shipped in HTML
 * and schema.jsonld, and that schema.jsonld stays byte-in-sync (as JSON) with
 * the JSON-LD graph embedded in index.html.
 *
 * Confirmed values (never change these without owner confirmation):
 *   Address : 1029 Lewis St, DeKalb, IL 60115
 *   Geo     : 41.935162495016, -88.740720124283
 *   Phone   : (815) 501-1478  /  +1-815-501-1478  /  tel:18155011478
 *   Email   : hernandezlandscapetreeservices@gmail.com
 *   Hours   : Mon-Fri 07:00-18:00, Sat 08:00-16:00
 *
 * ==========================================================================
 * DOCUMENTED EXCEPTIONS — each is pending an owner decision and must be
 * removed from EXCEPTIONS below once resolved:
 *
 *   TODO(B-2): pricing.html displays (331) 645-1372 (plain text, lines ~327
 *   and ~330). Ownership of that number is unconfirmed — it may be the web
 *   agency's care-plan line or an error. Pending the owner decision in
 *   SEO_AUDIT_PLAN.md Section 3 / B-2, this gate allows that number ONLY in
 *   pricing.html. Remove the exception when B-2 lands.
 *
 *   TODO(B-6): index.html carries a hidden `ccemail` form field with
 *   tiogilh@gmail.com (form CC recipient, also in assets/js/main.js). Pending
 *   owner confirmation (SEO_AUDIT_PLAN.md Section 3 / B-6), this gate allows
 *   that address ONLY in index.html. Remove the exception when B-6 lands.
 * ==========================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

const CONFIRMED = {
  phoneDigits: '8155011478', // national 10-digit form
  phoneDisplay: '(815) 501-1478',
  phoneSchema: '+1-815-501-1478',
  email: 'hernandezlandscapetreeservices@gmail.com',
  street: '1029 Lewis St',
  locality: 'DeKalb',
  region: 'IL',
  postalCode: '60115',
  geo: {
    latitude: 41.935162495016,
    longitude: -88.740720124283,
  },
  weekdayHours: { opens: '07:00', closes: '18:00' },
  saturdayHours: { opens: '08:00', closes: '16:00' },
};

// See the TODO(B-2) / TODO(B-6) header blocks above before touching these.
const EXCEPTIONS = {
  phones: [{ file: 'pricing.html', digits: '3316451372', ref: 'TODO(B-2)' }],
  emails: [{ file: 'index.html', email: 'tiogilh@gmail.com', ref: 'TODO(B-6)' }],
};

const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);

const read = (relPath) => fs.readFileSync(path.join(ROOT, relPath), 'utf8');

function walk(dir = ROOT) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...walk(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.relative(ROOT, path.join(dir, entry.name)).replaceAll(path.sep, '/'));
    }
  }
  return files.sort();
}

const digitsOf = (text) => text.replace(/\D/g, '');
const toNational = (digits) => (digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits);

function phoneAllowed(relPath, digits) {
  const national = toNational(digits);
  if (national === CONFIRMED.phoneDigits) return true;
  const exception = EXCEPTIONS.phones.find((e) => e.file === relPath && e.digits === national);
  if (exception) {
    warn(`${relPath}: non-business phone allowed by documented ${exception.ref} exception: ${digits}`);
    return true;
  }
  return false;
}

function emailAllowed(relPath, email) {
  if (email.toLowerCase() === CONFIRMED.email) return true;
  const exception = EXCEPTIONS.emails.find(
    (e) => e.file === relPath && e.email === email.toLowerCase(),
  );
  if (exception) {
    warn(`${relPath}: non-business email allowed by documented ${exception.ref} exception: ${email}`);
    return true;
  }
  return false;
}

function checkText(relPath, text) {
  // tel:/sms: URIs
  for (const match of text.matchAll(/\b(?:tel|sms):([0-9+().\- ]+)/gi)) {
    const digits = digitsOf(match[1]);
    if (!phoneAllowed(relPath, digits)) {
      fail(`${relPath}: tel/sms URI does not carry the confirmed phone: ${match[0].trim()}`);
    }
  }

  // WhatsApp links
  for (const match of text.matchAll(/wa\.me\/(\d+)/gi)) {
    if (toNational(match[1]) !== CONFIRMED.phoneDigits) {
      fail(`${relPath}: wa.me link does not carry the confirmed phone: ${match[0]}`);
    }
  }

  // Display / schema phone formats: (815) 501-1478, (815)501-1478, 815-501-1478,
  // +1-815-501-1478 — the paren form matches with or without a following space.
  for (const match of text.matchAll(/(?<![\d-])(?:\+1[-. ]?)?(?:\(\d{3}\)\s?|\d{3}[-. ])\d{3}[-. ]\d{4}(?![\d-])/g)) {
    const digits = digitsOf(match[0]);
    if (digits.length < 10 || digits.length > 11) continue;
    if (!phoneAllowed(relPath, digits)) {
      fail(`${relPath}: phone number does not match the confirmed NAP phone: "${match[0]}"`);
    }
  }

  // Bare 10/11-digit runs (e.g. "3316451372") in isolation are phone candidates
  // too; word-char guards keep hex hashes, IDs, and URL tokens from matching.
  for (const match of text.matchAll(/(?<![\w.\-])1?\d{10}(?![\w.\-])/g)) {
    const digits = digitsOf(match[0]);
    if (!phoneAllowed(relPath, digits)) {
      fail(`${relPath}: bare digit run looks like an unconfirmed phone number: "${match[0]}"`);
    }
  }

  // Emails
  for (const match of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
    if (!emailAllowed(relPath, match[0])) {
      fail(`${relPath}: email does not match the confirmed business email: ${match[0]}`);
    }
  }

  // Street address: any "Lewis St" mention must be the full confirmed street.
  for (const match of text.matchAll(/.{0,6}Lewis\s+St/gi)) {
    if (!match[0].includes(CONFIRMED.street)) {
      fail(`${relPath}: street address drift near "${match[0].trim()}" (expected "${CONFIRMED.street}")`);
    }
  }

  // Visible opening-hours copy (e.g. "Mon-Fri: 7AM-6PM", "Mon–Fri: 7:00 AM - 6:00 PM").
  // Unicode dashes are normalized first so an en/em-dash cannot dodge the weekday
  // match, and ":00" minute forms of the correct hours are accepted.
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/[‐-―−]/g, '-');
    if (!/\d\s*[AP]M/i.test(line)) continue;
    if (/Mon\s*-?\s*Fri/i.test(line) && !(/\b7(?::00)?\s*AM/i.test(line) && /\b6(?::00)?\s*PM/i.test(line))) {
      fail(`${relPath}: weekday hours drift (expected 7AM-6PM): "${line.trim()}"`);
    }
    if (/\bSat(urday)?\b/i.test(line) && !(/\b8(?::00)?\s*AM/i.test(line) && /\b4(?::00)?\s*PM/i.test(line))) {
      fail(`${relPath}: Saturday hours drift (expected 8AM-4PM): "${line.trim()}"`);
    }
  }
}

function walkJson(node, visit) {
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, visit);
  } else if (node && typeof node === 'object') {
    visit(node);
    for (const value of Object.values(node)) walkJson(value, visit);
  }
}

function checkJsonLd(relPath, data) {
  walkJson(data, (node) => {
    if (typeof node.telephone === 'string' && node.telephone !== CONFIRMED.phoneSchema) {
      fail(`${relPath}: JSON-LD telephone must be "${CONFIRMED.phoneSchema}", found "${node.telephone}"`);
    }
    if (typeof node.email === 'string' && node.email !== CONFIRMED.email) {
      fail(`${relPath}: JSON-LD email must be "${CONFIRMED.email}", found "${node.email}"`);
    }
    if (typeof node.streetAddress === 'string') {
      if (node.streetAddress !== CONFIRMED.street) {
        fail(`${relPath}: JSON-LD streetAddress must be "${CONFIRMED.street}", found "${node.streetAddress}"`);
      }
      if (node.addressLocality !== CONFIRMED.locality || node.addressRegion !== CONFIRMED.region || node.postalCode !== CONFIRMED.postalCode) {
        fail(`${relPath}: JSON-LD postal address drift (expected ${CONFIRMED.locality}, ${CONFIRMED.region} ${CONFIRMED.postalCode})`);
      }
    }
    if (node['@type'] === 'GeoCoordinates') {
      if (node.latitude !== CONFIRMED.geo.latitude || node.longitude !== CONFIRMED.geo.longitude) {
        fail(`${relPath}: JSON-LD geo must be ${CONFIRMED.geo.latitude}, ${CONFIRMED.geo.longitude}; found ${node.latitude}, ${node.longitude}`);
      }
    }
    if (node['@type'] === 'OpeningHoursSpecification') {
      const days = [].concat(node.dayOfWeek ?? []);
      const expected = days.includes('Saturday') ? CONFIRMED.saturdayHours : CONFIRMED.weekdayHours;
      if (node.opens !== expected.opens || node.closes !== expected.closes) {
        fail(`${relPath}: JSON-LD hours drift for ${days.join(',') || 'unknown days'}: ${node.opens}-${node.closes} (expected ${expected.opens}-${expected.closes})`);
      }
    }
  });
}

// --- 1. Scan every shipped HTML file -------------------------------------
const htmlFiles = walk();
for (const relPath of htmlFiles) {
  const html = read(relPath);
  if (html.trim().startsWith('google-site-verification:')) continue;

  checkText(relPath, html);

  for (const [index, block] of [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
    try {
      checkJsonLd(relPath, JSON.parse(block[1].trim()));
    } catch (error) {
      fail(`${relPath}: JSON-LD block ${index + 1} is invalid JSON (${error.message})`);
    }
  }
}

// --- 2. schema.jsonld: same NAP rules + required tuple presence ----------
let schema;
try {
  schema = JSON.parse(read('schema.jsonld'));
  checkJsonLd('schema.jsonld', schema);
} catch (error) {
  fail(`schema.jsonld: invalid JSON (${error.message})`);
}

const indexHtml = read('index.html');
for (const [label, text] of [['index.html', indexHtml], ['schema.jsonld', read('schema.jsonld')]]) {
  for (const required of [CONFIRMED.street, CONFIRMED.locality, CONFIRMED.postalCode, CONFIRMED.email]) {
    if (!text.includes(required)) {
      fail(`${label}: confirmed NAP value missing entirely: "${required}"`);
    }
  }
}

// --- 3. Drift check: schema.jsonld vs index.html's embedded JSON-LD ------
// schema.jsonld is a manually-synced reference copy of the homepage graph
// (see .github/MAINTENANCE_PLAN.md). Any divergence is drift and fails here.
const embeddedMatch = indexHtml.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
if (!embeddedMatch) {
  fail('index.html: embedded JSON-LD block not found');
} else if (schema) {
  try {
    const embedded = JSON.parse(embeddedMatch[1].trim());
    const a = JSON.stringify(embedded['@graph'] ?? embedded, null, 1).split('\n');
    const b = JSON.stringify(schema['@graph'] ?? schema, null, 1).split('\n');
    if (a.join('\n') !== b.join('\n')) {
      const at = a.findIndex((line, i) => line !== b[i]);
      fail(
        `schema.jsonld has drifted from index.html's embedded JSON-LD graph ` +
          `(first difference at normalized line ${at + 1}: index.html "${(a[at] ?? '<missing>').trim()}" vs schema.jsonld "${(b[at] ?? '<missing>').trim()}")`,
      );
    }
  } catch (error) {
    fail(`index.html: embedded JSON-LD is invalid JSON (${error.message})`);
  }
}

// --- Report ----------------------------------------------------------------
console.log(`NAP check: ${htmlFiles.length} HTML files + schema.jsonld scanned`);
if (warnings.length) {
  console.warn(`Warnings (${warnings.length} — documented owner-pending exceptions):`);
  for (const message of warnings) console.warn(`  - ${message}`);
}
if (failures.length) {
  console.error(`NAP check failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}
console.log('NAP check passed.');
