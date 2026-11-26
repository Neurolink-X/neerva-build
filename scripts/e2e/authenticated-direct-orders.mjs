// Run only against a disposable staging Supabase project and a local Next server.
// Requires dedicated customer, second customer and admin fixtures; no live payment.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
const base=new URL(process.env.NEERVA_E2E_BASE_URL??"http://127.0.0.1:3000");
assert.ok(["localhost","127.0.0.1"].includes(base.hostname),"Local app server required");
const db=new URL(process.env.NEERVA_E2E_SUPABASE_URL??"https://invalid.example");
assert.ok(/^[a-z0-9]+\.supabase\.co$/.test(db.hostname)||(["localhost","127.0.0.1"].includes(db.hostname)&&db.protocol==="http:"&&db.port==="54321"&&process.env.NEERVA_E2E_LOCAL==="yes"),"Dedicated staging or isolated local Supabase required");
assert.notEqual(db.hostname,"djgghisbkucprqiezrcn.supabase.co","Production DB forbidden");
assert.equal(process.env.NEERVA_E2E_DISPOSABLE,"yes","Explicit disposable staging authorization required");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,db.origin,"Local app and fixture project must match");
const key=process.env.NEERVA_E2E_SUPABASE_ANON_KEY;
assert.ok(key,"Missing staging anonymous key");
async function login(role){
 const email=process.env["NEERVA_E2E_"+role+"_EMAIL"],password=process.env["NEERVA_E2E_"+role+"_PASSWORD"];
 assert.ok(email&&password,"Missing "+role+" staging credentials");
 const client=createClient(db.origin,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.signInWithPassword({email,password});
 assert.ok(!error&&data.session&&data.user,"Staging fixture sign-in failed: "+role);
 return {token:data.session.access_token,id:data.user.id};
}
const customer=await login("CUSTOMER"),other=await login("OTHER_CUSTOMER"),admin=await login("ADMIN");
assert.equal(new Set([customer.id,other.id,admin.id]).size,3,"Distinct test identities required");
async function call(role,path,method="GET",body){
 const r=await fetch(new URL(path,base),{method,redirect:"error",signal:AbortSignal.timeout(20000),headers:{...(role?{Authorization:"Bearer "+role.token}:{}),...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();
 return {status:r.status,data};
}
const rfqCustomer=await login("RFQ_CUSTOMER");
assert.ok(![customer.id,other.id,admin.id].includes(rfqCustomer.id));
const rfqPayload={idempotencyKey:randomUUID(),categorySlug:"cement",materialDescription:"Disposable PPC cement 50 kg",quantity:10,unit:"bag",city:"Kanpur",pincode:"208001",contactName:"Disposable fixture",phone:"9000000000",privacyAccepted:true};
assert.equal((await call(null,"/api/rfqs","POST",rfqPayload)).status,401);
assert.equal((await call(rfqCustomer,"/api/rfqs","POST",{...rfqPayload,unit:"litre"})).status,400);
assert.equal((await call(rfqCustomer,"/api/rfqs","POST",{...rfqPayload,categorySlug:"bricks-blocks",unit:"piece",quantity:1.5})).status,400);
const rfq=await call(rfqCustomer,"/api/rfqs","POST",rfqPayload);assert.equal(rfq.status,201,JSON.stringify(rfq.data));assert.ok(rfq.data.requestId);
const retryRfq=await call(rfqCustomer,"/api/rfqs","POST",rfqPayload);assert.equal(retryRfq.status,200);assert.equal(retryRfq.data.requestId,rfq.data.requestId);
assert.equal((await call(customer,"/api/admin/rfqs")).status,403);
for(const [actor,endpoint,visible] of [[rfqCustomer,"/api/customer/quotes",true],[other,"/api/customer/quotes",false],[admin,"/api/admin/rfqs",true]]){const list=await call(actor,endpoint);assert.equal(list.status,200);assert.equal(list.data.requests.some(q=>q.id===rfq.data.requestId),visible,"RFQ visibility must match role");}
console.log("RFQ API submission, persistence, duplicate protection and admin visibility verified in disposable database");
const route="/api/direct-orders",adminRoute="/api/admin/direct-orders";
assert.equal((await call(null,route)).status,401);
assert.equal((await call(customer,adminRoute)).status,403);
assert.equal((await call(admin,adminRoute)).status,200);
const first={category:"cement",productSlug:"ppc-cement-50kg",quantity:3,unit:"bag"};
const payload={...first,items:[first],idempotencyKey:randomUUID(),contactName:"Disposable E2E fixture",phone:"9000000000",city:"Kanpur",pincode:"208001",deliveryAddress:"Staging fixture only; never dispatch",notes:"DISPOSABLE E2E ONLY",consent:true};
assert.equal((await call(customer,route,"POST",{...payload,quantity:0})).status,400);
const wrongBrick={category:"bricks-blocks",productSlug:"red-clay-brick",quantity:100,unit:"bag"};
assert.equal((await call(customer,route,"POST",{...payload,...wrongBrick,items:[wrongBrick],idempotencyKey:randomUUID()})).status,400);
const fractionalBrick={...wrongBrick,unit:"piece",quantity:1.5};
assert.equal((await call(customer,route,"POST",{...payload,...fractionalBrick,items:[fractionalBrick],idempotencyKey:randomUUID()})).status,400);
const directGuardClient=createClient(db.origin,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+customer.token}}});
const rawBrick={category:fractionalBrick.category,product_slug:fractionalBrick.productSlug,product_name:"Red clay brick",quantity:fractionalBrick.quantity,unit:fractionalBrick.unit,line_items:[{...fractionalBrick,productName:"Red clay brick"}],idempotency_key:randomUUID(),contact_name:payload.contactName,phone:payload.phone,city:payload.city,pincode:payload.pincode,delivery_address:payload.deliveryAddress,notes:payload.notes};
const blockedBrick=await directGuardClient.from("direct_orders").insert(rawBrick);
assert.equal(blockedBrick.error?.code,"23514","Database rejects fractional brick count even if API is bypassed");
assert.match(blockedBrick.error?.message??"",/INVALID_PROCUREMENT_QUANTITY/);

assert.equal((await call(customer,route,"POST",{...payload,consent:false})).status,400);
const concurrent=await Promise.all([call(customer,route,"POST",payload),call(customer,route,"POST",payload)]);
assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,201],"Concurrent retries must produce one stored order");
assert.equal(concurrent[0].data.order.id,concurrent[1].data.order.id);
const created=concurrent.find(r=>r.status===201);
assert.equal(created.status,201);
const order=created.data.order;
assert.ok(order?.id&&order.code);
assert.equal(order.status,"received");
assert.equal(created.data.paymentTaken,false);
assert.equal((await call(customer,route,"PATCH",{orderId:order.id,expectedStatus:"received",status:"delivered"})).status,400);
assert.equal((await call(admin,adminRoute,"PATCH",{orderId:order.id,expectedStatus:"preparing",status:"out_for_delivery"})).status,409,"A stale expected state may not advance the order");
const repeat=await call(customer,route,"POST",payload);
assert.equal(repeat.status,200);assert.equal(repeat.data.duplicate,true);assert.equal(repeat.data.order.id,order.id);
assert.equal((await call(customer,route,"POST",{...payload,notes:"Changed payload"})).status,409);
const hidden=await call(other,route);assert.equal(hidden.status,200);assert.ok(!hidden.data.orders.some(o=>o.id===order.id));
assert.ok((await call(other,route,"PATCH",{orderId:order.id,expectedStatus:"received",status:"cancelled"})).status>=400);
const adminList=await call(admin,adminRoute);assert.ok(adminList.data.orders.some(o=>o.id===order.id),"Admin sees dealer-independent intake");
async function transition(actor,path,expectedStatus,status,extra={}){
 const r=await call(actor,path,"PATCH",{orderId:order.id,expectedStatus,status,...extra});
 assert.equal(r.status,200,expectedStatus+" -> "+status);
 assert.equal(r.data.order.status,status);
}
await transition(admin,adminRoute,"received","sourcing");
await transition(admin,adminRoute,"sourcing","price_ready",{breakdown:{materialPaise:30000,taxPaise:5400,freightPaise:1000,unloadingPaise:0},terms:"Disposable staging fixture, no actual delivery"});
await transition(customer,route,"price_ready","confirmed");
await transition(admin,adminRoute,"confirmed","preparing");
await transition(admin,adminRoute,"preparing","out_for_delivery");
await transition(customer,route,"out_for_delivery","delivered");
const history=await call(customer,route);const saved=history.data.orders.find(o=>o.id===order.id);
assert.equal(saved.status,"delivered");assert.ok(saved.direct_order_events?.some(e=>e.status==="delivered"));
const cancel=await call(customer,route,"POST",{...payload,idempotencyKey:randomUUID()});
assert.equal(cancel.status,201);
const cancelled=await call(customer,route,"PATCH",{orderId:cancel.data.order.id,expectedStatus:"received",status:"cancelled"});
assert.equal(cancelled.status,200);assert.equal(cancelled.data.order.status,"cancelled");
assert.equal((await call(null,"/api/admin/marketplace-readiness")).status,401);
assert.equal((await call(customer,"/api/admin/marketplace-readiness")).status,403);
const readiness=await call(admin,"/api/admin/marketplace-readiness");
assert.equal(readiness.status,200);
assert.equal(readiness.data.findings.find(r=>r.key==="inventory").state,"unknown","Global inventory is not visible under tenant-only RLS");
assert.equal((await call(customer,"/api/dealer/inventory")).status,403);
assert.equal((await call(customer,"/api/admin/studio-payments")).status,403);
// Editorial publishing uses the same isolated fixture and actual RLS.
const editorialRoute="/api/admin/blog",slug="disposable-editorial-"+randomUUID();
const post={slug,title:"Disposable editorial fixture",summary:"A private fixture to verify publication and role boundaries.",body:"Educational staging article. ".repeat(12),language:"en",category:"Learning",cover:"architecture",source_url:null,status:"draft",reviewed:false};
assert.equal((await call(null,editorialRoute)).status,401);
assert.equal((await call(customer,editorialRoute)).status,403);
assert.equal((await call(customer,editorialRoute,"POST",post)).status,403);
assert.equal((await call(admin,editorialRoute,"POST",{...post,status:"published"})).status,400);
const editorial=await call(admin,editorialRoute,"POST",post);assert.equal(editorial.status,200);assert.equal(editorial.data.post.version,1);
const anonymous=createClient(db.origin,key,{auth:{persistSession:false,autoRefreshToken:false}});
const signed=createClient(db.origin,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+customer.token}}});
async function visible(client){const r=await client.from("editorial_posts").select("slug").eq("slug",slug);assert.equal(r.error,null);return r.data.length}
assert.equal(await visible(anonymous),0);assert.equal(await visible(signed),0);
assert.ok((await signed.from("editorial_posts").insert({...post,slug:slug+"-denied"})).error,"Direct customer write denied by RLS");
const published=await call(admin,editorialRoute,"PATCH",{post:{...post,status:"published",reviewed:true},expectedVersion:1});
assert.equal(published.status,200);assert.equal(published.data.post.version,2);assert.equal(await visible(anonymous),1);
assert.equal((await call(admin,editorialRoute,"PATCH",{post:{...post,status:"archived"},expectedVersion:1})).status,409);
const article=await fetch(new URL("/blog/editorial/"+slug,base),{signal:AbortSignal.timeout(20000)});assert.equal(article.status,200);assert.match(await article.text(),/Disposable editorial fixture/);
const archived=await call(admin,editorialRoute,"PATCH",{post:{...post,status:"archived",reviewed:true},expectedVersion:2});assert.equal(archived.status,200);assert.equal(await visible(anonymous),0);assert.equal(await visible(signed),0);
assert.equal((await fetch(new URL("/blog/editorial/"+slug,base),{signal:AbortSignal.timeout(20000)})).status,404);
console.log(JSON.stringify({scope:"authenticated disposable staging API workflow; no physical dispatch or payment",completed:order.code,cancelled:cancel.data.order.code,checks:["guest denial","role isolation","validation","idempotency","admin fallback","price acceptance","delivery state","tracking","cancellation","editorial admin role isolation","draft privacy","publish","version conflict","archive"]}));

