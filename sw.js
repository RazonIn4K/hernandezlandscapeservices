const CACHE_NAME = 'hernandez-landscape-v17';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/gallery/',
  '/gallery/index.html',
  '/videos/',
  '/videos/index.html',
  '/tree-removal/',
  '/tree-removal/index.html',
  '/lawn-care/',
  '/lawn-care/index.html',
  '/snow-removal/',
  '/snow-removal/index.html',
  '/service-areas/',
  '/service-areas/index.html',
  '/service-areas/dekalb-il/',
  '/service-areas/dekalb-il/index.html',
  '/service-areas/sycamore-il/',
  '/service-areas/sycamore-il/index.html',
  '/service-areas/cortland-il/',
  '/service-areas/cortland-il/index.html',
  '/service-areas/malta-il/',
  '/service-areas/malta-il/index.html',
  '/service-areas/genoa-il/',
  '/service-areas/genoa-il/index.html',
  '/service-areas/kingston-il/',
  '/service-areas/kingston-il/index.html',
  '/landscaping-design/',
  '/landscaping-design/index.html',
  '/leaf-removal/',
  '/leaf-removal/index.html',
  '/gutter-cleaning/',
  '/gutter-cleaning/index.html',
  '/pressure-washing/',
  '/pressure-washing/index.html',
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
