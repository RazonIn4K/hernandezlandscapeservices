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
- Tests: `npm test` (Playwright, e2e only, NOT run in CI).

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
3. **Reproducible gallery/media workflow** — one manifest + one command. Today:
   `gallery.html` hardcodes cards, `static-gallery.js` hardcodes a second list, the
   Python generators write fragments nobody assembles, and `scripts/optimize_media.py`
   has absolute paths into the previous developer's Mac (`/Users/davidortiz/...`).
4. **Verify billing artifacts before touching them** — `pricing.html` + `/pay/*` are
   website-care billing (Stripe payment links), `scripts/send-renewal.js` is
   developer billing tooling (Doppler `local-mac-work`, Postmark). Confirm account
   ownership/liveness in Stripe/Postmark/Doppler, then either add test coverage or
   move them out of this repo. Do not delete before that check.
5. **Remove stale artifacts (each needs one check first)** — Firebase env injection
   in `deploy.yml` (confirm the Firebase project is dead), placeholder Google-review
   URL in the QR/card flow (needs the real review link from the owner).
   ~~`_redirects`~~ removed 2026-06-10 after DNS check: apex + www both resolve to
   GitHub Pages (185.199.x.x / razonin4k.github.io); no Netlify deploy exists.
   `old_index.html`, `proposal.html`, `estimate.html`, `invoice.html` are cleared
   for removal (owner confirmed unused) — next cleanup PR.
6. **Automate cache busting + indexing** — DONE 2026-06-10: deploy workflow now runs
   the Playwright suite (chromium) before building, stamps the `sw.js` cache name
   with the commit SHA (`scripts/stamp-sw-version.mjs` — committed file keeps a
   readable fallback name), and a post-deploy job submits sitemap URLs to IndexNow
   (`scripts/submit-indexnow.mjs`, key file served from the site root).
