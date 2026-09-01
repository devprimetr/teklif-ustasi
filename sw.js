// Service worker — uygulamanin internetsiz calismasini saglar.
const ONBELLEK = "teklif-ustasi-v1";
const DOSYALAR = ["./", "./index.html", "./app.js", "./sektorler.js",
                  "./manifest.json", "./icon-192.png", "./icon-512.png"];

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
  e.respondWith(
    caches.match(e.request).then(v => v || fetch(e.request).then(y => {
      // basarili yanitlari onbellege al, sonraki acilista internetsiz calissin
      if (y && y.status === 200 && y.type === "basic") {
        const kopya = y.clone();
        caches.open(ONBELLEK).then(c => c.put(e.request, kopya));
      }
      return y;
    }).catch(() => caches.match("./index.html")))
  );
});
