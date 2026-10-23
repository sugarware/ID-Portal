const CACHE="id-portal-v2.47";
const APP=["./index.html","./manifest.webmanifest","./icon-192.png?v=2.44","./icon-512.png?v=2.44"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{for(const u of APP){try{await c.add(new Request(u,{cache:"reload"}))}catch{}}}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(async r=>{
    if(r) return r;
    const resp=await fetch(e.request);
    try{
      const url=new URL(e.request.url);
      const cacheable=(url.origin===self.location.origin || url.hostname==="cdn.jsdelivr.net");
      if(cacheable && resp.ok) (await caches.open(CACHE)).put(e.request,resp.clone());
    }catch{}
    return resp;
  }));
});
