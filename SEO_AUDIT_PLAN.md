# SEO Audit & Implementation Plan — hernandezlandscapeservices.com

> Generated 2026-07-06 by the Technical Auditor (multi-agent audit: routing/URL-hygiene, metadata/i18n, JSON-LD/NAP, conversion/content, tooling/gates).
> Pre-existing docs in this repo: `audit-report.md` (2026-05-18 third-party audit), `seo-fixes-checklist.md` (prior fix checklist; P0/P1 done, P2 offsite items unchecked), `.github/MAINTENANCE_PLAN.md` (open decisions incl. Stripe pages, card.html review link), `docs/GITLAB-CI.md`, `docs/MEDIA-WORKFLOW.md`. This file complements those documents — it does not replace them; MAINTENANCE_PLAN.md's open owner decisions are carried into Section 3.

## 1. Detected Stack & Routing Architecture

**Stack:** Static HTML/CSS/JS, no framework/CMS. CSS built from Tailwind (`npm run build-css`: src/input.css → assets/css/styles.css, package.json:6-7). Client-side EN/ES text toggle via assets/js/i18n.js (innerHTML swap, sessionStorage; no i18n routing). Playwright e2e tests. Node scripts under scripts/ implement all quality gates.

**Hosting/deploy:** GitHub Pages, custom domain `hernandezlandscapeservices.com` (CNAME; apex-only, HTTPS-only, no Netlify — deliberate per .github/MAINTENANCE_PLAN.md:55-56). Pipeline in .github/workflows/deploy.yml:
`npm ci → npm run build → playwright install → npm run test:ci (media:check + media:budget + seo:check + Playwright) → scripts/stamp-sw-version.mjs (SHA-stamped SW cache name) → npm run publish:prepare (whitelisted publish/ artifact) → npm run publish:check-layout (headless-Chromium 4-viewport overflow/broken-image/404 sweep) → upload/deploy Pages → scripts/submit-indexnow.mjs (post-deploy)`. A `.gitlab-ci.yml` mirrors the quality gate plus SAST/Secret Detection/Dependency Scanning; `.github/workflows/gitlab-mirror.yml` mirrors main to GitLab.

**Gates that must stay green (do not weaken):** `media:check` (media/gallery.json is the single source of truth for gallery/videos/carousel/sitemap media — never hand-edit generated regions), `media:budget`, `seo:check` (scripts/check-seo.mjs: single-H1, title, meta description, canonical, OG+Twitter, JSON-LD validity, sitemap↔canonical cross-check, banned Yelp URL guard), Playwright e2e, `publish:prepare` allowlist, `publish:check-layout` viewport sweep (320/390/768/1440px).

**Route map (public pages):**

| Route | File | Indexable | Notes |
|---|---|---|---|
| `/` | index.html | yes | Full schema @graph; EN/ES toggle |
| `/tree-removal/` | tree-removal/index.html | yes | Clean route; Service+FAQ+Breadcrumb schema |
| `/lawn-care/` | lawn-care/index.html | yes | Clean route |
| `/snow-removal/` | snow-removal/index.html | yes | Clean route |
| `/service-areas/` | service-areas/index.html | yes | Hub; lists only 3 cities |
| `/service-areas/dekalb-il/` | service-areas/dekalb-il/index.html | yes | City template |
| `/service-areas/sycamore-il/` | service-areas/sycamore-il/index.html | yes | City template |
| `/service-areas/cortland-il/` | service-areas/cortland-il/index.html | yes | City template |
| `/gallery.html` | gallery.html | yes | Legacy .html route (mixed style) |
| `/videos.html` | videos.html | yes | Legacy .html route (mixed style) |
| `/privacy.html`, `/terms.html` | privacy.html, terms.html | yes | OG/Twitter exempt (check-seo.mjs UTILITY_INDEXABLE) |
| `/pricing.html` | pricing.html | noindex,nofollow | Stripe payment links; keep/retire pending owner (MAINTENANCE_PLAN.md:44-51) |
| `/card.html` | card.html | noindex,follow | QR/NFC landing page (printed stickers target it) |
| `/pay/success.html`, `/pay/cancel.html` | pay/ | noindex | Stripe return URLs |
| `/404.html` | 404.html | noindex | GitHub Pages custom 404 |
| `/qr-stickers-print.html` | qr-stickers-print.html | noindex,nofollow | Print utility; no viewport meta |
| **MISSING** `/service-areas/malta-il/`, `/genoa-il/`, `/kingston-il/` | — | — | Confirmed cities with no page |
| **MISSING** landscaping-design, leaf-removal, gutter-cleaning, pressure-washing | — | — | Services with no dedicated page (homepage `?service=` anchors only, index.html:565-618) |

