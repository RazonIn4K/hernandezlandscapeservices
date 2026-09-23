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
