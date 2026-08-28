const CACHE_NAME = 'openfocus-pro-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const isNav = event.request.mode === 'navigate';
  const isWorker = event.request.destination === 'worker' || event.request.destination === 'sharedworker';

  if (isNav || isWorker) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (!res || res.status === 0) return res;
          const headers = new Headers(res.headers);
          headers.set("Cross-Origin-Embedder-Policy", "require-corp");
          headers.set("Cross-Origin-Opener-Policy", "same-origin");
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: headers
          });
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