**Language architecture:** English-only markup at every URL. assets/js/i18n.js swaps innerHTML after a `[data-lang-switch]` click on only 3 of 18 pages (index.html, gallery.html, videos.html — verified by grep). No `/es/` URLs, zero `hreflang` matches repo-wide, `<html lang="en">` everywhere. card.html has a separate unrelated data-en/data-es mini-toggle (card.js). Schema claims `inLanguage:["en","es"]` (index.html:2634,2655) — an overclaim vs. what is crawlable.

## 2. Current SEO State (Pass/Fail)

| Area | Status | Evidence |
|---|---|---|
| Titles | PARTIAL | Unique, exist on all pages (check-seo.mjs:123); 6 over ~60 chars, worst snow-removal/index.html:6 (73 chars); also sycamore-il:6 (64), dekalb-il:6 (62), lawn-care:6, tree-removal:6, cortland-il:6 (61). No length gate in check-seo.mjs |
| Meta descriptions | PARTIAL | Present everywhere; 6 exceed ~155 chars: service-areas/index.html:7 (~179), sycamore-il (~173), dekalb-il (~169), cortland-il (~167), index.html:7-10 (~161), gallery.html (~162). check-seo.mjs:136 band (70-180) too loose |
| H1s | PASS | Exactly one per page across all 18 public HTML files; CI-enforced (check-seo.mjs:124) |
| Canonicals | PASS | Absolute https canonical on every indexable page (e.g. index.html:55, lawn-care/index.html:24); CI-enforced (check-seo.mjs:126-135). Minor: 404.html:9 has an unnecessary canonical |
| Open Graph / Twitter | PARTIAL | Full OG+Twitter set CI-enforced on indexable pages; but `og:type=business.business` used without namespace prefix (index.html:30), and card.html:10-15 has OG but zero twitter:* tags |
| hreflang / lang | FAIL | Zero hreflang matches repo-wide; no /es/ URLs; Spanish is JS-only innerHTML swap on 3 of 18 pages (assets/js/i18n.js:538-575); inLanguage:["en","es"] overclaim (index.html:2634,2655; schema.jsonld:205,226) |
| LocalBusiness schema | PARTIAL | Homepage HomeAndConstructionBusiness @graph complete and NAP-correct (index.html:2434-2625, mirrored schema.jsonld); but 4 service-area pages re-declare the same `#organization` @id with conflicting url/image/areaServed (dekalb-il:100-117, sycamore-il:96-113, cortland-il:96-113, service-areas/index.html:117-129); schema.jsonld is orphaned (no page links it; only copied by prepare-publish.mjs:36) |
| Service schema | PARTIAL | Correct Service+Breadcrumb+FAQ graph on 3 service pages (e.g. lawn-care/index.html:152-253); areaServed lists only DeKalb/Sycamore/Cortland (lawn-care:175-200 etc.) while same-page FAQ copy names 6 cities (lawn-care:133); 4+ services have no page/schema at all |
| FAQ schema | PARTIAL | Service/city pages: FAQPage matches visible content (PASS there). Homepage FAQPage (index.html:2669-2714) has NO visible FAQ section — grep for "Frequently Asked Questions" in index.html returns zero; rich-result eligibility risk |
| Breadcrumbs | PARTIAL | Proper 2-level (service) and 3-level (city) BreadcrumbList on subpages (dekalb-il:118-126); homepage/schema.jsonld carries a useless single-item list (index.html:2657-2668; schema.jsonld:228-239) |
| Sitemap | PARTIAL | Structure PASS: all locs resolve, noindex pages excluded, image/video extensions, CI cross-checked. But lastmod is hand-maintained and batch-dated (all core URLs = 2026-07-06); no automation |
| Robots | PASS | Absolute Sitemap ref (robots.txt:9), full crawl allowed (robots.txt:5). Minor: dead `Disallow: /playwright-report/` (robots.txt:6) — path never published |
| NAP single-source consistency | PARTIAL | Address/phone/email/hours byte-consistent across all marketing pages + JSON-LD (verified). Exceptions: pricing.html:327,330 shows **(331) 645-1372** (not the confirmed number); tel: format drift (card.html:38 `tel:8155011478`; pay/success.html:106, pay/cancel.html:95,109 `tel:815-501-1478` vs sitewide `tel:18155011478`); CC recipient tiogilh@gmail.com (assets/js/main.js:327, index.html:1939) ≠ confirmed business email. No automated NAP drift gate exists |
| Mobile CTA (click-to-call) | PASS | assets/js/mobile-call-cta.js sticky call button on all public pages except qr-stickers-print.html (verified); correct tel:18155011478, 54px target, safe-area insets, aria-label. Not emergency-specific (generic "Call Now") |
| Menu/services crawlability | PASS | All services rendered as real HTML text (h2/h3/ul/li) — no image/PDF menus anywhere |
| Per-city coverage | FAIL | Only 3 of 6 confirmed cities have pages (dekalb-il, sycamore-il, cortland-il exist; malta/genoa/kingston verified absent). Footer renders Genoa/Malta as non-linked spans (index.html:2331-2338). City lists also contradict each other (see Section 3) |
| Per-service coverage | PARTIAL | 3 of 9 stated services have dedicated pages; landscaping design, leaf removal, gutter cleaning, pressure washing exist only as homepage `?service=` quote anchors (index.html:565-618); no /emergency-tree-service/ page despite 24/7 being a stated priority (only bullets: index.html:504, tree-removal/index.html:111) |
| Lead capture integrity | FAIL | Spam heuristic silently drops borderline real leads: `isLikelySpamLead` (assets/js/main.js:344-367) at spamScore≥2 shows the success modal, resets the form, and never POSTs to Web3Forms (main.js:578-594) — no log, no fallback. Verified by direct read |
| Performance | NOT-MEASURED | No Lighthouse/PageSpeed run in this audit environment. Mitigations present (loading="lazy", preload="none", media budgets) but no score claimed |

