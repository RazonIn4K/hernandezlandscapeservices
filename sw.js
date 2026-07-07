const CACHE_NAME = 'hernandez-landscape-v17';
// Directory routes are precached in their canonical '/x/' form only — internal
// links always use that form, and doubling each page as '/x/index.html' made
// every SW install fetch 14 identical documents twice.
const URLS_TO_CACHE = [
  '/',
  '/gallery/',
  '/videos/',
  '/tree-removal/',
  '/lawn-care/',
  '/snow-removal/',
  '/service-areas/',
  '/service-areas/dekalb-il/',
  '/service-areas/sycamore-il/',
  '/service-areas/cortland-il/',
  '/service-areas/malta-il/',
  '/service-areas/genoa-il/',
  '/service-areas/kingston-il/',
  '/es/service-areas/sycamore-il/',
  '/es/service-areas/cortland-il/',
  '/es/service-areas/malta-il/',
  '/landscaping-design/',
  '/leaf-removal/',
  '/gutter-cleaning/',
  '/pressure-washing/',
  '/card.html',
  '/privacy.html',
  '/terms.html',
  '/assets/css/styles.css?v=20260519',
  '/assets/css/custom.css',
  '/assets/css/gallery.css',
  '/assets/css/video.css',
  '/pricing.html',
  '/pay/success.html',
  '/pay/cancel.html',
  '/assets/js/main.js',
  '/assets/js/static-gallery.js',
  '/assets/js/i18n.js',
  '/assets/js/gallery.js',
  '/assets/js/mobile-call-cta.js',
  '/assets/js/analytics.js',
  '/assets/js/emergency-dispatch.js',
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
