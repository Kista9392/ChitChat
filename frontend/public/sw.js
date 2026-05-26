self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch event handler required to satisfy PWA WebAPK installation criteria
  event.respondWith(
    fetch(event.request).catch((err) => {
      // Offline fallback if request is in cache, otherwise let it fail
      return caches.match(event.request).then((response) => response || Promise.reject(err));
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New notification', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new message!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/messages'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Pacely Alert', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data.url;
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
