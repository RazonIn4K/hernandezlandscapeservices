# Gallery / Media Workflow

One manifest, one command. `media/gallery.json` is the single source of truth
for every gallery, carousel, and video item on the site. `npm run media:update`
regenerates all the places that media appears, so the pages never drift apart.

## Adding or changing media

1. **Drop raw files locally** into `media/inbox/` (or the legacy
   `iCloud Photos/` folder). Both are gitignored — raw photos/videos are never
   committed.
2. **Optimize** (optional, local-only, needs `ffmpeg` on PATH):

   ```sh
   python scripts/optimize_media.py
   # or: python scripts/optimize_media.py --source "iCloud Photos"
   ```

   This writes web-ready `web_*.webp` / `web_*.mp4` / `web_*_poster.jpg` files
   into `hernandez_images/` (the committed, optimized media folder). Skips
   files that already exist.
3. **Edit `media/gallery.json`**:
   - Add an item to `items` with `id`, `type` (`image` | `video`), `src`
     (must be under `hernandez_images/`), `alt` + `caption` for images,
     `poster` for videos, plus `tags` and `featured` as appropriate.
   - Optional per-surface fields: `gallery` (`title`, optional `titleKey`
     i18n key for the EN/ES toggle, optional `alt` override for the gallery
     page) and `sitemap` (`title` + `caption` for images; `title`,
     `description`, `publicationDate` for videos).
   - Add the item's `id` to the `surfaces` lists where it should appear
     (ordered; first entry renders first):
     - `galleryPage` → photo cards on `gallery.html`
     - `homeGallery` → `staticImages` in `assets/js/static-gallery.js`
       (the homepage "Latest Uploads" carousel shows the first 6)
     - `videosPage` → video cards on `videos.html`
     - `sitemapGalleryImages` / `sitemapVideos` → media entries in
       `sitemap.xml` under the gallery.html / videos.html URLs
4. **Regenerate**:

   ```sh
   npm run media:update
   ```

   The script validates the manifest first (files exist on disk, required
   fields present, surface ids resolve) and fails with a list of errors if
   anything is off. It only rewrites the regions between the
   `*:GENERATED:START` / `*:GENERATED:END` markers; everything else in those
   files — including the hand-maintained page entries in `sitemap.xml` — is
   left untouched. Running it twice produces zero diff.
5. **Review the diff, run the tests, commit** (including the regenerated
   `gallery.html`, `videos.html`, `assets/js/static-gallery.js`,
   `sitemap.xml`, the new files in `hernandez_images/`, and
   `media/gallery.json` itself):

   ```sh
   git diff
   npm run media:budget
   npm test
   ```

## Rules

- Never hand-edit the generated regions; your edits will be overwritten by
  the next `npm run media:update`. Edit `media/gallery.json` instead.
- Generation happens at build time into committed HTML (not at runtime in
  JS) so search engines always see the full markup.
- `media/inbox/` and `iCloud Photos/` are gitignored raw sources; only
  optimized output in `hernandez_images/` is committed.
- `scripts/optimize_media.py` is optional and local-only; `npm run
  media:update` never requires it.
- CI runs `npm run media:check` on every deploy and fails the build if any
  generated region drifted from `media/gallery.json` (for example after a
  hand edit inside the markers, or a manifest change committed without
  regenerating). Fix by running `npm run media:update` and committing.
- Run `npm run media:budget` after adding photos or videos. It checks only
  manifest-referenced public assets and fails if a new gallery image, poster,
  individual video, or total media surface becomes too heavy.
