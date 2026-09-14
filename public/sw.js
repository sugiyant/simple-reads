const CACHE_NAME = 'simple-reads-v4';
const ASSETS = [
  '/',
  '/explore/',
  '/archive/',
  '/about/',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.claim();
});

// Helper function to match cache with trailing slash normalization
async function matchCacheWithNormalization(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // 1. Try exact match
  let response = await cache.match(request);
  if (response) return response;

  // 2. Try normalized trailing slash match
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path.startsWith('/articles/')) {
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const pathsToTry = [cleanPath, cleanPath + '/'];
    
    for (const p of pathsToTry) {
      const altUrl = new URL(p, url.origin).toString();
      response = await cache.match(altUrl);
      if (response) return response;
    }
  }

  return null;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API calls or dynamic pages, try network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/articles/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          return await matchCacheWithNormalization(event.request);
        })
    );
    return;
  }

  // For static assets, cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Background sync to prefetch all articles when online
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PREFETCH_ALL') {
    event.waitUntil(
      fetch('/api/get-articles')
        .then(res => res.json())
        .then(articles => {
          caches.open(CACHE_NAME).then(cache => {
            // Cache the JSON list
            cache.put('/api/get-articles', new Response(JSON.stringify(articles)));
            
            // Cache individual article routes (both with and without trailing slash)
            articles.forEach(article => {
              const urlNoSlash = `/articles/${article.slug}`;
              const urlWithSlash = `/articles/${article.slug}/`;

              // Prefetch without slash
              fetch(urlNoSlash).then(res => {
                if (res.ok) cache.put(urlNoSlash, res);
              }).catch(() => {});

              // Prefetch with slash (for complete offline redundancy)
              fetch(urlWithSlash).then(res => {
                if (res.ok) cache.put(urlWithSlash, res);
              }).catch(() => {});
            });
          });
        }).catch(() => {})
    );
  }
});