const couponAdmin=createClient(db.origin,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+admin.token}}});
const code="TEST-"+randomUUID().slice(0,8).toUpperCase();
const promo={code,fixed_paise:5000,rate_bps:0,cap_paise:5000,minimum_paise:10000,starts_at:new Date(Date.now()-60000).toISOString(),ends_at:new Date(Date.now()+3600000).toISOString(),max_uses:1};
assert.ok((await signed.from("checkout_coupons").insert(promo)).error,"Customer cannot create coupon");
assert.ifError((await couponAdmin.from("checkout_coupons").insert(promo)).error);
assert.equal((await signed.rpc("neerva_coupon_available",{p_code:code})).data,true);
const unavailableCouponKey=randomUUID();
const unavailableCoupon=await call(customer,route,"POST",{...payload,idempotencyKey:unavailableCouponKey,couponCode:"MISSING"});
assert.equal(unavailableCoupon.status,409);assert.equal(unavailableCoupon.data.code,"COUPON_UNAVAILABLE");
const recoveredWithoutCoupon=await call(customer,route,"POST",{...payload,idempotencyKey:unavailableCouponKey});
assert.equal(recoveredWithoutCoupon.status,201,JSON.stringify(recoveredWithoutCoupon.data));
assert.equal(recoveredWithoutCoupon.data.order.status,"received");