## 3. VALUES TO FILL (owner confirmation required)

- **Real Google Business Profile review short-link** — card.html:58 still ships the literal placeholder `https://g.page/r/YOUR_GOOGLE_REVIEW_LINK`; card.html is the printed-QR landing page (assets/js/print-stickers.js:3). Roadmap already tracks this (.github/MAINTENANCE_PLAN.md:52-54). Do not invent the ID.
- **Ownership of (331) 645-1372** — pricing.html:327,330 displays this number (plain text, not tel:) under the business name; does not match confirmed (815) 501-1478. Confirm whether it is the web agency's care-plan line (then relabel clearly) or an error (then replace/remove).
- **Authoritative service-city list** — brief confirms 6: DeKalb, Sycamore, Cortland, Malta, Genoa, Kingston. But index.html FAQ schema (line 2694) + areaServed (index.html:2489-2570; schema.jsonld:60) also claim Rochelle, Hinckley, St. Charles, West Chicago; card.html:33 says "DeKalb • Sycamore • St. Charles" (omits Cortland). One list must win before citations/new pages expand further.
- **Stripe pages keep/retire decision** — pricing.html + pay/success.html + pay/cancel.html; open decision pending Stripe account verification (.github/MAINTENANCE_PLAN.md:44-51). Determines whether to fix or remove the `#sid` bug and precache entries.
- **Bilingual architecture decision** — real indexable `/es/` URLs with bidirectional hreflang (recommended for the "Se Habla Español" brand) vs. extending the JS toggle to all pages vs. status quo. Do not implement hreflang against the current single-URL toggle.
- **tiogilh@gmail.com** (assets/js/main.js:327 `FORM_CC_RECIPIENT`; index.html:1939 hidden `ccemail` field) — confirm this is an authorized form-notification recipient or replace with the confirmed business email. (The Web3Forms access key in index.html is public by design — not a leaked secret.)
- **beautifullandscapes.net testimonial source** (index.html:1573) — confirm the directory listing is claimed/legitimate and the quoted review ("Robert Tolito") is accurately sourced before relying on it as a trust signal.
- **Admin media-upload panel** — i18n.js:68+ carries unused admin.* / SMS-verification translation keys referencing a missing assets/js/firebase-config.js; confirm planned feature vs dead code before stripping.
- **Copy/local details for new city pages** — Malta/Genoa/Kingston page content (local FAQs, landmarks) benefits from owner input, though the cities themselves are confirmed.

