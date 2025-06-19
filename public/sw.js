self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const bodyWithLineBreaks = data.body.replace(/, ?/g, '\n');
    event.waitUntil(
      self.registration.showNotification("FaceX – " + data.title, {
        body: bodyWithLineBreaks,
        icon: '/icon.png',
        badge: '/badge.png',
        requireInteraction: true,
        data: data.data || {},
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});