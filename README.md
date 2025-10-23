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
export PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
export PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
export PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
export PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
export PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
export PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
# Optional (Analytics):
# export PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID"
export ADMIN_PHONE_ALLOWLIST="+18155011478,+13316451372" # Example numbers in E.164 format
```

The build script will then create `assets/js/firebase-config.js` and `admin/firebase-config.js` automatically:

```bash
npm run build
```

> The two generated files remain git-ignored; they only exist in the build output.

### Uploading photos via the admin portal

- Open `https://<your-domain>/admin/admin.html` and sign in with a phone number that exists in `ADMIN_PHONE_ALLOWLIST`.
- Successful uploads land in Firebase Storage under `gallery-images/`. The public gallery (`#gallery` on `index.html`) lists that folder and shows the newest items first.
- When you add or remove numbers from the allowlist, update the corresponding environment variable so the next deploy keeps the admin portal in sync with your Firebase Storage security rules.

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
