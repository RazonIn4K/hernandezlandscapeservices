#!/usr/bin/env node
/**
 * Local test harness for functions/emergency-dispatch.mjs (SEO_AUDIT_PLAN Phase 3).
 *
 * Exercises the portable fetch handler directly (no server needed) with a
 * stubbed global fetch standing in for the n8n webhook.
 *
 * Run: npm run test:dispatch
 */
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  handleEmergencyDispatch,
  _resetRateLimiter
} from '../functions/emergency-dispatch.mjs';

// Node 18 (CI) has no global `crypto`; Workers runtime and Node 19+ do. The
// handler calls crypto.randomUUID(), so polyfill it for the harness only.
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ENDPOINT = 'https://dispatch.example.com/api/emergency-dispatch';
const ORIGIN = 'https://hernandezlandscapeservices.com';
const ENV = { N8N_WEBHOOK_URL_LANDSCAPE: 'https://n8n.example.com/webhook/landscape-emergency' };

const received = [];
const realFetch = globalThis.fetch;
let webhookStatus = 200;
globalThis.fetch = async (url, init) => {
  received.push({ url, body: JSON.parse(init.body) });
  return new Response('{"received":true}', { status: webhookStatus });
};

let nextIp = 0;
function request(body, opts = {}) {
  // unique IP per request unless a test pins one (rate-limit isolation)
  const ip = opts.ip || `10.0.0.${++nextIp}`;
  return new Request(opts.url || ENDPOINT, {
    method: opts.method || 'POST',
    headers: {
      'content-type': opts.contentType ?? 'application/json',
      origin: opts.origin ?? ORIGIN,
      'cf-connecting-ip': ip,
      ...(opts.headers || {})
    },
    body: opts.method === 'OPTIONS' || opts.method === 'GET' ? undefined : body
  });
}

const VALID = JSON.stringify({
  name: 'Storm Victim',
  phone: '(815) 555-0142',
  emergencyType: 'tree-on-structure',
  details: 'Large oak limb on the garage roof after the storm.',
  zip: '60115',
  geo: { lat: 41.9295, lng: -88.7504, accuracyM: 12 },
  page: '/tree-removal/'
});

let passed = 0;
const failed = [];
async function test(label, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${label}`);
  } catch (err) {
    failed.push(label);
    console.error(`  FAIL - ${label}\n      ${err.message}`);
  }
}

console.log('emergency-dispatch handler tests');

await test('valid request with geo -> 200 + forwarded once with dispatch base', async () => {
  received.length = 0;
  const res = await handleEmergencyDispatch(request(VALID), ENV);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.match(body.dispatchId, /^[0-9a-f-]{36}$/);
  assert.equal(received.length, 1);
  const event = received[0].body;
  assert.equal(event.event, 'emergency_dispatch');
  assert.equal(event.priority, 'emergency');
  assert.equal(event.location.zip, '60115');
  assert.equal(event.location.geo.lat, 41.9295);
  assert.equal(event.dispatch.base.label, '1029 Lewis St, DeKalb, IL 60115');
  assert.ok(event.dispatch.hints.includes('compute_drive_time_from_base'));
});

await test('zip-only location -> 200', async () => {
  const res = await handleEmergencyDispatch(
    request(JSON.stringify({ name: 'Zip Only', phone: '8155550143', emergencyType: 'fallen-tree', zip: '60178' })),
    ENV
  );
  assert.equal(res.status, 200);
});

await test('missing name/phone -> 400 with field errors', async () => {
  const res = await handleEmergencyDispatch(
    request(JSON.stringify({ emergencyType: 'fallen-tree', zip: '60115' })),
    ENV
  );
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'validation');
  assert.ok(body.fields.some((f) => f.startsWith('name:')));
  assert.ok(body.fields.some((f) => f.startsWith('phone:')));
});

await test('no location at all -> 400', async () => {
  const res = await handleEmergencyDispatch(
    request(JSON.stringify({ name: 'No Location', phone: '8155550144', emergencyType: 'other' })),
    ENV
  );
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.fields.some((f) => f.startsWith('location:')));
});

await test('out-of-range geo -> 400', async () => {
  const res = await handleEmergencyDispatch(
    request(JSON.stringify({ name: 'Bad Geo', phone: '8155550145', emergencyType: 'other', geo: { lat: 123, lng: 0 } })),
    ENV
  );
  assert.equal(res.status, 400);
});

await test('malformed JSON -> 400', async () => {
  const res = await handleEmergencyDispatch(request('{not json'), ENV);
  assert.equal(res.status, 400);
});

await test('honeypot filled -> 200 but NOT forwarded', async () => {
  received.length = 0;
  const res = await handleEmergencyDispatch(
    request(JSON.stringify({ name: 'Bot', phone: '8155550146', emergencyType: 'other', zip: '60115', website: 'spam.example' })),
    ENV
  );
  assert.equal(res.status, 200);
  assert.equal(received.length, 0);
});

await test('GET -> 405', async () => {
  const res = await handleEmergencyDispatch(request(null, { method: 'GET' }), ENV);
  assert.equal(res.status, 405);
});

await test('wrong content-type -> 415', async () => {
  const res = await handleEmergencyDispatch(request('name=x', { contentType: 'application/x-www-form-urlencoded' }), ENV);
  assert.equal(res.status, 415);
});

await test('unknown path -> 404', async () => {
  const res = await handleEmergencyDispatch(request(VALID, { url: 'https://dispatch.example.com/other' }), ENV);
  assert.equal(res.status, 404);
});

await test('disallowed origin -> 403', async () => {
  const res = await handleEmergencyDispatch(request(VALID, { origin: 'https://evil.example.com' }), ENV);
  assert.equal(res.status, 403);
});

await test('OPTIONS preflight -> 204 with CORS headers', async () => {
  const res = await handleEmergencyDispatch(request(null, { method: 'OPTIONS' }), ENV);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
});

await test('4th request from same IP inside window -> 429', async () => {
  _resetRateLimiter();
  const ip = '10.9.9.9';
  for (let i = 0; i < 3; i++) {
    const res = await handleEmergencyDispatch(request(VALID, { ip }), ENV);
    assert.equal(res.status, 200, `request ${i + 1} should pass`);
  }
  const res = await handleEmergencyDispatch(request(VALID, { ip }), ENV);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '300');
});

await test('webhook env missing -> 503 (never fake success)', async () => {
  const res = await handleEmergencyDispatch(request(VALID), {});
  assert.equal(res.status, 503);
});

await test('webhook non-2xx -> 502', async () => {
  webhookStatus = 500;
  const res = await handleEmergencyDispatch(request(VALID), ENV);
  assert.equal(res.status, 502);
  webhookStatus = 200;
});

globalThis.fetch = realFetch;

console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length > 0) {
  process.exit(1);
}
