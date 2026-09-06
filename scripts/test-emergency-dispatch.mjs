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
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {
  handleEmergencyDispatch,
  _resetRateLimiter
} from '../functions/emergency-dispatch.mjs';

// Keep the Worker-style Web Crypto dependency explicit in this test harness.
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

// Exercise the shipped browser script without making network requests. The
// small DOM fixture exposes the form's public events, fields and replacement
// panel; native constraint results are controlled explicitly by each test.
const clientScript = readFileSync(new URL('../assets/js/emergency-dispatch.js', import.meta.url), 'utf8');
function clientForm({ lang = 'en', endpoint = '', replies = [], geolocation = false } = {}) {
  function element(name = '', value = '') {
    const attributes = new Map();
    const listeners = new Map();
    let text = '';
    let html = '';
    return {
      name, value, checked: false, disabled: false, customValidity: '', validity: {},
      get textContent() { return text; },
      set textContent(value) { text = String(value); html = text; },
      get innerHTML() { return html; },
      set innerHTML(value) { html = String(value); text = html; },
      setAttribute(key, value) { attributes.set(key, value); },
      getAttribute(key) { return attributes.get(key) ?? null; },
      removeAttribute(key) { attributes.delete(key); },
      setCustomValidity(value) { this.customValidity = value; },
      addEventListener(type, listener) {
        listeners.set(type, [...(listeners.get(type) || []), listener]);
      },
      emit(type, event = {}) {
        for (const listener of listeners.get(type) || []) listener(event);
      }
    };
  }
  const fields = Object.fromEntries(Object.entries({
    name: 'Test Customer', phone: '8155550142', location: '60115',
    emergency_type: 'fallen-tree', details: 'Test request', website: '',
    botcheck: '', geo_lat: '', geo_lng: '', geo_accuracy: ''
  }).map(([name, value]) => [name, element(name, value)]));
  const button = element();
  button.textContent = lang.startsWith('es') ? 'Enviar solicitud' : 'Send request';
  const geoButton = element();
  const geoStatus = element();
  const status = element();
  const form = element();
  const state = { valid: true, calls: [], panel: null, geoCalls: 0, reports: 0 };
  form.setAttribute('data-endpoint', endpoint);
  form.querySelector = selector => {
    const field = selector.match(/\[name="([^"]+)"\]/)?.[1];
    if (field) return fields[field] || null;
    return {
      '[data-geo-request]': geoButton, '[data-geo-status]': geoStatus,
      '[data-dispatch-status]': status, 'button[type="submit"]': button
    }[selector] || null;
  };
  form.checkValidity = () => {
    if (!state.valid) form.emit('invalid', { target: fields.phone });
    return state.valid;
  };
  form.reportValidity = () => { state.reports++; };
  form.replaceWith = panel => { state.panel = panel; };
  const navigator = geolocation ? {
    geolocation: {
      getCurrentPosition(success, failure) {
        state.geoCalls++;
        state.geoSuccess = success;
        state.geoFailure = failure;
      }
    }
  } : {};
  runInNewContext(clientScript, {
    document: {
      documentElement: { lang }, querySelector: () => form,
      createElement: () => element()
    },
    navigator,
    window: { location: { pathname: '/es/emergency-tree-removal/' }, setTimeout, clearTimeout },
    AbortController,
    FormData: class { constructor() { this.fields = fields; } },
    fetch: async (url, options) => {
      state.calls.push({ url, options });
      const next = replies.shift();
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next();
      if (!next) throw new Error('Unexpected client fetch');
      return next;
    }
  });
  return {
    state, form, fields, button, geoButton, geoStatus, status,
    async submit() {
      form.emit('submit', { preventDefault() {} });
      await new Promise(setImmediate);
    }
  };
}

