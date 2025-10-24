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

### Uploading files via the admin portal

- Open `https://<your-domain>/admin/admin.html` and sign in with a phone number that exists in `ADMIN_PHONE_ALLOWLIST`.
- The system accepts photos, videos, PDFs, and documents (Word docs, etc.).
- Upload by dragging and dropping files onto the upload area, or click "Choose files" to browse.
- Works on both desktop and mobile devices - the interface adapts to smaller screens.
- Successful uploads land in Firebase Storage under `gallery-images/`. The public gallery (`#gallery` on `index.html`) lists that folder and shows the newest items first.
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

### Gallery metadata & Firestore

- Every uploaded photo or video now creates a document in the Cloud Firestore collection `media`. Each doc stores the download URL, thumbnail URL, MIME type, media category, optional title/description, uploader phone number, and timestamps.
- Enable Cloud Firestore for your Firebase project before deploying. Uploads include a "Publish immediately" toggle in the admin portal; if you leave it off, the Firestore doc is created with `published: false` and you can flip the status later from the built-in media manager. Ordering uses a single `createdAt` field, so no composite indexes are required (Firestore will prompt you to create one when needed).
- When Firestore asks for an index to support `where(published == true)` + `orderBy(createdAt)`, accept the prompt and save the generated URL so future deployments can recreate the index quickly.
- Media files are written to `media/` and thumbnails to `thumbnails/` in Firebase Storage. Legacy photos in `gallery-images/` (or the earlier `gallery-media/` path) continue to work; the public site reads from Firestore first and falls back to those Storage buckets if Firestore is unavailable.
- Update your Firebase security rules so only authenticated, allow-listed phone numbers can write to these paths. Use this as a starting point (tighten to your needs — for production, replace the admin token check with your allowlist logic):

  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /media/{itemId} {
        allow read: if resource.data.published == true;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
    }
  }

  service firebase.storage {
    match /b/{bucket}/o {
      match /media/{file=**} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
      match /thumbnails/{file=**} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
    }
  }
  ```

  Adjust the `allow write` rules to mirror your allowlist or custom claims before going live, and remember to toggle `published` to `true` when a media item is ready for the public gallery.

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
