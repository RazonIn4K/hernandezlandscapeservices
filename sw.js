const CACHE_NAME = 'hernandez-landscape-v7';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/pricing.html',
  '/pay/success.html',
  '/pay/cancel.html',
  '/assets/js/static-gallery.js',
  '/assets/js/i18n.js',
  '/manifest.json',
  '/hernandez_images/web_Logo.jpg',
  '/hernandez_images/web_Wideshot_Bestlandscape_Person.jpeg',
  '/hernandez_images/web_hero_mobile.jpg',
  '/hernandez_images/web_After1.jpeg',
  '/hernandez_images/web_Before1.jpeg',
  '/hernandez_images/web_IMG_9256.jpeg',
  '/hernandez_images/web_IMG_9259.jpeg',
  '/hernandez_images/web_Wideshot_Bestlandscape.jpg',
  '/hernandez_images/web_Wideshot_Bestlandscape2.jpeg'
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
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
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
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());
  return networkResponse;
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