const withCoupon={...payload,idempotencyKey:randomUUID(),couponCode:code};
const couponOrder=await call(customer,route,"POST",withCoupon);assert.equal(couponOrder.status,201,JSON.stringify(couponOrder.data));
assert.equal(couponOrder.data.order.coupon_status,"requested");
const secondCoupon=await call(other,route,"POST",{...withCoupon,idempotencyKey:randomUUID()});assert.equal(secondCoupon.status,201);
const quoteCoupon=id=>call(admin,adminRoute,"PATCH",{orderId:id,expectedStatus:"received",status:"price_ready",breakdown:{materialPaise:30000,taxPaise:0,freightPaise:1000,unloadingPaise:0},terms:"Disposable coupon test, no real delivery"});
const competing=await Promise.all([quoteCoupon(couponOrder.data.order.id),quoteCoupon(secondCoupon.data.order.id)]);
assert.deepEqual(competing.map(x=>x.status),[200,200]);assert.deepEqual(competing.map(x=>x.data.order.coupon_status).sort(),["applied","unavailable"]);
const winnerIndex=competing.findIndex(x=>x.data.order.coupon_status==="applied"),winnerActor=winnerIndex===0?customer:other,winner=competing[winnerIndex].data.order;
assert.equal(winner.discount_paise,5000);
assert.equal(winner.total_paise,winner.material_paise+winner.freight_paise+winner.tax_paise+winner.unloading_paise+winner.platform_fee_paise-5000);
assert.equal((await call(winnerActor,route,"PATCH",{orderId:winner.id,expectedStatus:"price_ready",status:"confirmed"})).status,200);
assert.equal((await signed.rpc("neerva_coupon_available",{p_code:code})).data,false);
assert.equal((await call(customer,route,"POST",withCoupon)).status,200,"Coupon receipt retry survives redemption");
console.log("Coupon admin isolation, invalid code, concurrent cap, reviewed discount, redemption and retry verified.");
