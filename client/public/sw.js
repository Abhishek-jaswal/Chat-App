const CACHE_NAME = 'chatapp-v1';
const STATIC_ASSETS = [
    '/',
    '/chatapp.png',
    '/google.jpg',
    '/github.png',
];

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