## 4. OFF-SITE LIST

- **Birdeye hours discrepancy (brief-flagged):** no Birdeye reference exists anywhere in the repo (verified by full-text search) — check the live Birdeye profile directly against confirmed hours **Mon-Fri 7am-6pm, Sat 8am-4pm** and correct there.
- **Wrong Yelp entity:** scripts/check-seo.mjs:19-24 permanently bans `yelp.com/biz/hernandez-lawn-care-chicago` (a Chicago-area lookalike previously at risk of being linked). No such link exists in the repo now, but verify the *correct DeKalb* Yelp listing is claimed and that no off-site citation or GBP field still points at the Chicago entity.
- **Yelp/BBB NAP citation cleanup — still open:** audit-report.md:34-35 and seo-fixes-checklist.md:36-38 list "NAP Citation Cleanup" as unchecked. Standardize all citations to `1029 Lewis St, DeKalb, IL 60115 | (815) 501-1478`.
- **Name-collision risk:** multiple other "Hernandez Landscaping" businesses in IL (Rockford, Aurora, Chicago) per audit-report.md:34 — de-duplicate in aggregators/GBP to prevent entity cross-contamination.
- **Review generation:** GBP had no reviews as of the 2026-05-18 audit (seo-fixes-checklist.md Priority 2, unchecked); obtain the review short-link (Section 3) and start the review funnel — the printed QR cards depend on it.
- **beautifullandscapes.net directory listing** (linked from index.html:1573): verify its NAP/hours match confirmed values, or replace the testimonial source with a GBP/Yelp review.
- **Facebook sameAs URL** (index.html:2574; schema.jsonld:145) is the only external identity signal in schema — spot-check the Page is live/correct; consider adding the GBP URL to sameAs once confirmed.

## 5. Redesign vs Improve-in-Place

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Performance failure | NOT-MEASURED (no fail recorded) | No Lighthouse run possible in audit env; lazy-loading + preload="none" + CI media budgets (scripts/check-media-budget.mjs) mitigate the large hernandez_images/ tree. Run a real field test before claiming anything |
| 2 | Mobile responsiveness + tappable CTAs above the fold | PASS | Viewport meta on every page except noindex qr-stickers-print.html; hero CTAs full-width on mobile (index.html:260-393); sitewide sticky call button; CI viewport sweep at 320px (check-publish-layout.mjs) |
| 3 | Clear above-the-fold value prop + primary CTA | PASS | H1 + subtitle + "Request Free Estimate" + "Call Now" tel CTA (index.html:260-333) |
| 4 | Menu/services as image or PDF | PASS (n/a) | All service content is crawlable HTML text; no PDF/image menus found |
| 5 | Broken layout / illegible contrast | PASS (no evidence of failure) | check-publish-layout.mjs gates overflow/viewport-escape/broken images on every deploy across 4 viewports; no offenders found in markup/CSS sampled |

**Final verdict: IMPROVE IN PLACE (0 of 5 criteria fail; redesign requires 2+).** Conversion fundamentals are solid; ROI is in content coverage (city/service pages), bilingual architecture, schema integrity, and the lead-capture fix.
**Blast-radius constraint: no typography, brand-color, or logo changes regardless of any other work.**

