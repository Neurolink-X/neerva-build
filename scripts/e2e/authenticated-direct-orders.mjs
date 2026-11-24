// Run only against a disposable staging Supabase project and a local Next server.
// Requires dedicated customer, second customer and admin fixtures; no live payment.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
const base=new URL(process.env.NEERVA_E2E_BASE_URL??"http://127.0.0.1:3000");
assert.ok(["localhost","127.0.0.1"].includes(base.hostname),"Local app server required");
const db=new URL(process.env.NEERVA_E2E_SUPABASE_URL??"https://invalid.example");
assert.match(db.hostname,/^[a-z0-9]+\.supabase\.co$/);
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
const route="/api/direct-orders",adminRoute="/api/admin/direct-orders";
assert.equal((await call(null,route)).status,401);
assert.equal((await call(customer,adminRoute)).status,403);
assert.equal((await call(admin,adminRoute)).status,200);
const first={category:"cement",productSlug:"ppc-cement-50kg",quantity:3,unit:"bag"};
const payload={...first,items:[first],idempotencyKey:randomUUID(),contactName:"Disposable E2E fixture",phone:"9000000000",city:"Kanpur",pincode:"208001",deliveryAddress:"Staging fixture only; never dispatch",notes:"DISPOSABLE E2E ONLY",consent:true};
assert.equal((await call(customer,route,"POST",{...payload,quantity:0})).status,400);
assert.equal((await call(customer,route,"POST",{...payload,consent:false})).status,400);
const created=await call(customer,route,"POST",payload);
assert.equal(created.status,201);
const order=created.data.order;
assert.ok(order?.id&&order.code);
assert.equal(order.status,"received");
assert.equal(created.data.paymentTaken,false);
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
console.log(JSON.stringify({scope:"authenticated disposable staging API workflow; no physical dispatch or payment",completed:order.code,cancelled:cancel.data.order.code,checks:["guest denial","role isolation","validation","idempotency","admin fallback","price acceptance","delivery state","tracking","cancellation"]}));
