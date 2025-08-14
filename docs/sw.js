const CACHE_NAME = 'flexlist-v3';
const urlsToCache = [
  './',
  './index.html',
  './assets/index-BxcOZVi2.js',
  './assets/index-N_b_mgf1.css',
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

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        // For navigation requests or hash URLs, always return the cached index.html
        if (event.request.mode === 'navigate' || 
            event.request.url.includes('#') ||
            event.request.destination === 'document') {
          console.log('Serving index.html for navigation:', event.request.url);
          return caches.match('./index.html').then(indexResponse => {
            if (indexResponse) {
              return indexResponse;
            }
            // Fallback to the root cache key
            return caches.match('./');
          });
        }
        
        // Try to fetch from network first
        return fetch(event.request)
          .then(networkResponse => {
            console.log('Fetched from network:', event.request.url);
            return networkResponse;
          })
          .catch(() => {
            console.log('Network failed for:', event.request.url);
            // If network fails and it's a navigation request, return index.html
            if (event.request.mode === 'navigate' || event.request.destination === 'document') {
              return caches.match('./index.html').then(indexResponse => {
                if (indexResponse) {
                  return indexResponse;
                }
                return caches.match('./');
              });
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