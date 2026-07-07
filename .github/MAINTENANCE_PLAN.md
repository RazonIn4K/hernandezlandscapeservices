# Maintenance Plan

Current roadmap for hernandezlandscapeservices.com. Replaces `handoff.manifest.json`
(May 18, 2026 audit — all five of its tasks shipped: business/FAQ/breadcrumb schema,
the tree-removal / lawn-care / snow-removal service pages, and sitemap entries, all
now validated by the Playwright suite). This file lives in `.github/` so the Pages
deploy does not publish it.

## How this site works (read first)

- Static HTML on GitHub Pages, domain via `CNAME`. No app framework, no backend.
- "Build" = Tailwind only: `npm run build` compiles `src/input.css` → `assets/css/styles.css`.
- Deploys: push to `main` → `.github/workflows/deploy.yml` → GitHub Pages.
- Leads: `#contactForm` on `index.html` POSTs to Web3Forms (key in the page; recipient
  configured in the Web3Forms dashboard). Confirmed delivering as of June 2026.
- Tests: `npm test` runs the full local Playwright matrix. The GitHub Pages
  deploy workflow runs `npm run test:ci -- --project=chromium`, which includes
  generated-media drift checks and media-budget checks before Chromium tests.

## schema.jsonld (root) — manually-synced reference copy

`schema.jsonld` at the repo root is a **manually-synced reference copy** of the
JSON-LD `@graph` embedded in `index.html` (it is published alongside the site by
`scripts/prepare-publish.mjs` but no page links to it). It is NOT generated:
whenever the homepage's embedded JSON-LD block changes, apply the identical
change to `schema.jsonld` in the same commit. Sync is enforced by the NAP drift
gate — `scripts/verify-nap.mjs` (`npm run nap:check`, part of `test:ci`) diffs
`schema.jsonld` against `index.html`'s embedded graph and fails CI on any
divergence, and also fails on any NAP (address/phone/email/hours) drift across
all shipped HTML. Decision 2026-07-06 (SEO_AUDIT_PLAN.md P2-13): documented as
manual copy rather than wiring a generator, since the gate makes silent drift
impossible.

`sitemap.xml` `<lastmod>` values are maintained by `npm run sitemap:lastmod`
(`scripts/update-sitemap-lastmod.mjs`), which reads each page's last commit
date from git (dirty files get today's date). Run it when committing page
changes.

## Known machine quirk (Windows dev box)

Windows Defender's `Trojan:HTML/FakeLogin.AK!atmn` heuristic false-positives on
`assets/js/main.js` and silently deletes it from the working tree. An exclusion for
the repo folder was added 2026-06-09. If `git status` ever shows that file deleted
unexpectedly, check `Get-MpThreatDetection` and restore with
`git checkout -- assets/js/main.js`.

## Roadmap

1. **Stabilize working copy** — DONE 2026-06-09 (Defender false positive identified
   and excluded; was previously misdiagnosed as a concurrent working copy).
2. **Instant-estimate lead handoff** — the `#quoteForm` estimator collects address /
   owner-verification / best-time fields that are silently discarded. Turn it into a
   prefill step for the real Web3Forms form. (PR: `fix/instant-estimate-leads`)
3. **Reproducible gallery/media workflow** — DONE 2026-06-10 (PR #24): `media/gallery.json`
   + `npm run media:update` regenerate the gallery/index.html cards, videos/index.html players,
   homepage carousel data, and sitemap media entries between GENERATED markers;
   `scripts/optimize_media.py` is repo-relative now. See `docs/MEDIA-WORKFLOW.md`.
   CI runs `npm run media:check` and `npm run media:budget` through `test:ci`,
   failing the deploy on manifest/page drift, duplicate surface IDs, or media
   budget regressions. A June 2026 media pass compressed referenced photos,
   posters, and videos in place; do not re-add raw originals to generated
   surfaces unless they are optimized first.
4. **Verify billing artifacts before touching them** — `pricing.html` + `/pay/*` are
   website-care billing (Stripe payment links). Confirm account ownership/liveness
   in Stripe, then either add test coverage or retire the pages and remove them
   from the `sw.js` pre-cache (the success page's missing `#sid` element was
   fixed 2026-07-06; the keep/retire decision itself is still open).
   Do not delete before that check. The payment-link inventory and decision log
   live in the private `highencode-ops` repo (`billing/stripe-links.md`).
   ~~`scripts/send-renewal.js`~~ moved to `highencode-ops/billing/` 2026-06-10 and
   removed from this repo (it was developer billing tooling, not site code).
5. **Remove stale artifacts (each needs one check first)** — Firebase env injection
   in `deploy.yml` (confirm the Firebase project is dead), placeholder Google-review
   URL in the QR/card flow (needs the real review link from the owner).
   ~~`_redirects`~~ removed 2026-06-10 after DNS check: apex + www both resolve to
   GitHub Pages (185.199.x.x / razonin4k.github.io); no Netlify deploy exists.
   ~~`old_index.html`, `proposal.html`, `estimate.html`, `invoice.html`~~ removed
   2026-06-10 (owner confirmed unused; archived in `highencode-ops/clients/
   hernandez/archive/`). `card.html` kept as the QR landing page but set to
   `noindex, follow` and dropped from the sitemap.
6. **Automate cache busting + indexing** — DONE 2026-06-10: deploy workflow now runs
   the Playwright suite (chromium) before building, stamps the `sw.js` cache name
   with the commit SHA (`scripts/stamp-sw-version.mjs` — committed file keeps a
   readable fallback name), and a post-deploy job submits sitemap URLs to IndexNow
   (`scripts/submit-indexnow.mjs`, key file served from the site root).
   June 2026 update: deploy artifacts are built through `npm run publish:prepare`,
   which copies public runtime files and referenced `hernandez_images/*` assets
   only, keeping tests, scripts, docs, raw media folders, and local tooling out of
   GitHub Pages.
