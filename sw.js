const CACHE = "salve-v2";
const SHELL = ["./","index.html","contratos.html","ficha-avaliacao.html","bens.html","admin.html",
  "manifest.webmanifest","icon-192.png","icon-512.png","favicon-48.png","apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;                 // POST/DELETE (API) passam direto
  if (url.pathname.includes("/api/")) return;        // dados sempre pela rede

  const isPage = req.mode === "navigate" ||
                 (url.origin === location.origin && url.pathname.endsWith(".html"));

  if (isPage) {
    // NETWORK-FIRST: sempre a versão nova quando online; cai no cache só offline.
    e.respondWith(
      fetch(req)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then(c => c || caches.match("index.html")))
    );
    return;
  }
  // assets (fontes, ícones, cdnjs): cache-first
  e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const okOrigin = url.origin === location.origin || /gstatic|googleapis|cdnjs/.test(url.host);
    if (res && res.status === 200 && okOrigin) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  })));
});
