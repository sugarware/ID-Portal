const CACHE="id-portal-v2.34";
const APP=["./","./index.html","./manifest.webmanifest","./icon-192.png?v=2.07","./icon-512.png?v=2.07"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{for(const u of APP){try{await c.add(u)}catch{}}}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return resp;})))});
