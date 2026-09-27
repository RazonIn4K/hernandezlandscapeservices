# Growth Rings design record

The design sign-off for the `feat/growth-rings` branch was recorded on September 23, 2026 in PR #49. This record describes the implementation being reviewed. The existing logo, contact details, hours, service list, estimator ranges, and form spam controls remain governed by their existing source files and publish checks.

## Visual system

- **Idea:** a tree cross-section carries the hero photo; concentric rings connect the crew's tree work to the seasons of outdoor care.
- **Type:** self-hosted Big Shoulders Display for headings, Big Shoulders Stencil Display for short labels, and Public Sans for body copy. Font files are in `assets/fonts/`.
- **Colors:** canopy `#153b2f`, deep canopy `#0c2a20`, leaf `#2f6f4f`, moss `#8aa63f`, limestone `#f5f2e9`, sapwood `#e9dcc3`, heartwood `#6b4a33`, and clay `#c26435`. The seasonal accent is spring `#3f7d4a`, summer `#a57c12`, fall `#b0582b`, or winter `#286f9f`.
- **Components:** the ring hero, seasonal wheel, property plan, call-first storm band, and Crew Cam frames live in `assets/css/rings.css`. The existing Tailwind green and gray utilities are remapped in `tailwind.config.js`. Standalone utility pages use `assets/css/storm.css` for the storm band without changing their layouts.

## Seasonal wheel content

The wheel opens on the current month in `America/Chicago`. These are guide months, not availability or scheduling promises. Visitors can select a month by pointer, arrow keys, Home/End, or the previous/next controls. Without JavaScript, the four seasonal lists remain visible.

| Months | Season | Linked services |
| --- | --- | --- |
| March–May | Spring | Spring cleanup, lawn care, landscaping, tree trimming |
| June–August | Summer | Lawn care, landscaping, pressure washing, storm-damage tree help |
| September–November | Fall | Leaf removal, gutter cleaning, tree removal, lawn care |
| December–February | Winter | Snow removal subject to availability, tree removal, storm-damage tree help |

The owner should review the month-to-service mapping if seasonal operations change. English and Spanish home pages use the same mapping.

## Quote and storm behavior

The property plan mirrors a real checkbox list. A single selected service fills the existing quote service field. Multiple selections fill “Multiple Services” and add a generated yard-areas line to the project description; changing the selection replaces that generated line while retaining visitor text. The Spanish landing page carries selections to the bilingual quote form.

Storm mode is controlled by `assets/data/site-status.json`. A `true` value shows the call-first band; a failed status fetch leaves it hidden. The service worker fetches the switch from the network without cached fallback. The band promises neither availability nor a response time.

## Round 2: living seasons and roots

- **Hero weather** (`initWeather` in `rings.js`, `[data-weather-hero]` on the English and Spanish home pages) follows the same month logic and `?month=0-11` hook as the wheel: fall leaves, winter snow with a still drift, spring petals with grass that grows once, summer fireflies. The SVG is built once from fixed tables (no randomness), pauses off-screen and in hidden tabs, and draws no particles for reduced motion (the still drift or grass remains). At 1280px and wider the particles stay in the ring column; below that they sit behind the text at 34% opacity.
- **Roots footer:** every `footer.bg-gray-900` opens with a decorative soil cross-section: a grass fringe, pebbled topsoil, and a cut stump (the tree-ring mark) whose shallow root plate stays in a text-free band above the footer columns. The roots draw on a scroll-driven view timeline behind `@supports` and are fully drawn otherwise. Footer text is reset to at least 4.5:1 on the soil color. `tests/e2e/living-seasons.spec.ts` checks that no root passes behind footer text or controls at 1440, 1024, 768, and 390 px. `scripts/generate_local_pages.js` renders the same soil into the city pages.
- **When we do this:** eight English and four Spanish service pages show a compact month ring from the mapping above, plus an "In season now" or "Next in season" chip. The emergency pages are skipped on purpose: the mapping lists storm help only in summer and winter, and a "next in season" chip there would read as "not now".
- **Craft:** a tape-measure scroll indicator under the header (scroll timeline, hidden where unsupported), cross-document view transitions (none for reduced motion), taped field-notebook prints on `/gallery/` (generated markup unchanged), yard areas that stamp into the quote form, and a "Wrong trail" 404.

## Round 3: one walk through the yard

- **The two forms do different jobs, so they now share one chapter.** `#quoteForm` (in `#instant-quote`) is the starting-range calculator with its own quick send; `#contactForm` (in `#quote`) is the full request with the `botcheck` and `website` honeypots and `classifyLeadSpam`. "Walk your yard" (step 1) runs straight into "Tell us about it" (step 2): the full form leads and the optional "Price check" sits beside it. On phones the price check folds closed; it is open without JavaScript, on desktop, and when reached through `#instant-quote` links. `#pricing` folds in as a note. Endpoints, field names, honeypots, and dispatch behavior are unchanged and pinned in `tests/e2e/one-walk.spec.ts`.
- **Proof chapter:** the before/after slider sits beside a strip of video tours, followed by one work filmstrip: three static prints plus the six latest uploads from `static-gallery.js`, captioned from existing gallery keys. Both strips are labelled, focusable scroll regions with previous/next buttons and a count.
- **Layout:** compact two-column service tiles on phones; values and "What to expect" merged into one field-notes page after the reviews; area and FAQ side by side from 1024 px; paired footer columns on phones.
- **Order:** hero, services, seasonal wheel, proof, walk your yard with the request, reviews, field notes, area with FAQ, footer.
- **Home height (local Chrome):** about 21,000 px at 390 and 13,600 px at 1440 before; at most 13,000 and 9,500 px after, guarded by `one-walk.spec.ts`.
