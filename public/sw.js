/* Minimal privacy-first service worker: static offline information only.
   Never cache account, admin, dealer, API responses, tokens, prices or quotes. */
const CACHE="neerva-offline-v1",OFFLINE="/offline.html";
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.add(OFFLINE)));
 self.skipWaiting();
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("neerva-offline-")&&key!==CACHE).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.mode!=="navigate"||request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||/^\/(api|account|admin|dealer|checkout|customer|support|basket)(\/|$)/.test(url.pathname))return;
 event.respondWith(fetch(request).catch(async()=>{
  const response=await caches.match(OFFLINE);
  return response??new Response("Offline. No request was submitted.",{status:503,headers:{"Content-Type":"text/plain"}});
 }));
});
