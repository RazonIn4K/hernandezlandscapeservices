# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static marketing website for Hernandez Landscape & Tree Service LLC, a DeKalb County, IL landscaping business. The site is fully static (no backend required) with bilingual support (English/Spanish), photo gallery, contact forms, and pricing information.

**Tech Stack:** Static HTML, Tailwind CSS, vanilla JavaScript, Playwright tests

**Recent Migration:** This project was recently migrated from Firebase to a fully static approach. Firebase-related code remains in some files but is deprecated/non-functional.

## Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Build CSS (production)
npm run build

# Watch CSS (development)
npm run watch-css
# Alias: npm run dev

# Build CSS (one-off)
npm run build-css
```

### Testing
```bash
# Run all Playwright tests
npm run test

# Run tests with UI
npm run test:headed

# Run tests for CI
npm run test:ci
```

### Local Preview
```bash
# Build and serve locally
npm run build && npx serve -s . -l 3000
# Visit http://localhost:3000
```

## Architecture Overview

### Gallery System (Static)

The site uses a **dual-gallery approach**:

1. **Static Gallery** (`assets/js/static-gallery.js`): Active and functional
   - Hardcoded array of images in `staticImages`
   - Renders gallery from `hernandez_images/` folder
   - No backend dependencies
   - To add photos: Add entries to the `staticImages` array

2. **Firebase Gallery** (`assets/js/gallery.js`): Legacy/deprecated
   - Still loaded but won't function without Firebase
   - `firebase-config.js` exists but Firebase backend is not deployed
   - Do NOT use for new features

**Important:** When adding photos to the gallery, edit `assets/js/static-gallery.js` and add to the `staticImages` array.

### Bilingual System (i18n)

The site supports English/Spanish via `assets/js/i18n.js`:

- **Translation Keys:** Elements use `data-i18n-key` attributes
- **Translation Storage:** All translations in `translations` object in i18n.js
- **Language Persistence:** Stored in localStorage as `siteLanguage`
- **DOM Updates:** Automatic text/placeholder/title updates on language switch

**Adding Translations:**
1. Add element attribute: `data-i18n-key="services.heading"`
2. Add translations to both `translations.en` and `translations.es` objects
3. Use dot notation for nested structure (e.g., `"services.heading"`)

### Form Submission

Contact form uses **Web3Forms** (third-party service):
- Action URL: `https://api.web3forms.com/submit`
- Access key embedded in HTML (line 1061): `61e8b0ea-97d8-434c-8c2d-e54a44a63743`
- No backend required - emails delivered directly

### CSS Build Process

**Tailwind CSS** generates `styles.css` from `src/input.css`:
- Config: `tailwind.config.js` (scans `index.html`)
- Critical CSS inlined in `<style>` tags in HTML
- Full CSS loaded separately
- Use `npm run watch-css` during development

### Service Worker (PWA)

`sw.js` provides offline caching:
- Caches key assets for offline access
- Cache version: `CACHE_VERSION` constant
- Serves cached content when offline
- Recently cleaned of Firebase dependencies

## Key Files and Locations

### HTML/CSS
- `index.html` - Main single-page site (1470 lines, comprehensive)
- `src/input.css` - Tailwind source
- `styles.css` - Generated output (gitignored, rebuild with `npm run build-css`)
- `404.html` - Error page

### JavaScript
- `assets/js/static-gallery.js` - **Active gallery system** (add photos here)
- `assets/js/gallery.js` - Deprecated Firebase gallery (ignore)
- `assets/js/i18n.js` - Bilingual translation system
- `assets/js/firebase-config.js` - Legacy config (non-functional)
- `sw.js` - Service worker for offline caching

### Images
- `hernandez_images/` - All gallery photos
- Naming: `web_*.jpeg` or `web_*.jpg`
- Used by: `staticImages` array in `static-gallery.js`

### Tests
- `tests/e2e/static-gallery.spec.ts` - Gallery tests
- `tests/e2e/fixtures.ts` - Test fixtures
- `playwright.config.ts` - Test configuration

### Documentation
- `README.md` - Quick start and overview
- `DEPLOYMENT_GUIDE.md` - Hosting and deployment instructions
- `SIMPLE_PHOTO_GUIDE.md` - Photo management workflow
- `MIGRATION_CHECKLIST.md` - Firebase → static migration status

## Important Patterns and Conventions

### Photo Management Workflow

1. Receive photos from client (WhatsApp/Messenger)
2. Optimize images (max 1920x1080, <500KB, JPG format)
3. Save to `hernandez_images/` with `web_` prefix
4. Edit `assets/js/static-gallery.js`:
   ```javascript
   const staticImages = [
     {
       src: 'hernandez_images/web_NewPhoto.jpg',
       alt: 'Descriptive alt text for SEO',
       caption: 'Detailed caption for the photo'
     },
     // ... existing images
   ];
   ```
5. Build and deploy: `npm run build` then deploy

### Adding Bilingual Content

