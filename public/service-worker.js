/* Service Worker Oficial de ANTHI (Radar Vial Antitodo) */
const CACHE_NAME = 'anthi-pwa-v2';
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
      .then(() =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            try {
              client.postMessage({ type: 'AN_THI_SW_READY', ts: Date.now() });
            } catch (e) {}
          });
        })
      )
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

function buildAlertFocusUrl(payload) {
  try {
    const base = new URL((payload && payload.url) || '/', self.location.origin);
    if (payload && payload.reportId) {
      base.searchParams.set('alertId', String(payload.reportId));
    }
    const latNum = payload && payload.lat != null ? Number(payload.lat) : NaN;
    const lngNum = payload && payload.lng != null ? Number(payload.lng) : NaN;
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      base.searchParams.set('lat', String(latNum));
      base.searchParams.set('lng', String(lngNum));
    }
    return base.pathname + base.search;
  } catch (e) {
    return '/';
  }
}

async function showAnthiNativeNotification(payload) {
  if (typeof Notification !== 'undefined' && Notification.permission && Notification.permission !== 'granted') {
    return;
  }
  const title = (payload && payload.title) || '⚠️ ¡Alerta ANTHI!';
  const body = (payload && payload.body) || 'Novedad vial detectada en tu sector.';
  const tag = (payload && payload.tag) || 'anthi-radar-alert';
  const isVip = Boolean(payload && payload.isVip);
  const latNum = payload && payload.lat != null ? Number(payload.lat) : NaN;
  const lngNum = payload && payload.lng != null ? Number(payload.lng) : NaN;

  const options = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag,
    renotify: true,
    requireInteraction: payload && payload.requireInteraction === false ? false : true,
    silent: false,
    vibrate: Array.isArray(payload && payload.vibrate)
      ? payload.vibrate
      : (isVip ? [320, 110, 320, 110, 480] : [280, 120, 280, 120, 420]),
    data: {
      url: buildAlertFocusUrl(payload),
      reportId: payload && payload.reportId ? String(payload.reportId) : null,
      lat: Number.isFinite(latNum) ? latNum : null,
      lng: Number.isFinite(lngNum) ? lngNum : null,
      tipo: payload && payload.tipo ? String(payload.tipo) : null,
      isVip
    }
  };

  try {
    return await self.registration.showNotification(title, options);
  } catch (err) {
    return undefined;
  }
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'AN_THI_SHOW_NOTIFICATION' || data.type === 'AN_THI_ALERT') {
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
        state: latestRadarState,
        ts: Date.now()
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
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const origin = self.location.origin;
      const sameOriginClients = clientList.filter((c) => !c.url || c.url.startsWith(origin));
      const targetClient = sameOriginClients.find((c) => c.focused) || sameOriginClients[0] || clientList[0];

      if (targetClient && typeof targetClient.focus === 'function') {
        try {
          await targetClient.focus();
        } catch (e) {}
        try {
          targetClient.postMessage({
            type: 'AN_THI_FOCUS_ALERT',
            reportId: notifData.reportId || null,
            lat: notifData.lat != null ? notifData.lat : null,
            lng: notifData.lng != null ? notifData.lng : null,
            tipo: notifData.tipo || null
          });
        } catch (e) {}
        return targetClient;
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
