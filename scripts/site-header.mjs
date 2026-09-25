// One header for every page (round 4; research 05 X7, 03 R5).
// Same brand lock-up, nav, phone number and language link everywhere. The
// homepage keeps its hand-written copy of this header (in-page anchors).
// Rendered into static pages by scripts/apply-site-header.mjs and into the
// Spanish town pages by scripts/generate_local_pages.js.

import { icon } from './icons.mjs';

const COPY = {
  en: {
    home: '/',
    homeLabel: 'Hernandez Landscape home',
    logoAlt: 'Hernandez Landscape & Tree Service LLC Logo',
    tagline: 'DeKalb County landscape and tree service',
    nav: [
      ['services', '/#services', 'Services', 'nav.services'],
      ['work', '/gallery/', 'Our Work', 'nav.work'],
      ['videos', '/videos/', 'Videos', 'nav.videos'],
      ['reviews', '/#testimonials', 'Reviews', 'nav.reviews'],
      ['areas', '/service-areas/', 'Service Area', 'nav.serviceArea'],
    ],
    quote: 'Get Free Quote',
    call: 'Call (815) 501-1478',
    callShort: 'Call',
    primaryNav: 'Primary navigation',
    mobileNav: 'Mobile navigation',
    menu: 'Open navigation menu',
  },
  es: {
    home: '/es/',
    homeLabel: 'Inicio Hernandez Landscape',
    logoAlt: 'Logo de Hernandez Landscape & Tree Service LLC',
    tagline: 'Jardinería y servicio de árboles en DeKalb County',
    // Round 4 (research 05 X3): the Spanish nav stays on Spanish URLs; the work,
    // video and area links open those chapters of the Spanish home.
    nav: [
      ['services', '/es/#services', 'Servicios'],
      ['work', '/es/#gallery', 'Nuestro trabajo'],
      ['videos', '/es/#videos', 'Videos'],
      ['reviews', '/es/#testimonials', 'Reseñas'],
      ['areas', '/es/#service-area', 'Zonas de servicio'],
    ],
    quote: 'Cotización gratis',
    call: 'Llame al (815) 501-1478',
    callShort: 'Llamar',
    primaryNav: 'Navegación principal',
    mobileNav: 'Navegación móvil',
    menu: 'Abrir menú de navegación',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * @param {object} o
 * @param {'en'|'es'} o.lang
 * @param {{href:string,label:string,lang:'en'|'es',hint?:string}} [o.alt] language link (twin or other home)
 * @param {string} [o.quoteHref] the page's "free quote" target
 * @param {string} [o.current] nav key of the current section
 */
export function renderSiteHeader(o) {
  const c = COPY[o.lang];
  const quoteHref = o.quoteHref || (o.lang === 'es' ? '/es/#quote' : '/#quote');
  const cur = (id) => (o.current === id ? ' aria-current="page"' : '');
  const desk = c.nav
    .map(([id, href, label]) => `            <a href="${href}" class="text-sm font-semibold hover:text-green-600 transition"${cur(id)}>${label}</a>`)
    .join('\n');
  const mob = c.nav
    .map(([id, href, label]) => `          <a href="${href}" class="block rounded-lg px-3 py-3 font-semibold text-gray-700 hover:bg-green-50"${cur(id)}>${label}</a>`)
    .join('\n');
  const langLink = () => {
    const a = o.alt;
    const hint = a.hint ? ` <span class="lang-hint">${esc(a.hint)}</span>` : '';
    return `<a href="${a.href}" class="lang-link" hreflang="${a.lang}" lang="${a.lang}">${esc(a.label)}${hint}</a>`;
  };
  const menuLabel = `aria-label="${c.menu}"`;
  return `    <header id="header" class="site-header bg-white fixed top-0 w-full z-50 transition-all duration-300 shadow">
      <!-- @site-header: scripts/site-header.mjs (one header on every page; edit there) -->
      <div class="container mx-auto px-4">
        <nav class="flex justify-between items-center py-3" aria-label="${c.primaryNav}">
          <div class="flex items-center space-x-3">
            <a href="${c.home}" aria-label="${c.homeLabel}"><img src="/hernandez_images/web_Logo_New_256.png" alt="${esc(c.logoAlt)}" class="h-12 w-auto object-contain" width="256" height="192" /></a>
            <div>
              <p class="text-lg font-bold text-gray-800 leading-tight">Hernandez Landscape</p>
              <p class="text-xs text-gray-600 hidden md:block">${c.tagline}</p>
            </div>
          </div>
          <div class="desktop-nav hidden lg:flex items-center space-x-4">
${desk}
            <a href="tel:18155011478" class="header-tel">${icon('phone-alt')}<span>(815) 501-1478</span></a>
            ${langLink()}
            <a href="${quoteHref}" class="header-cta bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition text-sm font-bold shadow-md whitespace-nowrap">${c.quote}</a>
          </div>
          <div class="flex items-center gap-2 lg:hidden">
            ${langLink()}
            <a href="tel:18155011478" class="nojs-call" aria-label="${c.call}">${icon('phone-alt')}<span>${c.callShort}</span></a>
            <button id="mobileMenuButton" type="button" class="flex h-11 w-11 items-center justify-center rounded-full text-gray-700 hover:bg-green-50 hover:text-green-700" aria-controls="mobileMenu" aria-expanded="false" ${menuLabel}>${icon('bars', 'text-xl')}</button>
          </div>
        </nav>
      </div>
      <div id="mobileMenu" class="hidden absolute w-full border-t bg-white shadow-lg lg:hidden" aria-hidden="true">
        <nav class="container mx-auto space-y-1 px-4 py-4" aria-label="${c.mobileNav}">
${mob}
          <a href="tel:18155011478" class="block rounded-lg px-3 py-3 font-semibold text-gray-700 hover:bg-green-50">${c.call}</a>
          <a href="${quoteHref}" class="mt-2 block rounded-lg bg-green-600 px-3 py-3 text-center font-bold text-white hover:bg-green-700">${c.quote}</a>
        </nav>
      </div>
    </header>`;
}

// English pages with a Spanish twin, and the reverse.
export const TWINS = [
  '/tree-removal/',
  '/emergency-tree-removal/',
  '/tree-trimming-stump-grinding/',
  '/lawn-care/',
  '/landscaping-design/',
  '/service-areas/sycamore-il/',
  '/service-areas/cortland-il/',
  '/service-areas/malta-il/',
  '/service-areas/genoa-il/',
  '/service-areas/kingston-il/',
];

// English pages whose Spanish counterpart is a chapter of the Spanish home.
const CHAPTERS = { '/gallery/': '/es/#gallery', '/videos/': '/es/#videos' };

/** Language link for a route: its twin, or the other language's home. */
export function altFor(route) {
  if (route.startsWith('/es/')) {
    const en = route.slice(3) || '/';
    return { href: en === '/' || TWINS.includes(en) ? en : '/', label: 'English', lang: 'en' };
  }
  if (TWINS.includes(route)) return { href: `/es${route}`, label: 'Español', lang: 'es' };
  return { href: CHAPTERS[route] || '/es/', label: 'Español', lang: 'es', hint: '(inicio)' };
}
