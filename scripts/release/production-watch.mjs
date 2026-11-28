// Read-only fixed-origin production smoke. No credentials, no mutations, no arbitrary targets.
const origins=new Set(["https://neerva-build.vercel.app","https://neerva.in","https://www.neerva.in"]);
const paths=["/","/materials","/build-iq","/calculators","/design-studio","/design-studio/buildings","/design-studio/visualizer","/design-studio/portfolio","/api/catalog?limit=1","/api/studio/config"];
async function get(origin,path){
 let url=new URL(path,origin);
 for(let redirect=0;redirect<=2;redirect++){
  const response=await fetch(url,{redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(12000),headers:{Accept:path.startsWith("/api/")?"application/json":"text/html"}});
  if([301,302,303,307,308].includes(response.status)){
   const location=response.headers.get("location");
   await response.body?.cancel();
   if(!location||redirect===2)throw Error("Invalid or excessive redirect");
   const next=new URL(location,url);
   if(!origins.has(next.origin)||next.username||next.password||next.pathname!==url.pathname||next.search!==url.search)throw Error("Unexpected redirect destination");
   url=next;continue;
  }
  return response;
 }
 throw Error("Redirect limit exceeded");
}
async function probe(origin,path){
 for(let attempt=0;attempt<2;attempt++){
  let response;
  const started=performance.now();
  try{
   response=await get(origin,path);
   const responseMs=Math.round(performance.now()-started);
   if(response.status!==200)throw Error("HTTP "+response.status);
   const content=response.headers.get("content-type")??"";
   if(path.startsWith("/api/")){
    if(!content.includes("application/json"))throw Error("Unexpected API content type");
    const body=await response.json();
    if(path.startsWith("/api/catalog")&&(body.source!=="published_database"||!Array.isArray(body.products)))return {origin,path,status:"degraded",detail:"Published catalog unavailable or unverified"};
    if(path==="/api/studio/config"&&(body.ready!==true||body.unavailable===true))return {origin,path,status:"degraded",detail:"Live studio configuration unavailable"};
   }else{
    if(!content.includes("text/html"))throw Error("Unexpected page content type");
    if(new URL(response.url).origin!=="https://www.neerva.in")throw Error("Canonical production hostname mismatch");
    if(response.headers.get("x-content-type-options")!=="nosniff"||response.headers.get("x-frame-options")!=="DENY")throw Error("Security headers missing");
    await response.body?.cancel();
   }
   return {origin,path,status:"ok",responseMs,scope:"runner HTTP response including redirects; not browser Core Web Vitals"};
  }catch(error){
   if(response?.body&&!response.bodyUsed)await response.body.cancel().catch(()=>{});
   if(attempt===0){await new Promise(resolve=>setTimeout(resolve,1000));continue}
   return {origin,path,status:"failed",detail:error instanceof Error&&/^HTTP \d{3}$/.test(error.message)?error.message:"Page, network, response or security check failed"};
  }
 }
}
// Check each approved hostname independently. Small batches avoid stressing production.
const targets=[...origins].flatMap(origin=>paths.map(path=>({origin,path}))),results=[];
for(let i=0;i<targets.length;i+=4)results.push(...await Promise.all(targets.slice(i,i+4).map(({origin,path})=>probe(origin,path))));
for(const result of results)console.log(JSON.stringify(result));
if(results.some(r=>r?.status!=="ok"))process.exitCode=1;
