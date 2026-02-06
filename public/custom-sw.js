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
  const icon = data.icon || "/favicon/notification-bell.png"; // TODO: verificar, parece que funciona só no localhost, e fica feio ainda
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
    })(),
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
    })(),
  );
});

// self.addEventListener("message", (event) => {
//   if (event.data && event.data.type === "SKIP_WAITING") {
//     self.skipWaiting();
//   }
// });
