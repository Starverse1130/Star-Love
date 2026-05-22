/* ============================================================
   PWA SERVICE WORKER — Do You Love Me? 💕
   Cache-first for local assets, network-first for external
   ============================================================ */

var CACHE_NAME = 'love-me-v2';

// Local assets to precache
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/pages/answer_file.html',
  '/pages/yes.html',
  '/pages/no1.html',
  '/pages/no2.html',
  '/pages/no3.html',
  '/css/style.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/css/accessibility.css',
  '/js/main.js',
  '/js/dodge.js',
  '/assets/icons/site.webmanifest',
  '/assets/icons/favicon.ico',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/StarTag.png',
  '/assets/icons/StarLogo.png'
];

/* --- INSTALL — Precache local assets ---------------------- */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

/* --- ACTIVATE — Clean old caches -------------------------- */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

/* --- FETCH — Route-based strategy ------------------------- */
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  // Skip chrome-extension and other non-http(s)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Google Fonts & Tenor — network-first (fresh content preferred)
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'tenor.com' ||
      url.hostname === 'media.tenor.com' ||
      url.hostname === 'media1.tenor.com') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Local assets — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default — network-first
  event.respondWith(networkFirst(request));
});

/* --- CACHING STRATEGIES ----------------------------------- */

// Cache-first: perfect for local static assets
function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;

    return fetch(request).then(function(response) {
      // Cache successful responses
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Offline fallback for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    });
  });
}

// Network-first: good for external/CDN resources
function networkFirst(request) {
  return fetch(request).then(function(response) {
    if (response.ok) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request);
  });
}

/* --- UPDATE — Allow skip waiting from page ---------------- */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
