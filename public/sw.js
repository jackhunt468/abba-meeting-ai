const CACHE_NAME = 'abba-smart-meeting-v1';
const APP_SHELL = ['/', '/index.html', '/logo-abba.png'];
const STATIC_ASSET_PATTERN = /\.(?:m?js|css|png|jpe?g|svg|webp|ico|woff2?|ttf|webmanifest)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    const appShell = await cache.match('/index.html') || await cache.match('/');
    if (appShell) {
      const html = await appShell.text();
      const assetPaths = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:m?js|css|png|svg|woff2?)(?:\?[^"']*)?)["']/gi)]
        .map((match) => new URL(match[1], self.location.origin).href)
        .filter((url) => new URL(url).origin === self.location.origin);
      await Promise.all(assetPaths.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        } catch (error) {
          console.warn('Static asset could not be cached during install:', url, error);
        }
      }));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('abba-smart-meeting-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseCopy));
          }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/')))
    );
    return;
  }

  if (!STATIC_ASSET_PATTERN.test(requestUrl.pathname)) return;
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          }
          return response;
        });
      })
  );
});
