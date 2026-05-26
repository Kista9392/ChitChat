const CACHE_NAME = 'relay-pwa-cache-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Bulletproof install: don't fail if caching fails
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Optional cache, ignore errors
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
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
