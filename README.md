# Hernandez Landscape Services Website

Production-ready website for Hernandez Landscape & Tree Service LLC.

## Tailwind CSS Build

The website now uses a compiled CSS file instead of the Tailwind CDN for better performance.

### Building CSS

To rebuild the CSS after making changes to Tailwind classes in the HTML:

```bash
npm run build-css
```

For development with auto-rebuild on changes:

```bash
npm run watch-css
```

### Setup

If you clone this repository, run:

```bash
npm install
```

### Firebase configuration

The build relies on environment variables to generate Firebase config files that stay out of version control. Before running `npm run build`, define the following variables in your shell (or in your hosting provider):

```bash
export PUBLIC_FIREBASE_API_KEY="AIzaSyA8vJUZ7443oyptRcOJs7Ig_gbrwCSB5bA"
export PUBLIC_FIREBASE_AUTH_DOMAIN="hernandez-photo.firebaseapp.com"
export PUBLIC_FIREBASE_PROJECT_ID="hernandez-photo"
export PUBLIC_FIREBASE_STORAGE_BUCKET="hernandez-photo.appspot.com"
export PUBLIC_FIREBASE_MESSAGING_SENDER_ID="312479713819"
export PUBLIC_FIREBASE_APP_ID="1:312479713819:web:4788b418257451097a06be"
export PUBLIC_FIREBASE_MEASUREMENT_ID="G-WN7Z0S51HW"
export ADMIN_PHONE_ALLOWLIST="+18155011478,+13316451372"
```

The build script will then create `assets/js/firebase-config.js` and `admin/firebase-config.js` automatically:

```bash
npm run build
```

> The two generated files remain git-ignored; they only exist in the build output.

### Files

- `index.html` - Main website file
- `styles.css` - Compiled Tailwind CSS (15KB minified)
- `src/input.css` - Tailwind input file
- `tailwind.config.js` - Tailwind configuration

### Performance Benefits

- Reduced file size: From ~3MB (CDN) to 15KB (compiled)
- Faster load times
- No dependency on external CDN
- Only includes CSS classes actually used in the HTML
