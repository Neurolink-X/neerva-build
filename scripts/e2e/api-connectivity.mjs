// Authenticated API sweep against the disposable local stack. Dynamic routes
// use real fixture records created through their public contracts, never literal brackets.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {generateSpatialPortfolio} from "../../src/modules/studio/road-generator.ts";
const url=process.env.NEERVA_E2E_SUPABASE_URL;
assert.equal(url,"http://127.0.0.1:54321");
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,url);
const key=process.env.NEERVA_E2E_SUPABASE_ANON_KEY;
async function login(role){
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.signInWithPassword({email:process.env["NEERVA_E2E_"+role+"_EMAIL"],password:process.env["NEERVA_E2E_"+role+"_PASSWORD"]});
 assert.ok(!error&&data.session,role+" login unavailable");return {token:data.session.access_token,client};
}
const [adminIdentity,dealerIdentity,customerIdentity]=await Promise.all(["ADMIN","DEALER_A","CUSTOMER"].map(login));
const admin=adminIdentity.token,dealer=dealerIdentity.token,customer=customerIdentity.token;
const membership=await dealerIdentity.client.from("tenant_memberships").select("tenant_id").eq("active",true).limit(1).single();assert.ifError(membership.error);assert.ok(membership.data.tenant_id);
const source=readFileSync("scripts/release/route-contract.test.mjs","utf8");
const manifest=[...source.matchAll(/^\s*"(\/api\/[^"]+)":\[(.*?)\]/gm)].map(m=>({path:m[1],methods:JSON.parse("["+m[2]+"]")}));
assert.ok(manifest.length>=50);
const query={"/api/admin/dealer-members":"?tenant="+membership.data.tenant_id,"/api/catalog":"?limit=1","/api/admin/direct-order-operations":"?orderId="+randomUUID(),"/api/customer/dealer-comparison":"?category=cement&slug=ppc-cement-50kg&pin=208001&qty=1","/api/studio/city-rules":"?city=kanpur","/api/studio/payments":"?product=home_studio"};
const publicPaths=new Set(["/api/catalog","/api/catalog/prices","/api/catalog/offers","/api/studio/config","/api/studio/city-rules"]);
const results=[];
const dynamicPaths=new Map();
const detailRoute="/api/studio/projects/[id]";
let savedProjectId=null;
if(manifest.some(r=>r.path===detailRoute)){
 const brief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
 const plan=generateSpatialPortfolio(brief,24).plans[0];assert.ok(plan,"real validated fixture geometry required");
 const response=await fetch("http://127.0.0.1:3000/api/studio/projects",{method:"POST",redirect:"error",signal:AbortSignal.timeout(20000),headers:{Authorization:"Bearer "+customer,"Content-Type":"application/json"},body:JSON.stringify({idempotencyKey:randomUUID(),title:"Isolated API test concept",brief,variant:plan.variant,planId:plan.id})});
 assert.equal(response.status,201,"saved-design fixture must be created through the authenticated API");
 const data=await response.json();savedProjectId=data.project?.id;assert.match(savedProjectId??"",/^[0-9a-f-]{36}$/i);
 dynamicPaths.set(detailRoute,"/api/studio/projects/"+savedProjectId);
}
function resolvedPath(path){
 if(dynamicPaths.has(path))return dynamicPaths.get(path);
 assert.ok(!path.includes("["),"No concrete fixture resolver registered for "+path);
 return path;
}
async function check(path,method,token,expected,scope,override){
 try{
 const r=await fetch("http://127.0.0.1:3000"+(override??resolvedPath(path))+(query[path]??""),{method,redirect:"error",signal:AbortSignal.timeout(20000),headers:{Accept:"application/json",...(token?{Authorization:"Bearer "+token}:{})}});
 const json=(r.headers.get("content-type")??"").includes("application/json");await r.arrayBuffer();
 const ok=expected.includes(r.status)&&json;
 results.push({path,method,scope,status:r.status,ok});
 }catch{results.push({path,method,scope,status:"network_or_response_error",ok:false})}
}
for(const {path,methods} of manifest){
 const isPublic=publicPaths.has(path),isAdmin=path.startsWith("/api/admin/"),isDealer=path.startsWith("/api/dealer/")&&path!=="/api/dealer/onboarding";
 for(const method of methods){
  if(!isPublic)await check(path,method,null,[401],"guest_denied");
 }
 if(methods.includes("GET")){
  await check(path,"GET",isPublic?null:isAdmin?admin:isDealer?dealer:customer,[200],"authorized_read");
  if(isAdmin||isDealer)await check(path,"GET",customer,[403],"wrong_role_denied");
 }
}
if(savedProjectId){
 await check(detailRoute,"GET",dealer,[404],"cross_owner_denied");
 await check(detailRoute,"GET",customer,[404],"missing_record","/api/studio/projects/"+randomUUID());
 await check(detailRoute,"GET",customer,[404],"invalid_id","/api/studio/projects/invalid-id");
 const detail=await fetch("http://127.0.0.1:3000"+resolvedPath(detailRoute),{headers:{Authorization:"Bearer "+customer},signal:AbortSignal.timeout(20000)});
 assert.equal(detail.status,200);assert.match(detail.headers.get("cache-control")??"",/private, no-store/);
 const body=await detail.json();assert.equal(body.project.id,savedProjectId);assert.equal(body.project.plan.conceptOnly,true);
 assert.equal(body.project.plan.plot.widthFt,18);assert.equal(body.project.plan.floors,2);
}
// A feature intentionally disabled in this disposable environment must expose
// explicit availability and still reject writes, not masquerade as an empty live store.
const commercial=await fetch("http://127.0.0.1:3000/api/studio/commercial-projects",{headers:{Authorization:"Bearer "+customer},signal:AbortSignal.timeout(10000)});
assert.equal(commercial.status,200);assert.match(commercial.headers.get("cache-control")??"",/private, no-store/);
const availability=await commercial.json();
assert.equal(availability.enabled,false);assert.deepEqual(availability.projects,[]);assert.equal(availability.reason,"storage_not_enabled");
await check("/api/studio/commercial-projects","POST",customer,[503],"rollout_disabled");
// A direct request for bulk aggregate must use the quotation path even if
// the client is stale or calls the API directly.
const quoteOnlyKey=randomUUID();
const quoteOnly=await fetch("http://127.0.0.1:3000/api/direct-orders",{method:"POST",headers:{Authorization:"Bearer "+customer,"Content-Type":"application/json"},body:JSON.stringify({idempotencyKey:quoteOnlyKey,category:"aggregates",productSlug:"morang-coarse-sand",quantity:1,unit:"cubic_metre",contactName:"Isolated test",phone:"9876543210",city:"Kanpur",pincode:"208001",deliveryAddress:"Isolated test address only",notes:"",consent:true}),signal:AbortSignal.timeout(10000)});
assert.equal(quoteOnly.status,422);assert.equal((await quoteOnly.json()).code,"QUOTE_REQUIRED");
const rejected=await customerIdentity.client.from("direct_orders").select("id",{head:true,count:"exact"}).eq("idempotency_key",quoteOnlyKey);
assert.ifError(rejected.error);assert.equal(rejected.count,0,"quote-only rejection must not create an order");
for(const row of results)console.log(JSON.stringify(row));
assert.deepEqual(results.filter(r=>!r.ok),[],"API connectivity or authorization failure");
console.log(JSON.stringify({routes:manifest.length,methods:manifest.reduce((n,r)=>n+r.methods.length,0),checks:results.length,status:"passed"}));

