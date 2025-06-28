// Update the cache name whenever static assets change so users get the
// latest files rather than a stale cached version.
const CACHE_NAME = 'dice-castle-v2';
const urlsToCache = [
'/',
'/index.html',
'/styles.css',
'/app.js',
'/gameState.js',
'/exploration.js',
'/settlement.js',
'/ui.js',
'/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => {
console.log('Opened cache');
return cache.addAll(urlsToCache);
})
.catch(error => {
console.error('Failed to cache resources:', error);
})
);
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
event.respondWith(
caches.match(event.request)
.then(response => {
// Cache hit - return response
if (response) {
return response;
}

    // Clone the request because it's a stream
    const fetchRequest = event.request.clone();

    return fetch(fetchRequest).then(response => {
      // Check if we received a valid response
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // Clone the response because it's a stream
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
        });

      return response;
    }).catch(() => {
      // Network failed, try to return cached version
      return caches.match('/index.html');
    });
  })

);
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
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
})
);
});

// Handle background sync for saving game data (optional enhancement)
self.addEventListener('sync', event => {
if (event.tag === 'background-sync') {
event.waitUntil(
// Could implement background save sync here if needed
console.log('Background sync triggered')
);
}
});

// Handle push notifications (for future features)
self.addEventListener('push', event => {
if (event.data) {
const data = event.data.json();
const options = {
body: data.body,
data: data.url
};

event.waitUntil(
  self.registration.showNotification(data.title, options)
);

}
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
event.notification.close();

if (event.notification.data) {
event.waitUntil(
clients.openWindow(event.notification.data)
);
}
});