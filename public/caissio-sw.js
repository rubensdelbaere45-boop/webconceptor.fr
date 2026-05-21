// Caissio Service Worker — offline-first PWA
const CACHE_NAME = "caissio-v1";

// App shell — pages to pre-cache so the app works offline
const PRECACHE = [
  "/caissio/login",
  "/caissio/app/pos",
  "/caissio/app/dashboard",
  "/caissio/app/produits",
  "/caissio/app/stock",
  "/caissio/app/clients",
  "/caissio/app/abonnement",
  "/caissio/app/parametres",
  "/caissio-manifest.json",
  "/caissio-icon.svg",
];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests for same-origin or Unsplash images
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Cache Unsplash product images (stale-while-revalidate)
  if (url.hostname === "images.unsplash.com") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fresh = fetch(event.request).then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        });
        return cached || fresh;
      })
    );
    return;
  }

  // Same-origin: network first, fall back to cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