## 6. Prioritized Implementation Checklist

### P0 — critical/high, unblocked

- [x] P0-1 Stop silently dropping borderline leads: in assets/js/main.js (isLikelySpamLead 344-367; invocation 578-594), keep honeypot/`botcheck`/timing as hard-block, but for phrase/URL-score-only trips still POST to Web3Forms with a `[Possible Spam]` subject tag instead of returning early with a fake success modal. *Accept:* a message containing 2 URLs + one SPAM_PHRASE reaches Web3Forms tagged; honeypot-filled submission still blocked; tests/e2e/instant-estimate.spec.ts updated and green.
- [x] P0-2 Fix duplicate `#organization` @id conflicts: service-areas/{index,dekalb-il,sycamore-il,cortland-il}/index.html re-declare `https://hernandezlandscapeservices.com/#organization` with conflicting url/image/areaServed — replace with `{"@id": ".../#organization"}` references (pattern already correct at videos.html:664). *Accept:* only index.html/schema.jsonld fully define the org node; `npm run seo:check` green.
- [x] P0-3 Build `/service-areas/malta-il/`, `/service-areas/genoa-il/`, `/service-areas/kingston-il/` by cloning service-areas/dekalb-il/index.html (HomeAndConstructionBusiness ref per P0-2 + 3-level BreadcrumbList + FAQPage matching visible copy). Add to sitemap.xml, service-areas hub grid + ItemList (service-areas/index.html:74-86,132-137), and convert footer spans (index.html:2331-2338) to links. *Accept:* pages exist with unique title/description/canonical; `seo:check` + `publish:check-layout` green; hub and footer link all 6 cities.
- [x] P0-4 Add Malta/Genoa/Kingston City entries to Service.areaServed on lawn-care/index.html:175-200, snow-removal/index.html:175-200, tree-removal/index.html:174-199 — matching the visible FAQ copy already on those pages (e.g. lawn-care:133). *Accept:* areaServed matches on-page copy; JSON-LD valid.
- [x] P0-5 Add a visible homepage FAQ section using the exact 5 Q&A pairs already in index.html:2669-2714 JSON-LD (mirror the accordion pattern from tree-removal/). *Accept:* rendered FAQ text matches schema verbatim; `publish:check-layout` green at 320px.
- [x] P0-6 24/7 emergency CTA prominence: add a distinct emergency strip ("Storm damage? 24/7 emergency tree removal — Call now" + tel link) near the top of index.html and tree-removal/index.html. No brand-color/typography changes — use existing utility classes. *Accept:* banner visible above the fold at 320px; tel:18155011478.
- [x] P0-7 Narrow `inLanguage` to `"en"` on WebSite/WebPage nodes (index.html:2634,2655; schema.jsonld:205,226) until crawlable /es/ pages exist. *Accept:* no bilingual claim in schema; visible "Se Habla Español" copy untouched.

### P1 — high/medium

