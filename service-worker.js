/**
 * Tangle-me Service Worker
 * Strategy:
 *   - Mutable files (HTML/CSS/JS): Network-first, cache fallback (3s timeout)
 *   - API endpoints (/api/*): Network-first, cache fallback (5s timeout)
 *   - Navigate requests: Network-first, serve offline.html on failure
 *   - Images: Cache-first with long expiry
 *   - Static assets (icons, manifest): Cache-first
 */

const CACHE_VERSION = 'tm-v5';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const API_CACHE     = `${CACHE_VERSION}-api`;
const IMG_CACHE     = `${CACHE_VERSION}-img`;

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/tangle-me-logo-original.png',
  '/apple-touch-icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512-maskable.png',
];

const MUTABLE_FILES = [
  '/',
  '/index.html',
  '/post.html',
  '/find.html',
  '/style.css',
  '/script.js',
  '/tangle-lightbox.js',
  '/tangle-lightbox.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('tm-') && k !== SHELL_CACHE && k !== API_CACHE && k !== IMG_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (isMutableFile(url.pathname)) {
    event.respondWith(networkFirstWithTimeout(request, SHELL_CACHE, 3000));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithFallback(request, IMG_CACHE));
    return;
  }

  event.respondWith(cacheFirstWithFallback(request, SHELL_CACHE));
});

function isMutableFile(pathname) {
  return MUTABLE_FILES.includes(pathname) ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.html');
}

async function networkFirstWithTimeout(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  const networkPromise = fetch(request).then(response => {
    if (response && response.status === 200) cache.put(request, response.clone());
    return response;
  });
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), timeout));
  const response = await Promise.race([networkPromise, timeoutPromise]);
  if (response) return response;
  const cached = await cache.match(request);
  return cached || new Response(JSON.stringify({ error: 'offline', cached: false }), {
    status: 503, headers: { 'Content-Type': 'application/json' }
  });
}

async function cacheFirstWithFallback(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch { return new Response('', { status: 404 }); }
}

// Push notifications
self.addEventListener('push', event => {
  let data = { title: 'Tangle-me', body: 'You have a new message', icon: '/tangle-me-logo-original.png', badge: '/tangle-me-logo-original.png', tag: 'tangle-message', data: { url: '/' } };
  if (event.data) {
    try { const p = event.data.json(); data.title = p.title || data.title; data.body = p.body || data.body; data.tag = p.tag || data.tag; data.data = p.data || data.data; }
    catch (e) { data.body = event.data.text() || data.body; }
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: data.icon, badge: data.badge, tag: data.tag,
    renotify: true, requireInteraction: false, vibrate: [200, 100, 200], data: data.data,
    actions: [{ action: 'open', title: '💬 View' }, { action: 'dismiss', title: 'Dismiss' }]
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('tangle-me.com') && 'focus' in client) {
          client.focus(); client.postMessage({ type: 'OPEN_MESSAGES' }); return;
        }
      }
      return clients.openWindow(urlToOpen + '?action=open_messages');
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

console.log('[Tangle-me SW] v5 — network-first for mutable files');
