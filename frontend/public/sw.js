const CACHE_NAME = 'relay-pwa-cache-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only precache static assets — never cache dynamic Next.js routes like '/'
      return cache.addAll([
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png',
        '/favicon.ico'
      ]).catch((err) => console.log('Optional cache failed, continuing', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  // Single waitUntil with both clients.claim() and old cache cleanup
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Network-first strategy: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
