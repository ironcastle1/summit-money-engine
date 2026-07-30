const VERSION = '16.9.4-instant';
const STATIC_CACHE = `summit-static-${VERSION}`;
const SHELL = [
  '/', '/index.html', '/app.bundle.js?v=16.9.4', '/css/app.css?v=16.9.4',
  '/offline.html', '/manifest.webmanifest', '/icons/summit-icon.svg', '/assets/world-base.svg',
  '/data/fallback-events.json', '/data/fallback-news.json', '/data/fallback-market.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('summit-') && name !== STATIC_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_RUNTIME') event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('summit-')).map(name => caches.delete(name)))));
});

function isStatic(request, url) {
  return url.origin === self.location.origin && ['script', 'style', 'image', 'font', 'manifest'].includes(request.destination);
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // API traffic is deliberately never intercepted. A stale PWA response must not
  // hide a healthy server or turn an upstream timeout into a false offline state.
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request).catch(async () => (await caches.match('/offline.html')) || Response.error()));
    return;
  }
  if (isStatic(request, url) || url.pathname.startsWith('/data/')) event.respondWith(networkFirst(request));
});
