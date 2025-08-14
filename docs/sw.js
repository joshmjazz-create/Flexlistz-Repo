const CACHE_NAME = 'flexlist-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/index-sWxL5Got.js',
  './assets/index-DzAg56Ja.css',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // For navigation requests, always return the cached index.html for SPA routing
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        
        // Try to fetch from network
        return fetch(event.request).catch(() => {
          // If network fails and it's a navigation request, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});