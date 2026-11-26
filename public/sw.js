/* Privacy-first worker. Only exact public, immutable asset paths are cacheable.
   Never cache account, admin, dealer, API responses, tokens, prices or quotes. */
const CACHE="neerva-offline-v2",ASSETS="neerva-static-v1",OFFLINE="/offline.html",MAX_ENTRIES=48,MAX_BYTES=512*1024;
const PRIVATE=/^\/(api|account|admin|dealer|checkout|customer|support|basket|quotes|orders|my-project)(\/|$)/;
function staticRequest(request,url){
 if(request.method!=="GET"||url.origin!==self.location.origin||url.search||request.headers.has("authorization")||request.headers.has("range"))return false;
 return (["script","style","font"].includes(request.destination)&&/^\/_next\/static\/[a-zA-Z0-9_./~-]+\.(?:js|css|woff2)$/.test(url.pathname))||
  (request.destination==="image"&&/^\/images\/catalog\/approved\/[a-f0-9]{24}\.webp$/.test(url.pathname));
}
function cacheable(response){
 const cc=response.headers.get("cache-control")||"",size=Number(response.headers.get("content-length")),type=response.headers.get("content-type")||"";
 return response.status===200&&!response.redirected&&/\bpublic\b/i.test(cc)&&/\bimmutable\b/i.test(cc)&&!/(private|no-store|no-cache)/i.test(cc)&&
  Number.isSafeInteger(size)&&size>0&&size<=MAX_BYTES&&/^(?:application\/(?:javascript|x-javascript)|text\/(?:javascript|css)|font\/woff2|image\/webp)(?:;|$)/i.test(type)&&!response.headers.has("set-cookie")&&!/(cookie|authorization|\*)/i.test(response.headers.get("vary")||"");
}
let writes=Promise.resolve();
function store(cache,request,response){
 writes=writes.catch(()=>{}).then(async()=>{await cache.put(request,response);const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-MAX_ENTRIES)))await cache.delete(key);});
 return writes;
}
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add(OFFLINE)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith("neerva-offline-")||key.startsWith("neerva-static-"))&&key!==CACHE&&key!==ASSETS).map(key=>caches.delete(key)))),self.clients.claim()]));});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin||PRIVATE.test(url.pathname))return;
 if(staticRequest(request,url)){
  // No route/HTML cache and no speculative downloads. Cache failures never block
  // real navigation or static asset fetching; writes are serialized and capped.
  const task=(async()=>{let cache;try{cache=await caches.open(ASSETS);const hit=await cache.match(request);if(hit)return {response:hit,done:Promise.resolve()};}catch{}
   const response=await fetch(request);return {response,done:cache&&cacheable(response)?store(cache,request,response.clone()).catch(()=>{}):Promise.resolve()};})();
  event.respondWith(task.then(x=>x.response));event.waitUntil(task.then(x=>x.done).catch(()=>{}));return;
 }
 // Preserve the existing offline fallback for public query-based navigation.
 // Documents are always network-first and never placed in the asset cache.
 if(request.mode!=="navigate"||request.headers.has("authorization"))return;
 event.respondWith(fetch(request).catch(async()=>{let response;try{response=await caches.match(OFFLINE);}catch{}return response??new Response("Offline. No request was submitted.",{status:503,headers:{"Content-Type":"text/plain"}});}));
});
