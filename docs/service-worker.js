/* Service Worker Oficial de ANTHI (Radar Vial Antitodo) */
const CACHE_NAME = 'anthi-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/icon.svg',
  '/manifest.webmanifest'
];

let latestRadarState = {
  lat: null,
  lng: null,
  activeCount: 0,
  updatedAt: 0
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req || req.method !== 'GET') return;

  const url = new URL(req.url);
  // Solo cachear recursos locales estáticos; dejar tráfico de Firebase, mapas OSM y APIs en vivo
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

async function showAnthiNativeNotification(payload) {
  const title = (payload && payload.title) || '⚠️ ¡Alerta ANTHI!';
  const body = (payload && payload.body) || 'Novedad vial detectada a pocos metros de tu ubicación.';
  const tag = (payload && payload.tag) || 'anthi-radar-alert';

  const options = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [280, 120, 280, 120, 420],
    data: {
      url: '/',
      reportId: payload && payload.reportId ? payload.reportId : null,
      lat: payload && payload.lat ? payload.lat : null,
      lng: payload && payload.lng ? payload.lng : null
    }
  };

  return self.registration.showNotification(title, options);
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'AN_THI_ALERT') {
    event.waitUntil(showAnthiNativeNotification(data));
    return;
  }

  if (data.type === 'AN_THI_RADAR_KEEPALIVE') {
    latestRadarState = {
      lat: data.lat ?? latestRadarState.lat,
      lng: data.lng ?? latestRadarState.lng,
      activeCount: Number(data.activeCount || 0),
      updatedAt: Date.now()
    };
    if (event.source && typeof event.source.postMessage === 'function') {
      event.source.postMessage({
        type: 'AN_THI_SW_ALIVE',
        state: latestRadarState
      });
    }
  }
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '⚠️ ¡Alerta ANTHI!',
    body: 'Novedad vial detectada en tu radio de proximidad.'
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        payload = { ...payload, ...parsed };
      }
    }
  } catch (e) {
    try {
      const txt = event.data ? event.data.text() : '';
      if (txt) payload.body = txt;
    } catch (err) {}
  }
  event.waitUntil(showAnthiNativeNotification(payload));
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'anthi-radar-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'AN_THI_SW_TICK', ts: Date.now() }));
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'anthi-radar-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'AN_THI_SW_TICK', ts: Date.now() }));
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = (event.notification && event.notification.data) || {};
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'AN_THI_FOCUS_ALERT',
            reportId: notifData.reportId || null,
            lat: notifData.lat || null,
            lng: notifData.lng || null
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(notifData.url || '/');
      }
    })
  );
});
