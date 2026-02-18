const CACHE_NAME = 'chatapp-v1';
const STATIC_ASSETS = [
    '/',
    '/chatapp.png',
    '/google.jpg',
    '/github.png',
];
// ─────────────────────────────────────────────────────────────────────────────
// sw.js — ADD these lines to your existing service worker (public/sw.js)
// They handle the SHOW_NOTIFICATION message sent from useNotifications.ts
// ─────────────────────────────────────────────────────────────────────────────

// Listen for messages from the page
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, tag, data } = event.data;

        event.waitUntil(
            self.registration.showNotification(title, {
                body,
                icon: icon || '/chatapp.png',
                badge: '/chatapp.png',
                tag: tag || 'chat-notification',
                data: data || {},
                vibrate: [100, 50, 100],
                requireInteraction: false,
            })
        );
    }
});

// When user clicks the notification, focus/open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) return client.focus();
            }
            // Otherwise open a new window
            if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/');
        })
    );
});

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first for API/socket calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Always go network-first for API, auth, and socket routes
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket') ||
        request.method !== 'GET'
    ) {
        return; // Let the browser handle it normally
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request))
    );
});