For new text content that needs translation:

1. Add attribute to HTML element:
   ```html
   <h2 data-i18n-key="newSection.heading">English Text</h2>
   ```

2. Add translations to `assets/js/i18n.js`:
   ```javascript
   const translations = {
     en: {
       "newSection.heading": "English Text",
       // ...
     },
     es: {
       "newSection.heading": "Texto en Español",
       // ...
     }
   };
   ```

### Firebase Code - Do Not Use

Several files contain Firebase code that is **deprecated and non-functional**:
- `assets/js/firebase-config.js` - Contains config but no active Firebase backend
- `assets/js/gallery.js` - Legacy dynamic gallery (replaced by static-gallery.js)
- Any imports or references to `firebase` in HTML

**Do not attempt to use or fix Firebase features.** The site is now fully static.

## Testing Strategy

Tests run via Playwright and use the `serve` package to host locally:

1. `npm run test` triggers Playwright
2. Playwright config starts web server: `npm run build && npx serve -s . -l 3000`
3. Tests run against `http://localhost:3000`
4. Tests verify:
   - Page loads
   - Pricing cards render
   - Gallery displays static images
   - Navigation works
   - Forms are present

## Deployment

The site is purely static - deploy to any static host:

- **Netlify:** `netlify deploy --prod --dir=.`
- **Vercel:** `vercel --prod`
- **GitHub Pages:** Via workflow (see DEPLOYMENT_GUIDE.md)
- **Traditional hosting:** FTP/SFTP all files

**Build before deploying:** Always run `npm run build` to regenerate `styles.css`.

## Common Tasks

### Task: Add a new photo to the gallery
1. Optimize the photo (resize, compress)
2. Save to `hernandez_images/web_NewName.jpg`
3. Edit `assets/js/static-gallery.js`
4. Add entry to `staticImages` array
5. Run `npm run build`
6. Deploy

### Task: Update pricing
1. Edit `index.html` (search for "pricing" section around line 677)
2. Modify pricing card HTML
3. Update both English text and `data-i18n-key` translations
4. Add Spanish translations to `assets/js/i18n.js`
5. Test locally, then deploy

### Task: Fix a translation
1. Find the `data-i18n-key` value in HTML
2. Edit `assets/js/i18n.js`
3. Update the corresponding key in `translations.es` object
4. Test with language toggle
5. Deploy

### Task: Run tests locally
1. Ensure dependencies are installed: `npm install`
2. Build the site: `npm run build`
3. Run tests: `npm run test`
4. Check report: `npx playwright show-report`

## Architecture Decisions

### Why Static Over Firebase?

This project migrated from Firebase to static hosting because:
- **Simplicity:** No authentication, database, or cloud functions to maintain
- **Cost:** Static hosting is free/cheap vs. Firebase's ongoing costs
- **Performance:** Faster load times with no runtime database queries
- **Maintenance:** Easier for non-technical team to manage via file updates

The photo workflow shifted from admin portal uploads to WhatsApp/Messenger → manual optimization → file updates.

### Why Dual Gallery Files Exist?

During migration, `gallery.js` (Firebase) was kept for reference while `static-gallery.js` was built. Both are loaded in `index.html`, but only `static-gallery.js` functions. `gallery.js` will gracefully fail (Firebase not configured) without breaking the site.

### Critical Rendering Path

The site uses several performance optimizations:
- **Critical CSS:** Inlined in `<style>` tags for above-the-fold content
- **Font preconnect:** Speeds up Google Fonts loading
- **Async Font Awesome:** Loaded with `media="print" onload="this.media='all'"`
- **Service Worker:** Caches assets for offline/repeat visits
- **Lazy loading:** Images use `loading="lazy"` (except first 6)

## Gotchas and Edge Cases

1. **Don't remove `firebase-config.js`:** Even though deprecated, `gallery.js` tries to load it. Its presence prevents console errors.

2. **Service worker caching:** When testing changes, clear browser cache or use incognito mode. The service worker aggressively caches assets.

3. **Tailwind purging:** The config only scans `index.html`. If adding Tailwind classes dynamically via JS, they may be purged. Use safelist or add to HTML.

4. **Translation HTML in JS:** Spanish translations can contain HTML (e.g., `<br>` tags). The i18n system uses `innerHTML`, not `textContent`.

5. **Web3Forms access key:** Hardcoded in HTML (line 1061). If form stops working, verify the access key is valid.

6. **Playwright baseURL:** Set to `http://localhost:3000`. If changing ports, update `playwright.config.ts`.

## File Organization Philosophy

The project follows a flat structure for simplicity:
- Root: HTML files, config files, compiled CSS
- `assets/js/`: All JavaScript
- `assets/css/`: Any additional CSS (currently unused)
- `hernandez_images/`: All photos
- `tests/e2e/`: End-to-end tests
- `src/`: Tailwind source CSS

This flat structure makes deployment simple (just upload everything) and reduces path complexity.
