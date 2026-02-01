// Minimal Service Worker for PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through fetch (no caching for now to avoid complexity with Server Actions)
    event.respondWith(fetch(event.request));
});
