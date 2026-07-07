/**
 * POST /api/emergency-dispatch — 24/7 emergency tree service intake.
 *
 * hernandezlandscapeservices.com is a static site on GitHub Pages, which
 * cannot host server code, so this handler is written as a portable
 * Web-standard fetch handler (zero dependencies). Deploy options:
 *   - Cloudflare Worker (recommended — the default export below is the
 *     Workers module format): route it at
 *     https://dispatch.<zone>/api/emergency-dispatch or a workers.dev URL,
 *     set N8N_WEBHOOK_URL_LANDSCAPE as a secret, then point the form's
 *     data-endpoint attribute at it (see assets/js/emergency-dispatch.js).
 *   - Any Node 18+ host: import { handleEmergencyDispatch } and adapt
 *     (scripts/test-emergency-dispatch.mjs shows the calling convention).
 *
 * Until the endpoint is deployed the frontend falls back to the existing
 * Web3Forms email path, so the CTA works either way.
 */

const SCHEMA_VERSION = '2026-07-06';
const SITE = 'hernandezlandscapeservices.com';
const UPSTREAM_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 64 * 1024;

const DEFAULT_ALLOWED_ORIGINS = ['https://hernandezlandscapeservices.com'];

const EMERGENCY_TYPES = [
  'fallen-tree',
  'tree-on-structure',
  'hanging-limb',
  'blocking-access',
  'near-power-line',
  'storm-damage',
  'other'
];

// Dispatch base = the shop at 1029 Lewis St, DeKalb, IL (coords from the site's
// service-area map). n8n uses this to compute drive time to the incident.
const DISPATCH_BASE = {
  label: '1029 Lewis St, DeKalb, IL 60115',
  geo: { lat: 41.92134, lng: -88.75760 }
};

// --- helpers -----------------------------------------------------------------

function cleanText(value, max, multiline = false) {
  let s = String(value ?? '');
  s = multiline
    ? s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ');
  s = s.replace(/[<>]/g, '');
  s = multiline ? s.replace(/[ \t]+/g, ' ') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

function cleanPhone(value) {
  const s = String(value ?? '').replace(/[^\d\s()+.-]/g, '').trim().slice(0, 25);
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return s;
}

function parseGeo(raw, errors) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object') {
    errors.push('geo: must be an object {lat, lng, accuracyM?}');
    return null;
  }
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.push('geo: lat must be -90..90 and lng -180..180');
    return null;
  }
  const accuracyM = Number.isFinite(Number(raw.accuracyM)) ? Math.round(Number(raw.accuracyM)) : null;
  return { lat, lng, accuracyM };
}

function allowedOrigins(env) {
  const raw = env?.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

// --- rate limiting (in-memory, per isolate) -----------------------------------
// Coarse burst guard: 3 dispatch requests / 5 min / IP. Real emergencies are
// one submission; repeat attempts should be calls. For durable limiting put a
// Cloudflare rate-limiting rule in front of the route.

const WINDOW_MS = 5 * 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map();

function clientIp(request) {
  const h = request.headers;
  const cf = h.get('cf-connecting-ip'); // set by Cloudflare, not spoofable through it
  if (cf) return cf.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

function rateLimited(ip, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

// --- handler -------------------------------------------------------------------

export async function handleEmergencyDispatch(request, env = {}) {
  const url = new URL(request.url);
  const origins = allowedOrigins(env);
  const reqOrigin = request.headers.get('origin');
  const corsOrigin = reqOrigin && origins.includes(reqOrigin) ? reqOrigin : origins[0];
  const cors = corsHeaders(corsOrigin);

  if (!url.pathname.endsWith('/api/emergency-dispatch')) {
    return json(404, { error: 'not_found' }, cors);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' }, { ...cors, Allow: 'POST, OPTIONS' });
  }
  // Browsers always send Origin on cross-origin POST; reject other origins.
  // (Non-browser clients can omit it — this is CSRF hygiene, not auth.)
  if (reqOrigin && !origins.includes(reqOrigin)) {
    return json(403, { error: 'origin_not_allowed' }, cors);
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return json(415, { error: 'unsupported_media_type' }, cors);
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(413, { error: 'payload_too_large' }, cors);
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return json(429, { error: 'rate_limited' }, { ...cors, 'Retry-After': '300' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'bad_request', detail: 'body must be JSON' }, cors);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json(400, { error: 'bad_request', detail: 'body must be a JSON object' }, cors);
  }

  // Honeypot — convincing success, nothing forwarded.
  if (String(body.website ?? '').trim()) {
    return json(200, { ok: true, dispatchId: crypto.randomUUID() }, cors);
  }

  const errors = [];

  const name = cleanText(body.name, 100);
  if (name.length < 2) errors.push('name: required, 2-100 characters');

  const phone = cleanPhone(body.phone);
  if (!phone) errors.push('phone: required, 7-15 digits');

  const rawType = cleanText(body.emergencyType, 40).toLowerCase();
  const emergencyType = EMERGENCY_TYPES.includes(rawType) ? rawType : rawType ? 'other' : '';
  if (!emergencyType) errors.push(`emergencyType: required, one of ${EMERGENCY_TYPES.join(', ')}`);

  const details = cleanText(body.details, 1000, true);

  const zip = cleanText(body.zip, 10);
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) errors.push('zip: must be a US ZIP (5 digits, optional +4)');
  const address = cleanText(body.address, 200);
  const geo = parseGeo(body.geo, errors);
  if (!zip && !geo && !address) {
    errors.push('location: at least one of zip, geo, or address is required for dispatch');
  }

  if (errors.length > 0) {
    return json(400, { error: 'validation', fields: errors }, cors);
  }

  const webhookUrl = env.N8N_WEBHOOK_URL_LANDSCAPE;
  if (!webhookUrl) {
    // Fail loud so the frontend can fall back to phone/Web3Forms — an
    // emergency lead must never disappear into a fake success.
    console.error('emergency-dispatch: N8N_WEBHOOK_URL_LANDSCAPE is not configured');
    return json(503, { error: 'not_configured' }, cors);
  }

  const dispatchId = crypto.randomUUID();
  const event = {
    schemaVersion: SCHEMA_VERSION,
    event: 'emergency_dispatch',
    priority: 'emergency',
    dispatchId,
    receivedAt: new Date().toISOString(),
    source: {
      site: SITE,
      channel: 'web_form',
      page: cleanText(body.page, 200) || null,
      endpoint: '/api/emergency-dispatch'
    },
    contact: { name, phone },
    incident: {
      type: emergencyType,
      typeDetail: rawType && emergencyType === 'other' ? rawType : null,
      details: details || null
    },
    location: {
      zip: zip || null,
      address: address || null,
      geo // {lat, lng, accuracyM} | null
    },
    dispatch: {
      base: DISPATCH_BASE,
      hints: ['compute_drive_time_from_base', 'notify_owner_immediately', 'after_hours_escalation']
    },
    meta: { ip, userAgent: cleanText(request.headers.get('user-agent'), 300) }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) {
      console.error('emergency-dispatch: webhook responded', res.status);
      return json(502, { error: 'upstream' }, cors);
    }
  } catch (error) {
    console.error('emergency-dispatch: webhook unreachable', error instanceof Error ? error.name : error);
    return json(502, { error: 'upstream' }, cors);
  } finally {
    clearTimeout(timeout);
  }

  return json(200, { ok: true, dispatchId }, cors);
}

// Cloudflare Workers module entry point.
export default {
  fetch: (request, env) => handleEmergencyDispatch(request, env)
};

// Test hook: reset the in-memory rate limiter between cases.
export function _resetRateLimiter() {
  hits.clear();
}
