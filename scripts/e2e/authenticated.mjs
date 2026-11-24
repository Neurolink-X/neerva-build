/* Real staging accounts, not simulated auth. Never run writes against production. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
const base=new URL(process.env.QA_BASE_URL??"");
const local=process.env.QA_LOCAL_DISPOSABLE==="true"&&process.env.CI==="true";
assert.equal(base.origin,process.env.QA_ALLOWED_ORIGIN);
if(local)assert.equal(base.origin,"http://127.0.0.1:3000");else assert.equal(base.protocol,"https:");
assert.ok(!["neerva.in","www.neerva.in","neerva-build.vercel.app"].includes(base.hostname),"Use an isolated staging deployment");
assert.equal(process.env.QA_ISOLATED_STAGING,"true","Explicit staging isolation confirmation required");
const expectedProject=process.env.QA_SUPABASE_REF;
if(!local)assert.ok(/^[a-z0-9]{20}$/.test(expectedProject??"")&&expectedProject!=="djgghisbkucprqiezrcn","Dedicated non-production Supabase required");
const expectedAuthOrigin=local?"http://127.0.0.1:54321":"https://"+expectedProject+".supabase.co";
const roles=["ADMIN","CUSTOMER","DEALER"];
for(const role of roles)for(const field of ["EMAIL","PASSWORD"])assert.ok(process.env["QA_"+role+"_"+field],"Missing staging "+role+" "+field);
assert.equal(new Set(roles.map(r=>process.env["QA_"+r+"_EMAIL"].toLowerCase())).size,3,"Distinct roles required");
mkdirSync("test-results/authenticated",{recursive:true});
const report={startedAt:new Date().toISOString(),checks:[],status:"failed",environment:local?"disposable local CI":"isolated hosted staging",apiTimings:[]};
const browser=await chromium.launch({headless:true});
const contexts=[];
let admin,productId,variantId;
const record=(name,ms)=>{report.checks.push({name,ms:Math.round(ms),status:"passed"});console.log("PASS "+name+" "+Math.round(ms)+"ms")};
async function check(name,fn){const t=performance.now();await fn();record(name,performance.now()-t)}
async function login(role){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:"block"});
 contexts.push(context);await context.route("**/auth/v1/token**",route=>new URL(route.request().url()).origin===expectedAuthOrigin?route.continue():route.abort("blockedbyclient"));const page=await context.newPage();
 await page.goto(base.origin+"/account",{waitUntil:"domcontentloaded"});
 assert.equal(new URL(page.url()).origin,base.origin,"Unexpected staging redirect");
 const form=page.locator("form.account-auth-form").first();
 await form.locator('[name="email"]').fill(process.env["QA_"+role+"_EMAIL"]);
 await form.locator('[name="password"]').fill(process.env["QA_"+role+"_PASSWORD"]);
 const tokenResponse=page.waitForResponse(r=>r.url().includes("/auth/v1/token")&&r.request().method()==="POST");
 await form.getByRole("button",{name:/Sign in securely/}).click();
 const response=await tokenResponse;
 assert.equal(new URL(response.url()).origin,expectedAuthOrigin,"Wrong auth project");
 assert.equal(response.status(),200,role+" auth failed");
 const session=await response.json();assert.ok(session.access_token&&session.user?.id,role+" session absent");
 await page.getByRole("button",{name:"Sign out",exact:true}).waitFor({timeout:20000});
 return {page,token:session.access_token,id:session.user.id,context};
}
async function api(actor,route,method="GET",data,expected=200){
 const res=await actor.context.request.fetch(base.origin+route,{method,headers:{Authorization:"Bearer "+actor.token,"Content-Type":"application/json"},...(data===undefined?{}:{data}),timeout:20000,maxRedirects:0});
 assert.equal(new URL(res.url()).origin,base.origin,"Unexpected API redirect");
 assert.equal(res.status(),expected,method+" "+route+" HTTP "+res.status());
 if(expected===200||expected===201)assert.match(res.headers()["cache-control"]??"",/no-store/,"Private response cache policy");
 return res.json();
}
async function pageCheck(actor,path,selector){
 const r=await actor.page.goto(base.origin+path,{waitUntil:"domcontentloaded"});assert.equal(r.status(),200,path);
 await actor.page.locator(selector).first().waitFor({timeout:20000});
 const overflow=await actor.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 assert.ok(overflow<=2,path+" overflows mobile");
}
try{
 let customer,dealer;
 await check("real admin login",async()=>{admin=await login("ADMIN")});
 await check("real customer login",async()=>{customer=await login("CUSTOMER")});
 await check("real dealer login",async()=>{dealer=await login("DEALER")});
 assert.equal(new Set([admin.id,customer.id,dealer.id]).size,3);
 // Verify server authorization before any mutations.
 await check("customer and dealer denied admin reads and writes",async()=>{
  for(const actor of [customer,dealer]){
   await api(actor,"/api/admin/overview","GET",undefined,403);
   await api(actor,"/api/admin/catalog","POST",{},403);
   await api(actor,"/api/admin/design-reviews","PATCH",{},403);
   await api(actor,"/api/admin/analytics","GET",undefined,403);
  }
 });
 await check("customer cannot access dealer tenant",async()=>{await api(customer,"/api/dealer/overview","GET",undefined,403)});
 await check("admin dashboard browser and real metrics",async()=>{
  await pageCheck(admin,"/admin",".admin-overview");
  const d=await api(admin,"/api/admin/overview");assert.ok(d.counts&&d.studio?.length===2);
  await admin.page.getByText("Free & paid Studio access",{exact:true}).waitFor();
 });
 await check("admin pages and APIs",async()=>{
  for(const [route,endpoint] of [["catalog","catalog"],["pricing","pricing"],["marketing","catalog/campaigns"],["orders","orders"],["rfqs","rfqs"],["fulfilment","fulfilment"],["dealers","dealers"],["users","users"],["studio-settings","studio-settings"],["studio","design-reviews"],["system-health","system-incidents"],["audit","audit"],["analytics","analytics?days=30"]]){
   await pageCheck(admin,"/admin/"+route,".admin-module");await api(admin,"/api/admin/"+endpoint);
  }
 });
 await check("customer account and own-order authorization",async()=>{
  await pageCheck(customer,"/account/orders","main");const data=await api(customer,"/api/orders");
  assert.ok(Array.isArray(data.orders));for(const row of data.orders)if(row.customer_id)assert.equal(row.customer_id,customer.id);
  await api(customer,"/api/customer/quotes");
 });
 await check("approved dealer scope and browser",async()=>{
  await pageCheck(dealer,"/dealer/dashboard",".admin-module");
  const d=await api(dealer,"/api/dealer/overview");
  assert.ok(d.memberships.length>0);const tenants=new Set(d.memberships.map(x=>x.tenant_id));
  for(const b of d.branches)assert.ok(tenants.has(b.tenant_id));
  for(const route of ["inventory","quotes","orders"]){await pageCheck(dealer,"/dealer/"+route,".admin-module");await api(dealer,"/api/dealer/"+route)}
  const o=await api(dealer,"/api/dealer/orders");for(const row of o.orders??[])assert.ok(tenants.has(row.tenant_id));
 });
 await check("draft product create through real admin form, edit and archive",async()=>{
  const catalog=await api(admin,"/api/admin/catalog"),category=catalog.categories.find(c=>c.slug==="cement"&&c.status==="published");
  assert.ok(category,"Staging requires published cement taxonomy");
  await pageCheck(admin,"/admin/catalog",".catalog-admin-form");
  const form=admin.page.locator("form.catalog-admin-form").first(),slug="qa-e2e-"+randomUUID();
  await form.locator('[name="slug"]').fill(slug);await form.locator('[name="name"]').fill("QA staging material "+slug.slice(-8));await form.locator('[name="categoryId"]').selectOption(category.id);
  await form.locator('[name="description"]').fill("Isolated browser test fixture. Not a real product.");
  const created=admin.page.waitForResponse(r=>r.url().endsWith("/api/admin/catalog")&&r.request().method()==="POST");
  await form.getByRole("button",{name:"Create draft product"}).click();const response=await created;assert.equal(response.status(),201);
  const body=await response.json();productId=body.item.id;
  const v=await api(admin,"/api/admin/catalog","POST",{action:"create",kind:"variant",productId,sku:slug,unit:"bag",attributes:{}},201);variantId=v.item.id;
  await api(admin,"/api/admin/catalog","PATCH",{kind:"product",id:productId,status:"draft",description:"Updated QA staging fixture."});
  const actual=await api(admin,"/api/admin/catalog");assert.equal(actual.products.find(x=>x.id===productId)?.description,"Updated QA staging fixture.");
  await api(customer,"/api/admin/catalog","PATCH",{kind:"product",id:productId,status:"published"},403);
  const pub=await customer.context.request.get(base.origin+"/api/catalog");assert.equal(pub.status(),200);assert.ok(!(await pub.json()).products.some(p=>p.id===productId),"Draft exposed publicly");
  await api(admin,"/api/admin/catalog","PATCH",{kind:"variant",id:variantId,status:"archived"});
  await api(admin,"/api/admin/catalog","PATCH",{kind:"product",id:productId,status:"archived"});
  variantId=undefined;productId=undefined;
 });
 await check("authenticated API timing samples",async()=>{
 for(const [actor,route] of [[admin,"/api/admin/overview"],[admin,"/api/admin/catalog"],[admin,"/api/admin/analytics"],[customer,"/api/orders"],[dealer,"/api/dealer/overview"]]){
  const times=[];for(let i=0;i<5;i++){const started=performance.now();await api(actor,route);times.push(Math.round(performance.now()-started))}report.apiTimings.push({route,samples:times,p95:Math.max(...times)});console.log("API "+route+" p95="+Math.max(...times)+"ms");
 }
 });
 await check("sign-out removes admin access",async()=>{
  await admin.page.goto(base.origin+"/account");await admin.page.getByRole("button",{name:"Sign out",exact:true}).click();await admin.page.getByRole("button",{name:/Sign in securely/}).waitFor({timeout:20000});
  await admin.page.goto(base.origin+"/admin");await admin.page.getByRole("heading",{name:"Administrator access required"}).waitFor({timeout:20000});
 });
 report.status="passed";
}finally{
 try{if(admin&&variantId)await api(admin,"/api/admin/catalog","PATCH",{kind:"variant",id:variantId,status:"archived"});if(admin&&productId)await api(admin,"/api/admin/catalog","PATCH",{kind:"product",id:productId,status:"archived"})}catch{report.status="failed";report.cleanup="Staging fixture archive failed";process.exitCode=1}
 await browser.close();report.finishedAt=new Date().toISOString();writeFileSync("test-results/authenticated/report.json",JSON.stringify(report,null,2));
}
