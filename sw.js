const CACHE = "salve-v1";
const SHELL = ["./","index.html","contratos.html","ficha-avaliacao.html","bens.html","admin.html",
  "manifest.webmanifest","icon-192.png","icon-512.png","favicon-48.png","apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;         // POST/DELETE (API) passam direto
  if (url.pathname.includes("/api/")) return;       // dados sempre pela rede
  // shell e assets: cache primeiro, atualizando em segundo plano
  e.respondWith(caches.match(e.request).then(cached => {
    const net = fetch(e.request).then(res => {
      const okOrigin = url.origin === location.origin || /gstatic|googleapis|cdnjs/.test(url.host);
      if (res && res.status === 200 && okOrigin) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
