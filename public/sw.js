// Minimal Service Worker for PWA
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through fetch (no caching for now to avoid complexity with Server Actions)
    event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
    let payload = {
        title: 'TAS',
        body: 'You have a new notification.',
        url: '/dashboard',
        tag: undefined,
        data: {},
    };

    if (event.data) {
        try {
            const json = event.data.json();
            payload = {
                title: json?.title || payload.title,
                body: json?.body || payload.body,
                url: json?.url || payload.url,
                tag: json?.tag,
                data: json?.data || {},
            };
        } catch {
            const text = event.data.text();
            if (text) {
                payload.body = text;
            }
        }
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            tag: payload.tag,
            data: { ...(payload.data || {}), url: payload.url },
            icon: '/icon-192.png',
            badge: '/icon-192.png',
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const notificationData = event.notification.data || {};
    const targetUrl = notificationData.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) {
                    if ('navigate' in client && client.url && !client.url.includes(targetUrl)) {
                        return client.navigate(targetUrl).then((navigatedClient) => navigatedClient?.focus());
                    }
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }

            return undefined;
        })
    );
});
