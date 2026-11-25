import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
const url=process.env.NEERVA_E2E_SUPABASE_URL;
assert.equal(url,"http://127.0.0.1:54321","Disposable local Supabase only");
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,url);
const base="http://127.0.0.1:3000",key=process.env.NEERVA_E2E_SUPABASE_ANON_KEY;
async function login(role){
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.signInWithPassword({email:process.env["NEERVA_E2E_"+role+"_EMAIL"],password:process.env["NEERVA_E2E_"+role+"_PASSWORD"]});
 assert.ok(!error&&data.session,role+" fixture login failed");
 return {client,token:data.session.access_token};
}
async function call(role,path,method="GET",body){
 const r=await fetch(base+path,{method,redirect:"error",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+role.token,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:r.status,data:await r.json()};
}
const [a,b,c,d]=await Promise.all(["DEALER_A","DEALER_B","CUSTOMER","ADMIN"].map(login));
const branches=[process.env.NEERVA_E2E_DEALER_A_BRANCH,process.env.NEERVA_E2E_DEALER_B_BRANCH];
for(const [i,actor] of [a,b].entries()){
 const list=await call(actor,"/api/dealer/inventory");
 assert.equal(list.status,200);
 assert.ok(list.data.branches.some(x=>x.id===branches[i]));
 assert.ok(!list.data.branches.some(x=>x.id===branches[1-i]),"Cross-dealer branch leaked");
 const foreign=await call(actor,"/api/dealer/inventory","POST",{branchId:branches[1-i],variantId:randomUUID(),quantity:1,unit:"bag"});
 assert.equal(foreign.status,403,"Cross-tenant write must fail");
 const direct=await actor.client.from("merchant_branches").select("id").eq("id",branches[1-i]);
 assert.ifError(direct.error);assert.equal(direct.data.length,0,"RLS leaked unrelated branch");
}
const product="home_studio";
const config=await call(d,"/api/admin/studio-settings");
assert.equal(config.status,200);
const setting=config.data.products.find(x=>x.product===product||x.productCode===product||x.code===product);
assert.ok(setting,"Studio config missing");
const v=await d.client.from("studio_feature_settings").select("version").eq("product_code",product).single();
assert.ifError(v.error);
const updated=await call(d,"/api/admin/studio-settings","PATCH",{product,mode:"paid",pricePaise:14900,freePreviewCount:4,checkoutEnabled:true,published:true,expectedVersion:Number(v.data.version)});
assert.equal(updated.status,200);
const payment="/api/studio/payments";
const started=await call(c,payment,"POST",{product});assert.equal(started.status,200);
const orderId=started.data.orderId;assert.ok(orderId);assert.equal(started.data.pricePaise,14900);
const repeat=await call(c,payment,"POST",{product});assert.equal(repeat.data.orderId,orderId);
const claim={orderId,utr:"TEST"+randomUUID().replaceAll("-","").slice(0,20).toUpperCase(),paidAt:new Date().toISOString()};
assert.equal((await call(a,payment+"/claim","POST",claim)).status,409);
assert.equal((await call(c,payment+"/claim","POST",claim)).status,201);
assert.equal((await call(c,payment+"/claim","POST",claim)).status,409);
const status=()=>call(c,payment+"?product="+product);
assert.equal((await status()).data.paid,false);
const review={orderId,action:"verified",bankReconciled:true,confirmation:"I independently confirmed this transaction in the bank statement"};
assert.equal((await call(c,"/api/admin/studio-payments","PATCH",review)).status,403);
assert.equal((await call(d,"/api/admin/studio-payments","PATCH",{...review,bankReconciled:false})).status,400);
assert.equal((await call(d,"/api/admin/studio-payments","PATCH",review)).status,200);
assert.equal((await status()).data.paid,true);
assert.equal((await call(d,"/api/admin/studio-payments","PATCH",review)).status,409);
assert.equal((await call(d,"/api/admin/studio-payments","PATCH",{...review,action:"refunded"})).status,200);
assert.equal((await status()).data.paid,false);
console.log(JSON.stringify({scope:"disposable fixtures; no real money, bank verification or dispatch",checks:["dealer branch isolation","cross-tenant writes denied","RLS read isolation","payment idempotency","foreign claim denied","duplicate claim denied","admin verification","refund revokes access"]}));
