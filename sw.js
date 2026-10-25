const CACHE="id-portal-v2.61";
const APP=["./index.html","./manifest.webmanifest","./icon-192.png?v=2.57","./icon-512.png?v=2.57"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{for(const u of APP){try{await c.add(new Request(u,{cache:"reload"}))}catch{}}}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  if(e.request.mode==="navigate"){
    e.respondWith(caches.match("./index.html").then(r=>r||fetch(e.request)));
    return;
  }
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
