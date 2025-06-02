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