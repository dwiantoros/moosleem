// Minimal service worker for reliable push notifications
self.addEventListener('notificationclick', (event) => {
  const action = event.action || 'open-app';
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (action === 'stop-azan') {
        for (const client of list) {
          client.postMessage({ type: 'STOP_AZAN' });
        }

        // Keep page state as-is when stopping adzan from notification
        return;
      }

      const targetUrl = (event.notification.data && event.notification.data.url) || '/';

      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'OPEN_URL', url: targetUrl });
          return client.focus();
        }
      }

      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = null;
  try {
    payload = event.data.json();
  } catch {
    payload = null;
  }

  if (!payload || !payload.title) return;

  const options = {
    body: payload.body,
    tag: payload.tag,
    requireInteraction: Boolean(payload.requireInteraction),
    silent: false,
    icon: payload.icon || '/logo-muslim-traveler.svg',
    badge: payload.badge || '/favicon.svg',
    image: payload.image,
    data: { url: payload.url || '/' },
    actions: Array.isArray(payload.actions) ? payload.actions : undefined,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
