// Inline SVG icons (round 5; replaces the two Font Awesome icon fonts).
//
// Pages: each icon is <svg class="icon icon-NAME"><use href="#i-NAME"/></svg>, and
// every page carries, right after <body>, one hidden inline sprite with the
// symbols it uses (withIconSprite). No icon file is requested.
// Scripts: markup built at run time uses the full path (icon(..., { inline: true })).
//
// Sized like the font glyphs they replace: 1em tall, the glyph's own advance
// wide, sitting 0.125em below the baseline, so text and boxes do not move.
// Colour follows the text (currentColor). Decorative: hidden from assistive tech.
import { ICONS } from './icons-data.mjs';

export { ICONS };

/** Class-attribute words that were Font Awesome's own. */
const FA_WORDS = new Set(['fa', 'fas', 'fab', 'far', 'fa-solid', 'fa-brands', 'fa-regular', 'fa-fw']);

function data(name) {
  const d = ICONS[name];
  if (!d) throw new Error(`icons: no icon "${name}" (add its path to scripts/icons-data.mjs)`);
  return d;
}

/**
 * @param {string} name icon name without "fa-" (e.g. "phone-alt")
 * @param {string} [cls] extra classes
 * @param {object} [o]
 * @param {string} [o.q] attribute quote ('"' in HTML; '\\"' inside a JSON string)
 * @param {boolean} [o.inline] full path instead of a sprite reference (run-time markup)
 */
export function icon(name, cls = '', { q = '"', inline = false } = {}) {
  const d = data(name);
  const extra = cls
    .split(/\s+/)
    .filter((c) => c && !FA_WORDS.has(c) && c !== `fa-${name}`)
    .map((c) => (c === 'fa-spin' ? 'icon-spin' : c))
    .join(' ');
  const a = (k, v) => ` ${k}=${q}${v}${q}`;
  const width = +(d.w / 512).toFixed(4);
  const open = `<svg${a('class', `icon icon-${name}${extra ? ` ${extra}` : ''}`)}${a('width', `${width}em`)}${a('height', '1em')}`;
  const hidden = `${a('aria-hidden', 'true')}${a('focusable', 'false')}>`;
  // The sprite's <symbol> carries the viewBox and alignment; a full path needs its own.
  return inline
    ? `${open}${a('viewBox', `0 0 ${d.w} 512`)}${a('preserveAspectRatio', 'xMinYMid meet')}${hidden}<path${a('fill', 'currentColor')}${a('d', d.d)}/></svg>`
    : `${open}${hidden}<use${a('href', `#i-${name}`)}/></svg>`;
}

const SPRITE_START = '<!-- @icons: scripts/icons.mjs (symbols this page uses; generated) -->';
const SPRITE_END = '<!-- /@icons -->';
const SPRITE_RE = /\n?[ \t]*<!-- @icons: [^\n]*-->[\s\S]*?<!-- \/@icons -->/;

/** Adds (or refreshes) the page's hidden sprite with exactly the symbols its icons use. */
export function withIconSprite(html) {
  const body = html.replace(SPRITE_RE, '');
  const names = [...new Set([...body.matchAll(/<use href="#i-([a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
  if (!names.length) return body;
  const symbols = names
    .map((n) => `<symbol id="i-${n}" viewBox="0 0 ${data(n).w} 512" preserveAspectRatio="xMinYMid meet"><path fill="currentColor" d="${data(n).d}"/></symbol>`)
    .join('');
  const sprite = `\n    ${SPRITE_START}\n    <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false">${symbols}</svg>\n    ${SPRITE_END}`;
  const m = body.match(/<body\b[^>]*>/);
  if (!m) throw new Error('icons: no <body> tag');
  const at = m.index + m[0].length;
  return body.slice(0, at) + sprite + body.slice(at);
}

/** The <i class="fas fa-…"></i> markup this replaces (HTML, or with \" quotes inside JSON strings). */
export const FA_TAG = /<i\s+class=(\\?["'])([^"'\\]*?\bfa-[^"'\\]*)\1([^>]*)><\/i\s*>/g;

export function replaceIcons(source, { inline = false } = {}) {
  let count = 0;
  const out = source.replace(FA_TAG, (whole, quote, classes) => {
    const words = classes.split(/\s+/).filter(Boolean);
    const names = words.filter((w) => w.startsWith('fa-') && !FA_WORDS.has(w) && w !== 'fa-spin').map((w) => w.slice(3));
    if (names.length !== 1) throw new Error(`icons: cannot read one icon name from ${whole}`);
    count++;
    const q = quote.startsWith('\\') ? '\\"' : quote === "'" ? "'" : '"';
    return icon(names[0], words.join(' '), { q, inline });
  });
  return { out, count };
}
