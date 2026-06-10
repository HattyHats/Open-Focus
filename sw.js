const CACHE_NAME = 'open-focus-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

// Install Event: Cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network first, fallback to cache, and inject COOP/COEP headers to enable SharedArrayBuffer
self.addEventListener('fetch', event => {
  const isNavigation = event.request.mode === 'navigate';
  const isWorker = event.request.destination === 'worker' || event.request.destination === 'sharedworker';

  if (isNavigation || isWorker) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status === 0) return response;

          const newHeaders = new Headers(response.headers);
          newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
});
