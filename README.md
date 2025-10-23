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
- Upload photos by dragging and dropping onto the upload area, or click "Choose photos" to browse.
- Works on both desktop and mobile devices - the interface adapts to smaller screens with larger touch targets.
- Successful uploads land in Firebase Storage under `gallery-images/`. The public gallery (`#gallery` on `index.html`) lists that folder and shows the newest photos first.
- When you add or remove numbers from the allowlist, update the corresponding environment variable so the next deploy keeps the admin portal in sync with your Firebase Storage security rules.

### Phone auth configuration

The admin portal relies on Firebase phone authentication. The current implementation always sets `disableRecaptcha` to `false` to ensure real SMS delivery in production:

```html
<script>
  window.firebasePhoneAuthConfig = {
      disableRecaptcha: false
  };
</script>
```

- **Production**: `disableRecaptcha` is `false`, enabling real SMS delivery with reCAPTCHA verification required.
- **Development/Testing**: For local testing, you can manually edit the inline script to `disableRecaptcha: true` to bypass reCAPTCHA and SMS delivery (useful for testing without real phone numbers). Remember to revert this change before deploying.
- Firebase requires a completed reCAPTCHA check before sending verification SMS to real phone numbers. The flag is currently hardcoded to `false` for production safety.
- **Important**: Always verify the deployed admin portal renders `disableRecaptcha: false` in production via View Page Source. If testing locally, temporarily set to `true` only for development purposes.

### Bilingual content (English / Spanish)

- Both the public site and the admin portal render in English by default and provide an EN/ES toggle.
- Text that needs translation is marked with `data-i18n-*` attributes; all strings live in `assets/js/i18n.js`.
- To add or update copy:
  1. Edit the English source text directly in the markup.
  2. Add the corresponding Spanish translation to the `translations.es` section in `assets/js/i18n.js`.
- Any new admin UI strings should use the existing helper keys (see the `admin.*` entries) so the toggle stays in sync.

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
