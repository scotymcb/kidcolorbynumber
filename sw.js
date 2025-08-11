const CACHE_NAME = 'kidcolorbynumber-v1';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/db.js',
    '/js/image-processor.js',
    '/js/pwa.js',
    '/js/lib/localforage.min.js',
    '/js/lib/jspdf.umd.min.js',
    '/js/lib/imagetracer.min.js',
    '/manifest.webmanifest',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/images/sample-dinosaur.jpg',
    '/assets/images/sample-rocket.jpg'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching app shell');
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // If we have a cached response, return it.
            if (response) {
                return response;
            }
            // Otherwise, fetch from the network.
            return fetch(event.request);
        })
    );
});
