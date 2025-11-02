const CACHE_NAME = 'hernandez-landscape-v4';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/assets/js/static-gallery.js',
  '/assets/js/i18n.js',
  '/manifest.json',
  '/sw.js',
  '/hernandez_images/web_Logo.jpg',
  '/hernandez_images/web_Wideshot_Bestlandscape_Person.jpeg',
  '/hernandez_images/web_hero_mobile.jpg',
  '/hernandez_images/web_After1.jpeg',
  '/hernandez_images/web_Before1.jpeg',
  '/hernandez_images/web_IMG_9256.jpeg',
  '/hernandez_images/web_IMG_9259.jpeg',
  '/hernandez_images/web_Wideshot_Bestlandscape.jpg',
  '/hernandez_images/web_Wideshot_Bestlandscape2.jpeg',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

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
