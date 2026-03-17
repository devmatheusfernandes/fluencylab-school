self.OFFLINE_URL = "/~offline";
self.OFFLINE_CACHE = "offline-fallback-v1";
self.PAGES_CACHE = "pages-v1";

self.addEventListener("fetch", (event) => {
  if (self.workbox?.routing?.registerRoute) return;
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          const cache = await caches.open(self.PAGES_CACHE);
          await cache.put(event.request, response.clone());
          return response;
        } catch (e) {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          const offline =
            (await caches.match(self.OFFLINE_URL)) ||
            (await caches
              .open(self.OFFLINE_CACHE)
              .then((c) => c.match(self.OFFLINE_URL))
              .catch(() => null));

          return offline || Response.error();
        }
      })()
    );
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(self.OFFLINE_CACHE);
        const existing = await cache.match(self.OFFLINE_URL);
        if (existing) return;

        const response = await fetch(
          new Request(self.OFFLINE_URL, { cache: "reload" })
        );
        if (response?.ok) {
          await cache.put(self.OFFLINE_URL, response.clone());
        }
      } catch (e) {}
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.workbox?.routing?.registerRoute) {
        const hasNetworkFirst = !!self.workbox?.strategies?.NetworkFirst;
        const navigationStrategy = hasNetworkFirst
          ? new self.workbox.strategies.NetworkFirst({
              cacheName: self.PAGES_CACHE,
              networkTimeoutSeconds: 5,
            })
          : null;

        self.workbox.routing.registerRoute(
          ({ request }) => request.mode === "navigate",
          async (args) => {
            try {
              if (navigationStrategy) {
                const response = await navigationStrategy.handle(args);
                if (response) return response;
              } else {
                const request = args?.event?.request;
                if (request) {
                  const response = await fetch(request);
                  const cache = await caches.open(self.PAGES_CACHE);
                  await cache.put(request, response.clone());
                  return response;
                }
              }
            } catch (e) {}

            try {
              if (self.workbox?.precaching?.matchPrecache) {
                const match = await self.workbox.precaching.matchPrecache(
                  self.OFFLINE_URL
                );
                if (match) return match;
              }
            } catch (e) {}

            const cached =
              (await caches.match(self.OFFLINE_URL)) ||
              (await caches
                .open(self.OFFLINE_CACHE)
                .then((c) => c.match(self.OFFLINE_URL))
                .catch(() => null));
            if (cached) return cached;

            return Response.error();
          }
        );
      }

      if (self.workbox?.routing?.setCatchHandler) {
        self.workbox.routing.setCatchHandler(async ({ event: wbEvent }) => {
          if (wbEvent?.request?.destination === "document") {
            if (self.workbox?.precaching?.matchPrecache) {
              const match = await self.workbox.precaching.matchPrecache(
                self.OFFLINE_URL
              );
              if (match) return match;
            }

            const cached = await caches.match(self.OFFLINE_URL);
            if (cached) return cached;
          }

          return Response.error();
        });
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Notificação", body: event.data.text() };
    }
  }

  const title = data.title || "Notificação";
  const body = data.body || "";
  const icon = data.icon || "/favicon.ico";
  const badge = data.badge || "/favicon.ico";
  const url = data.url || "/hub";
  const type = data.type || "info";

  event.waitUntil(
    (async () => {
      const reg = self.registration;
      await reg.showNotification(title, {
        body,
        icon,
        badge,
        data: { url, type },
        vibrate: data.vibrate || [100, 50, 100],
        tag: data.tag || "announcement",
        renotify: true,
      });

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({
          kind: "announcement_push",
          title,
          body,
          url,
          type,
        });
      }
    })()
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      let client = allClients.find((c) => c.url.includes(url));
      if (client) {
        client.focus();
      } else {
        self.clients.openWindow(url);
      }
    })()
  );
});
