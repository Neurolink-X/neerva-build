// Read-only authenticated API sweep against the disposable local stack.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
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
async function check(path,method,token,expected,scope){
 try{
 const r=await fetch("http://127.0.0.1:3000"+path+(query[path]??""),{method,redirect:"error",signal:AbortSignal.timeout(20000),headers:{Accept:"application/json",...(token?{Authorization:"Bearer "+token}:{})}});
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
for(const row of results)console.log(JSON.stringify(row));
assert.deepEqual(results.filter(r=>!r.ok),[],"API connectivity or authorization failure");
console.log(JSON.stringify({routes:manifest.length,methods:manifest.reduce((n,r)=>n+r.methods.length,0),checks:results.length,status:"passed"}));