console.log('\nemergency request browser-script tests');
for (const lang of ['en', 'es-MX']) {
  const spanish = lang.startsWith('es');
  await test(`${lang}: email-only acceptance shows an unconfirmed request, not a dispatch promise`, async () => {
    const client = clientForm({ lang, replies: [new Response('{"success":true}')] });
    await client.submit();
    assert.equal(client.state.calls.length, 1);
    assert.equal(client.state.calls[0].url, 'https://api.web3forms.com/submit');
    assert.equal(client.state.panel.getAttribute('role'), 'status');
    assert.match(client.state.panel.innerHTML, spanish ? /pendiente de revisión y de una llamada/ : /awaiting review and a callback/);
    assert.match(client.state.panel.innerHTML, spanish ? /no están confirmadas/ : /are not confirmed/);
    assert.match(client.state.panel.innerHTML, /tel:18155011478/);
    assert.doesNotMatch(client.state.panel.innerHTML, /team has been notified|within a few minutes|24\/7|equipo ha sido notificado/i);
  });

  await test(`${lang}: failed primary and fallback preserve input and allow another attempt`, async () => {
    const client = clientForm({ lang, endpoint: ENDPOINT, replies: [new Error('Network unavailable'), new Response('{"success":false}', { status: 503 })] });
    const original = client.button.textContent;
    await client.submit();
    assert.deepEqual(client.state.calls.map(call => call.url), [ENDPOINT, 'https://api.web3forms.com/submit']);
    assert.equal(client.state.panel, null);
    assert.equal(client.fields.name.value, 'Test Customer');
    assert.equal(client.fields.phone.value, '8155550142');
    assert.equal(client.fields.details.value, 'Test request');
    assert.equal(client.button.disabled, false);
    assert.equal(client.button.textContent, original);
    assert.equal(client.form.getAttribute('aria-busy'), null);
    assert.equal(client.status.getAttribute('role'), 'alert');
    assert.match(client.status.innerHTML, spanish ? /No pudimos confirmar el envío/ : /couldn't confirm that your request was sent/);
    assert.match(client.status.innerHTML, /tel:18155011478/);
    assert.doesNotMatch(client.status.innerHTML, /24\/7|answered|atendemos/i);
  });

  await test(`${lang}: geolocation requires a click and localizes both outcomes`, async () => {
    const client = clientForm({ lang, geolocation: true });
    assert.equal(client.state.geoCalls, 0);
    client.geoButton.emit('click');
    assert.equal(client.state.geoCalls, 1);
    assert.match(client.geoStatus.textContent, spanish ? /Obteniendo su ubicación/ : /Getting your location/);
    client.state.geoSuccess({ coords: { latitude: 41.93, longitude: -88.75, accuracy: 12.4 } });
    assert.equal(client.fields.geo_lat.value, '41.93');
    assert.equal(client.fields.geo_accuracy.value, '12');
    assert.match(client.geoStatus.textContent, spanish ? /Ubicación adjunta/ : /Location attached/);
    client.geoButton.emit('click');
    client.state.geoFailure();
    assert.match(client.geoStatus.textContent, spanish ? /No pudimos obtener su ubicación/ : /Couldn't get your location/);
  });

  await test(`${lang}: invalid input blocks sending and clears its localized custom error on edit`, async () => {
    const client = clientForm({ lang });
    client.state.valid = false;
    await client.submit();
    assert.equal(client.state.calls.length, 0);
    assert.equal(client.state.reports, 1);
    assert.match(client.fields.phone.customValidity, spanish ? /teléfono válido/ : /valid phone number/);
    assert.match(client.status.textContent, spanish ? /campos obligatorios/ : /required fields/);
    client.form.emit('input', { target: client.fields.phone });
    assert.equal(client.fields.phone.customValidity, '');
  });
}

await test('Spanish sending state and endpoint rejection retain the email fallback', async () => {
  let complete;
  const client = clientForm({ lang: 'es', endpoint: ENDPOINT, replies: [
    () => new Promise(resolve => { complete = resolve; }), new Response('{"success":true}')
  ] });
  await client.submit();
  assert.equal(client.button.disabled, true);
  assert.match(client.button.innerHTML, /Enviando/);
  assert.equal(client.form.getAttribute('aria-busy'), 'true');
  const payload = JSON.parse(client.state.calls[0].options.body);
  assert.equal(payload.zip, '60115');
  assert.equal(payload.phone, '8155550142');
  complete(new Response('{}', { status: 503 }));
  await new Promise(setImmediate);
  assert.equal(client.state.calls.length, 2);
  assert.match(client.state.panel.innerHTML, /Solicitud enviada/);
});

await test('Spanish unsupported geolocation and honeypot remain safe without a network request', async () => {
  const client = clientForm({ lang: 'es' });
  assert.equal(client.geoButton.disabled, true);
  assert.match(client.geoStatus.textContent, /Este navegador no permite compartir la ubicación/);
  client.fields.website.value = 'spam.example';
  await client.submit();
  assert.equal(client.state.calls.length, 0);
  assert.match(client.state.panel.innerHTML, /Solicitud enviada/);
});

console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length > 0) {
  process.exit(1);
}
