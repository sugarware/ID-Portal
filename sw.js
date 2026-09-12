const CACHE="id-portal-v1.12";
const APP=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png",
"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js",
"https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
"https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js",
"https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js",
"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{for(const u of APP){try{await c.add(u)}catch{}}}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return resp;})))});