- [ ] P1-1 Normalize mixed routes: migrate gallery.html → /gallery/, videos.html → /videos/; update every internal href (e.g. index.html:128,134,221,228; service-areas nav), canonicals, sitemap.xml, sw.js precache, scripts/prepare-publish.mjs DIRECTORIES; leave `<meta http-equiv="refresh">`+canonical stubs at old .html paths. NOTE: gallery/videos content is generated from media/gallery.json — move markers intact, use `npm run media:update`. *Accept:* clean URLs in sitemap; stubs redirect; `media:check` + `seo:check` + `publish:check-layout` green.
- [ ] P1-2 Shorten the 6 over-length titles (snow-removal 73→≤60 chars, etc.) and 6 over-length descriptions (≤155); then add title-length + description-length assertions to scripts/check-seo.mjs (tighten the 70-180 band at :136). *Accept:* `seo:check` fails on a 61+-char title fixture and passes on the repo.
- [ ] P1-3 Add a NAP drift gate: new scripts/verify-nap.mjs (or extension of check-seo.mjs:172-210) that greps the confirmed tuple (`1029 Lewis St`, `(815) 501-1478`/`+1-815-501-1478`/`tel:18155011478`, `hernandezlandscapetreeservices@gmail.com`, hours 07:00-18:00/08:00-16:00) across all shipped HTML + schema.jsonld, diffs schema.jsonld vs index.html's embedded block, and fails on drift; wire into `test:ci` (package.json:11). *Accept:* gate fails if any file's phone is edited; green on fixed repo.
- [ ] P1-4 Normalize tel:/sms: URIs to `tel:18155011478` / `sms:18155011478` in card.html:38,43, pay/success.html:106, pay/cancel.html:95,109. *Accept:* repo-wide grep shows a single tel format (pricing.html's number pending B-2).
- [ ] P1-5 Fix pay/success.html:114-118 — add the missing `<span id="sid"></span>` or remove the dead session-id script (per keep/retire decision B-4; MAINTENANCE_PLAN.md:44-46). *Accept:* no null-deref path; page renders confirmation or script removed.
- [ ] P1-6 Standardize CSS href to absolute versioned `/assets/css/styles.css?v=<version>` on index.html:71, gallery.html:38, videos.html:38 (currently unversioned relative; service pages already versioned, e.g. dekalb-il:23); ideally stamp the version alongside scripts/stamp-sw-version.mjs. *Accept:* all pages request the same versioned URL.
- [ ] P1-7 Resync sw.js precache (URLS_TO_CACHE lines 2-36): add `/assets/js/mobile-call-cta.js`, align CSS entry (line 24) with the versioned URL strategy, reflect P1-1 route changes; prefer generating the list from prepare-publish.mjs data. *Accept:* precache list matches shipped assets; no 404s in SW install.
- [ ] P1-8 Standardize the favicon/manifest head block (icon.ico + 32/16 + apple-touch-icon + manifest + theme-color) across all pages — city pages have only favicon.ico (e.g. dekalb-il:22); privacy/terms/404/card/pricing/pay/qr pages have none; add a favicon-presence assertion to check-seo.mjs. *Accept:* identical block on every page; new gate green.
- [ ] P1-9 Build dedicated pages for landscaping design, leaf removal, gutter cleaning, pressure washing from the tree-removal/index.html template (Service + Breadcrumb + FAQ schema, city links, sitemap entries). *Accept:* 4 new clean-route pages; all gates green.
- [ ] P1-10 Add a placeholder-link lint to check-seo.mjs: fail on `YOUR_`, `PLACEHOLDER`, `g.page/r/YOUR` substrings in href attributes (guards the card.html:58 class of regression). *Accept:* gate fails on current card.html until B-1 lands.

### P2 — low / hygiene

- [x] P2-1 Remove the single-item homepage BreadcrumbList (index.html:2657-2668; schema.jsonld:228-239). *Accept:* JSON-LD valid; subpage breadcrumbs untouched.
- [x] P2-2 gallery.html:462-466 — change `about` to `{"@id": ".../#organization"}` (drop anonymous LocalBusiness re-declaration). *Accept:* matches videos.html:664 pattern.
- [ ] P2-3 Backfill VideoObject markup for the ~30 videos.html videos missing schema (3 of ~33 covered at videos.html:666-747) — generate from media/gallery.json via update-media.mjs so it can't drift. *Accept:* every rendered video card has a VideoObject; `media:check` green.
- [ ] P2-4 Delete orphaned assets/css/proposal.css (proposal.html removed 2026-06-10 per MAINTENANCE_PLAN.md:57; zero references remain). *Accept:* no grep hits; publish artifact shrinks.
- [ ] P2-5 Remove dead `Disallow: /playwright-report/` (robots.txt:6) — path never in the publish allowlist. *Accept:* robots.txt still passes seo:check.
- [ ] P2-6 Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` to qr-stickers-print.html. *Accept:* present; print layout unchanged.
- [ ] P2-7 Drop the self-canonical from 404.html:9. *Accept:* seo:check green.
- [ ] P2-8 Add twitter:* card tags to card.html (has OG only, lines 10-15). *Accept:* parity with other pages.
- [ ] P2-9 Declare the OG namespace prefix for `business.business` on the `<html>` tag sitewide, or simplify og:type to `website` (index.html:30 et al.). *Accept:* consistent choice everywhere.
- [ ] P2-10 Dev-tooling hygiene: archive/delete scripts/cleanup_gallery_classes.py (hardcoded Mac path, one-off) and consolidate scripts/generate-screenshots.{js,ts} (duplicate; both target nonexistent `#contact`/`.image-gallery` selectors). *Accept:* one working script or removal.
- [ ] P2-11 Automate sitemap lastmod from git history (e.g. scripts/update-sitemap-lastmod.mjs using `git log -1 --format=%cd` per file) or drop lastmod on static pages. *Accept:* lastmod reflects real change dates.
- [ ] P2-12 Make JSON-LD WebPage.description (index.html:2641) byte-identical to the (shortened, per P1-2) meta description. *Accept:* strings match.
- [ ] P2-13 Resolve schema.jsonld's role: wire it as the generation source for index.html's embedded block, or document it as a manually-synced reference copy in MAINTENANCE_PLAN.md. *Accept:* documented or automated; P1-3 gate protects sync either way.

### Blocked on owner (do not start until the named value lands)

- [ ] B-1 Replace `https://g.page/r/YOUR_GOOGLE_REVIEW_LINK` at card.html:58 with the real GBP review short-link. **Blocked on:** real review link (Section 3). Then remove/keep the P1-10 lint exception.
- [ ] B-2 Fix or relabel the (331) 645-1372 number at pricing.html:327,330 (if kept, make it a tel: link with a clear "website care plan" label distinct from the landscaping business line). **Blocked on:** ownership confirmation.
- [ ] B-3 Reconcile the service-city list across index.html FAQ schema (:2694), areaServed (:2489-2570; schema.jsonld:60), and card.html:33; trim or confirm Rochelle/Hinckley/St. Charles/West Chicago. **Blocked on:** authoritative city list.
- [ ] B-4 Keep vs retire pricing.html + pay/* Stripe pages; if retired, remove from prepare-publish ROOT_FILES, EXTRA_ROUTES, and sw.js. **Blocked on:** Stripe account decision (MAINTENANCE_PLAN.md:44-51).
- [ ] B-5 Implement the chosen bilingual architecture (preferred: `/es/` routes for homepage + service + city pages with bidirectional hreflang + x-default, `<html lang="es">` baked in, sourced from i18n.js `translations.es`; alternative: extend the toggle to all pages). **Blocked on:** architecture decision + budget.
- [ ] B-6 Replace or confirm tiogilh@gmail.com CC recipient (assets/js/main.js:327; index.html:1939; asserted in tests/e2e/instant-estimate.spec.ts:66). **Blocked on:** owner confirmation.
- [ ] B-7 Strip unused admin.* i18n keys (i18n.js:68+) if the admin panel is dead code. **Blocked on:** planned-feature confirmation.
- [ ] B-8 Keep or replace the beautifullandscapes.net-sourced testimonial (index.html:1573). **Blocked on:** source verification.

## 7. Verification Commands

```bash
cd E:/Codebases/hernandezlandscapeservices

# Full CI gate (what deploy.yml runs before publishing)
npm ci
npm run build                  # Tailwind -> assets/css/styles.css
npx playwright install chromium
npm run test:ci                # media:check + media:budget + seo:check + Playwright e2e

# Individual gates
npm run seo:check              # scripts/check-seo.mjs — H1/title/canonical/OG/JSON-LD/sitemap/banned-links
npm run media:check            # media/gallery.json drift check (never hand-edit generated regions)
npm run media:budget           # per-asset/per-surface size budgets
npm run publish:prepare        # build whitelisted publish/ artifact (fails on missing referenced media)
npm run publish:check-layout   # headless-Chromium 320/390/768/1440px overflow + broken-image + 404 sweep

# NAP grep sweep (expect ONLY confirmed values; flag anything else)
grep -rn "1029 Lewis" --include="*.html" . --exclude-dir=node_modules --exclude-dir=publish
grep -rnE "tel:[0-9+-]+" --include="*.html" . --exclude-dir=node_modules --exclude-dir=publish | grep -v "tel:18155011478"   # should be empty after P1-4
grep -rn "331) 645\|331-645" --include="*.html" . --exclude-dir=node_modules   # pricing.html until B-2 resolves
grep -rn "hernandezlandscapetreeservices@gmail.com" --include="*.html" . --exclude-dir=node_modules

# Placeholder / broken-link checks
grep -rn "YOUR_GOOGLE_REVIEW_LINK\|PLACEHOLDER\|YOUR_" --include="*.html" . --exclude-dir=node_modules
grep -rn "hreflang" --include="*.html" . --exclude-dir=node_modules   # empty today; non-empty only after B-5

# JSON-LD local validation (structural; check-seo.mjs already gates validity + @context)
node -e "const s=require('fs').readFileSync('schema.jsonld','utf8'); JSON.parse(s); console.log('schema.jsonld: valid JSON')"
# For rich-result eligibility, paste rendered pages into Google's Rich Results Test manually (no API in repo).
```

## 8. Phase 2 Execution Notes

**Branch:** `seo/phase2-implementation` (per engagement task list). One commit per major task category, gates green at every commit:

1. `fix(leads): stop silent-dropping borderline form submissions` — P0-1 (+ e2e test update).
2. `fix(schema): dedupe #organization @id, drop homepage breadcrumb, inLanguage=en` — P0-2, P0-7, P2-1, P2-2, P2-12.
3. `feat(service-areas): add malta-il, genoa-il, kingston-il pages + areaServed` — P0-3, P0-4 (footer/hub/sitemap in same commit).
4. `feat(home): visible FAQ section + 24/7 emergency CTA strip` — P0-5, P0-6.
5. `feat(content): landscaping-design, leaf-removal, gutter-cleaning, pressure-washing pages` — P1-9.
6. `refactor(routes): gallery + videos to clean directory routes with stubs` — P1-1 (sitemap + sw.js + prepare-publish in same commit; atomic or not at all).
7. `fix(meta): title/description lengths + check-seo length/favicon/placeholder gates` — P1-2, P1-8, P1-10.
8. `feat(ci): NAP drift gate` — P1-3 (wire into test:ci).
9. `chore(hygiene): tel normalization, CSS versioning, sw precache, orphans, robots, viewport` — P1-4..P1-7, P2-4..P2-9, P2-10, P2-11.
10. Owner-blocked items (B-1..B-8) each land as their own commit when unblocked.

**Repo-specific constraints the Execution Engineer must not break (from Section 2 PASS rows and gate inventory):**
- `media/gallery.json` is the single source of truth for gallery.html/videos.html/homepage carousel/sitemap media — edit the manifest and run `npm run media:update`; never hand-edit between START/END markers (`media:check` fails on drift).
- `scripts/prepare-publish.mjs` allowlist is deliberate build hygiene — new directories (gallery/, videos/, new service pages) must be added to DIRECTORIES or they silently won't ship.
- `publish:check-layout` gates 320px viewport overflow with a documented exception list (mobile menu, fixed call CTA) — new banners/sections must pass at xs320; don't widen tolerances to make a failure pass.
- `check-seo.mjs` BANNED_EXTERNAL_LINKS (wrong Chicago Yelp entity) must stay; extend, never remove.
- SW cache-busting is stamped per-deploy by scripts/stamp-sw-version.mjs — don't hand-edit CACHE_NAME.
- Keep the sticky mobile call CTA (assets/js/mobile-call-cta.js) wired on every new page template.
- Noindex set (pricing, card, pay/*, 404, qr-stickers-print) and their sitemap exclusion are deliberate — preserve.
- Blast radius: no typography, brand-color, or logo changes anywhere in Phase 2.
- NAP: use only the confirmed values (1029 Lewis St, DeKalb, IL 60115 / (815) 501-1478 / hernandezlandscapetreeservices@gmail.com / Mon-Fri 7am-6pm, Sat 8am-4pm) or `{{PLACEHOLDER}}` tokens pending Section 3 answers — never guess.