// Bounded concurrent read smoke on the disposable stack only. No production traffic or writes.
// Verify the scoped API contract against the isolated database, not just mocks.
for(const kind of ["prices","offers"]){
 const route="http://127.0.0.1:3000/api/catalog/"+kind;
 const result=await fetch(route+"?limit=10&category=cement",{signal:AbortSignal.timeout(15000)});
 assert.equal(result.status,200,"Scoped "+kind+" must be connected");
 const payload=await result.json();
 assert.ok(Array.isArray(payload[kind])&&payload[kind].every(row=>row.category==="cement"),"Scoped "+kind+" must not return other categories");
 const invalid=await fetch(route+"?limit=10&category=not-a-category",{signal:AbortSignal.timeout(15000)});
 assert.equal(invalid.status,400,"Invalid category must fail closed");
}
const readPaths=["/api/catalog?limit=24","/api/catalog/prices?limit=250","/api/catalog/offers?limit=250","/api/direct-orders","/api/orders"];
for(const concurrency of [4,8]){
 const jobs=Array.from({length:concurrency*3},(_,i)=>readPaths[i%readPaths.length]);
 const times=[];let next=0;
 const started=performance.now();
 await Promise.all(Array.from({length:concurrency},async()=>{
  while(next<jobs.length){
   const path=jobs[next++],privateRead=path==="/api/direct-orders"||path==="/api/orders",t=performance.now();
   const r=await fetch("http://127.0.0.1:3000"+path,{signal:AbortSignal.timeout(15000),redirect:"error",headers:{Accept:"application/json",...(privateRead?{Authorization:"Bearer "+customer}:{})}});
   assert.equal(r.status,200,"concurrent "+path);
   assert.match(r.headers.get("content-type")??"",/application\/json/);
   if(privateRead)assert.match(r.headers.get("cache-control")??"",/no-store/);
   const body=await r.json();assert.ok(body&&typeof body==="object");
   times.push(performance.now()-t);
  }
 }));
 times.sort((a,b)=>a-b);
 console.log(JSON.stringify({scope:"local disposable read-load smoke, not production capacity",concurrency,requests:times.length,wallMs:Math.round(performance.now()-started),p50Ms:Math.round(times[Math.ceil(times.length*.5)-1]),p95Ms:Math.round(times[Math.ceil(times.length*.95)-1]),maxMs:Math.round(times.at(-1))}));
}
