/* eslint-disable no-restricted-globals */
// Basic service worker to support showing notifications and future push payloads

self.addEventListener("install", (event) => {
  // Activate immediately so we can use notifications right away
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events if backend pushes are wired later
self.addEventListener("push", (event) => {
  try {
    const data = event.data?.json?.() ?? {};
    const title = data.title || "SymptomSync";
    const body = data.body || "You have a new update";
    const options = {
      body,
      icon: "/favicon.ico",
      data: data.data || {},
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Push event error:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const hadWindow = clientsArr.some((client) => {
          if (client.url === url && "focus" in client) {
            client.focus();
            return true;
          }
          return false;
        });
        if (!hadWindow && self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
        return undefined;
      }),
  );
});
