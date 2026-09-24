const CACHE_NAME = 'hernandez-landscape-v37';
// Round 4 (research 03 R18): install caches only the core shell: the two home
// pages, the one stylesheet, the scripts they run, and the fonts. Everything else
// (service and town pages, gallery, videos, images) is cached at runtime on first
// visit by the fetch handler below; billing pages (/pay/*), card.html and
// pricing.html are no longer fetched on install at all.
const URLS_TO_CACHE = [
  '/',
  '/es/',
  '/assets/css/site.css?v=20260924u',
  '/assets/css/fonts-late.css?v=20260924l',
  '/assets/js/i18n.js?v=20260924u',
  '/assets/js/main.js?v=20260924u',
  '/assets/js/rings.js?v=20260924v',
  '/assets/js/static-gallery.js?v=20260924i',
  '/assets/js/motion.js',
  '/assets/js/analytics.js',
  '/assets/js/mobile-call-cta.js',
  '/assets/js/price-range-placeholder.js',
  '/assets/js/service-nav.js',
  '/assets/fonts/big-shoulders-display-v24-latin-var.woff2',
  '/assets/fonts/public-sans-v21-latin-var.woff2',
  '/assets/fonts/big-shoulders-stencil-display-v30-latin-700.woff2',
  '/assets/fonts/public-sans-v21-latin-italic.woff2',
  '/assets/icons/fa-solid-900-subset.woff2',
  '/assets/icons/fa-brands-400-subset.woff2',
  '/manifest.json',
  '/hernandez_images/web_Logo_New_256.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(URLS_TO_CACHE);
      await self.skipWaiting();
    } catch (error) {
      console.error('[service-worker] Failed to pre-cache', error);
    }
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  const isRangeRequest = event.request.headers.has('range');
  const isMediaRequest = /\.(mp4|webm|mov|m4v|mp3|wav|ogg)$/i.test(requestURL.pathname);

  if (isRangeRequest || isMediaRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  // The owner-editable storm switch must fail closed when the network is unavailable.
  if (requestURL.pathname === '/assets/data/site-status.json') {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate' || requestURL.pathname === '/' || requestURL.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

// Favor fresh HTML so content updates (like pricing changes) deploy immediately.
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    await cacheResponseIfSafe(request, networkResponse);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  const networkResponse = await fetch(request);
  await cacheResponseIfSafe(request, networkResponse);
  return networkResponse;
}

async function cacheResponseIfSafe(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return;
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
