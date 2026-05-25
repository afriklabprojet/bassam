// Service Worker for VIP Parfumerie Bar PWA
const CACHE_NAME = 'vip-parfumerie-v3';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/offline.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  globalThis.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  globalThis.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip video/audio streams — Range requests return partial (206) responses
  // that cannot be cloned or cached by the SW without a full media cache strategy.
  const dest = event.request.destination;
  if (dest === 'video' || dest === 'audio') {
    return;
  }

  // Skip cross-origin requests (fonts.googleapis.com, pexels, supabase storage…)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  if (event.request.mode === 'navigate' || dest === 'document') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r ?? new Response('Offline', { status: 503, statusText: 'Service Unavailable' }))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      // Try network request
      return fetch(fetchRequest)
        .then((response) => {
          // Only cache valid same-origin 200 responses (not opaque, not partial)
          if (response?.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => new Response('', { status: 503, statusText: 'Service Unavailable' }));
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletterSubscriptions());
  }
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

// Sync newsletter subscriptions made offline
async function syncNewsletterSubscriptions() {
  try {
    const cache = await caches.open('newsletter-pending');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Retry subscription
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      // Remove from cache if successful
      await cache.delete(request);
    }
  } catch (error) {
    console.error('Newsletter sync failed:', error);
    throw error;
  }
}

// Sync orders made offline
async function syncPendingOrders() {
  try {
    const cache = await caches.open('orders-pending');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Retry order creation
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      // Remove from cache if successful
      await cache.delete(request);
    }
  } catch (error) {
    console.error('Orders sync failed:', error);
    throw error;
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nouvelle notification de VIP Parfumerie Bar',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
      },
      {
        action: 'close',
        title: 'Fermer',
      },
    ],
  };
  
  event.waitUntil(
    globalThis.registration.showNotification(data.title || 'VIP Parfumerie Bar', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
