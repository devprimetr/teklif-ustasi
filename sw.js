// Service worker — uygulamanin internetsiz calismasini saglar.
const ONBELLEK = "teklif-ustasi-v10";
const DOSYALAR = ["./", "./index.html", "./app.js", "./sektorler.js",
                  "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(anahtarlar =>
    Promise.all(anahtarlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // HTML/JS/CSS icin ONCE AG, sonra onbellek: yeni surum aninda gorunur.
  // Onbellek-once kullanildiginda kullanici eski surumde takili kaliyordu.
  const kritik = /\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (kritik) {
    e.respondWith(
      fetch(e.request).then(y => {
        if (y && y.status === 200 && y.type === "basic") {
          const k = y.clone();
          caches.open(ONBELLEK).then(c => c.put(e.request, k));
        }
        return y;
      }).catch(() => caches.match(e.request).then(v => v || caches.match("./index.html")))
    );
    return;
  }
  // Gorseller icin onbellek-once yeterli
  e.respondWith(
    caches.match(e.request).then(v => v || fetch(e.request).then(y => {
      if (y && y.status === 200 && y.type === "basic") {
        const k = y.clone();
        caches.open(ONBELLEK).then(c => c.put(e.request, k));
      }
      return y;
    }))
  );
});
