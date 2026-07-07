# Security Posture — hernandezlandscapeservices.com

Last updated: 2026-07-06 (Phase 3: Infrastructure Hardening & Lead Pipeline Automation)
Stack: static HTML/CSS/JS on **GitHub Pages** (apex custom domain), forms via Web3Forms, new emergency-dispatch worker (portable, not yet deployed).

## 1. HTTP response headers — platform constraint, stated honestly

**GitHub Pages cannot set custom HTTP response headers.** There is no `.htaccess`, no `_headers` file support, and no server config. What the platform provides today:

- HTTPS is enforced (Enforce HTTPS on; HTTP redirects to HTTPS).
- No `Strict-Transport-Security` is emitted for custom domains (only `*.github.io` gets HSTS via preload).
- No CSP / `X-Frame-Options` / `X-Content-Type-Options` can be added server-side.

`<meta http-equiv>` CSP was evaluated and **deliberately not shipped**: the site relies on inline scripts/styles, cdnjs (Font Awesome), Google Fonts, a Google Maps iframe, and Web3Forms; meta-CSP can't express `frame-ancestors` or report-only mode, so a mistake would break a live client site with no observability. Do this properly at the edge instead:

### Recommended path A — Cloudflare in front of Pages (no repo changes)

Proxy the DNS through Cloudflare and add a Response Header Transform Rule with:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.web3forms.com https://<dispatch-worker-host>; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com; frame-ancestors 'self'; upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` |

(`geolocation=(self)` — the emergency dispatch form uses opt-in geolocation. Roll CSP out in stages: start report-only via a Cloudflare Worker if any doubt.)

### Recommended path B — migrate hosting to Netlify

The sibling site ninas-tacos-site already runs Netlify with a `[[headers]]` block; the same set applies 1:1. Note `.github/MAINTENANCE_PLAN.md` records "no Netlify" as a deliberate prior decision — revisit with the owner before switching.

## 2. API surface — `/api/emergency-dispatch`

The site itself is static (no server code deployable on Pages), so the emergency intake lives in `functions/emergency-dispatch.mjs` — a zero-dependency, Web-standard fetch handler in Cloudflare Workers module format (deploy steps in `SEO_AUDIT_PLAN.md` → AUTOMATION HANDOFF).

| Control | Value |
|---|---|
| Rate limit | 3 requests / 5 min / IP (in-memory per isolate; front with a Cloudflare rate-limiting rule for durability) |
| IP source | `CF-Connecting-IP` (not client-spoofable through Cloudflare) |
| CORS | allowlist, default `https://hernandezlandscapeservices.com` only (`ALLOWED_ORIGINS` env to extend); cross-origin POSTs from other origins → 403 |
| Body cap | 64 KB, JSON only (415 otherwise) |
| Honeypot | `website` field → convincing 200, nothing forwarded |
| Webhook | forwards to `N8N_WEBHOOK_URL_LANDSCAPE` (secret) with 10s timeout; **503 when unset, 502 on upstream failure — never a fake success** |
| Response headers | `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` on every response |

## 3. Input validation & sanitization

### Server-side (`functions/emergency-dispatch.mjs`) — authoritative

| Field | Rule |
|---|---|
| `name` | required, 2–100 chars; control chars stripped, `<`/`>` removed, whitespace collapsed |
| `phone` | required; only `digits ( ) + - . space`; 7–15 digits |
| `emergencyType` | allowlist `fallen-tree, tree-on-structure, hanging-limb, blocking-access, near-power-line, storm-damage, other` (unknowns → `other`, original kept bounded) |
| `details` | optional, ≤1000 chars, sanitized (newlines kept) |
| `zip` | optional, `^\d{5}(-\d{4})?$` |
| `address` | optional, ≤200 chars, sanitized |
| `geo` | optional `{lat -90..90, lng -180..180, accuracyM}` |
| location rule | at least one of `zip` / `geo` / `address` required (dispatch needs a target) |
| `website` | honeypot |

Sanitized values are re-emitted only as JSON; angle brackets stripped so n8n email/HTML templates can't be injected. The payload tells the automation layer to treat free-text as data, not instructions.

### Client-side (`assets/js/emergency-dispatch.js`) — UX only, never trusted

Native `required`/`pattern` validation; geolocation captured **only on explicit button click** (no permission prompt on page load); if the dispatch endpoint is unset/unreachable the form falls back to the existing Web3Forms email path so an emergency lead is never lost.

### Existing quote form (Phase 2 state)

Honeypot + `botcheck` + submit-timing as hard blocks; borderline content-heuristic hits now still deliver tagged `[Possible Spam]` (P0-1 fix) instead of silently dropping. Web3Forms adds its own server-side spam filtering. The Web3Forms access key in markup is public by design (scoped submit key, not a secret).

## 4. Secrets & config

- `N8N_WEBHOOK_URL_LANDSCAPE` lives only as a Worker secret (`wrangler secret put`) — never in the repo.
- No other secrets exist in this repo; deploy is public GitHub Pages content only. `scripts/prepare-publish.mjs` allowlist keeps non-site files (including `functions/` and `scripts/`) out of the published artifact.

## 5. Verification

```bash
npm run test:dispatch        # 15-case handler test suite (part of test:ci)
npm run seo:check && npm run nap:check && npm run media:check && npm run media:budget
npm run publish:prepare      # confirms functions/ and scripts/ stay unpublished
# After Worker deploy: smoke tests in SEO_AUDIT_PLAN.md -> AUTOMATION HANDOFF
```
