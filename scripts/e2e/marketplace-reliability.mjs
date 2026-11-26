import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
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
 return {client,token:data.session.access_token,id:data.user.id};
}
async function call(role,path,method="GET",body){
 const r=await fetch(base+path,{method,redirect:"error",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+role.token,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:r.status,data:await r.json()};
}
const [a,b,c,d,other]=await Promise.all(["DEALER_A","DEALER_B","CUSTOMER","ADMIN","OTHER_CUSTOMER"].map(login));
const branches=[process.env.NEERVA_E2E_DEALER_A_BRANCH,process.env.NEERVA_E2E_DEALER_B_BRANCH];
for(const [i,actor] of [a,b].entries()){
 const list=await call(actor,"/api/dealer/inventory");
 assert.equal(list.status,200);
 assert.ok(list.data.branches.some(x=>x.id===branches[i]));
 assert.ok(!list.data.branches.some(x=>x.id===branches[1-i]),"Cross-dealer branch leaked");
 const foreign=await call(actor,"/api/dealer/inventory","POST",{branchId:branches[1-i],variantId:randomUUID(),quantity:1,unit:"bag"});
 assert.equal(foreign.status,403,"Cross-tenant write must fail");
 const foreignBranch=await actor.client.from("merchant_branches").select("tenant_id").eq("id",branches[1-i]).single();
 assert.ifError(foreignBranch.error); // Approved branch identity is intentionally public.
 const direct=await actor.client.from("tenant_memberships").select("tenant_id").eq("tenant_id",foreignBranch.data.tenant_id);
 assert.ifError(direct.error);assert.equal(direct.data.length,0,"RLS leaked unrelated private memberships");
}
// Use only an explicitly published synthetic SKU on the disposable instance.
const catalog="/api/admin/catalog";
const taxonomy=await call(d,catalog);
assert.equal(taxonomy.status,200);
const draftCommand={action:"import-reference-drafts",offset:0};
assert.equal((await call(c,catalog,"POST",draftCommand)).status,403);
assert.equal((await call(d,catalog,"POST",{...draftCommand,offset:1})).status,400);
let refOffset=0,checkedReferences=0;
while(refOffset!==null){
 const batch=await call(d,catalog,"POST",{...draftCommand,offset:refOffset});
 assert.equal(batch.status,200,JSON.stringify(batch.data));
 assert.equal(batch.data.publication,"draft_only");
 assert.equal(batch.data.pricesCreated,0);assert.equal(batch.data.stockCreated,0);
 checkedReferences+=batch.data.processed;
 assert.ok(batch.data.nextOffset===null||batch.data.nextOffset>refOffset);
 refOffset=batch.data.nextOffset;
}
assert.ok(checkedReferences>300,"All reference batches reconciled");
const retryDrafts=await call(d,catalog,"POST",draftCommand);
assert.equal(retryDrafts.status,200,JSON.stringify(retryDrafts.data));assert.equal(retryDrafts.data.createdProducts,0);assert.equal(retryDrafts.data.createdVariants,0);

const category=taxonomy.data.categories.find(x=>x.slug==="cement");assert.ok(category);
if(category.status!=="published")assert.equal((await call(d,catalog,"PATCH",{kind:"category",id:category.id,status:"published"})).status,200);
// A genuinely new account starts without a tenant, branch or dealer role.
const applicant=await login("ONBOARDING"),onboard="/api/dealer/onboarding";
assert.equal((await call(applicant,"/api/dealer/overview")).status,403);
const initial=await call(applicant,onboard);assert.equal(initial.status,200);assert.equal(initial.data.application,null);
const freshDraft={action:"save",legalBusinessName:"Disposable self-service shop",gstin:"09ABCDE1234F2Z5",shopCity:"Kanpur",shopPincode:"208001",servicePincodes:["208001"],categoryIds:[category.id]};
const newDraft=await call(applicant,onboard,"POST",freshDraft);assert.equal(newDraft.status,200,JSON.stringify(newDraft.data));
const appId=newDraft.data.applicationId;assert.ok(appId);
assert.equal((await call(applicant,onboard,"POST",freshDraft)).data.applicationId,appId,"Draft retry must reuse application");
const submitNew={action:"submit",applicationId:appId};
assert.equal((await call(applicant,onboard,"POST",submitNew)).status,400,"Photo required");
assert.equal((await call(b,onboard,"POST",submitNew)).status,403,"Foreign applicant denied");
const privatePhoto=readFileSync("public/images/studio/finished.webp"),newPhotoPath=appId+"/"+randomUUID()+".webp";
assert.ifError((await applicant.client.storage.from("neerva-dealer-kyc").upload(newPhotoPath,privatePhoto,{contentType:"image/webp",upsert:false})).error);
assert.ifError((await applicant.client.from("dealer_shop_photos").insert({application_id:appId,uploaded_by:applicant.id,storage_path:newPhotoPath,content_type:"image/webp",file_bytes:privatePhoto.length})).error);
assert.equal((await call(applicant,onboard,"POST",submitNew)).status,200);
assert.equal((await call(applicant,onboard,"POST",submitNew)).status,200,"Submit retry is safe");
assert.equal((await call(applicant,"/api/dealer/overview")).status,403);
const freshReview=(actor,action)=>call(actor,"/api/admin/dealers","PATCH",{id:appId,expected:"submitted",action,reason:"Disposable self-service onboarding test evidence."});
assert.equal((await freshReview(applicant,"approve")).status,403);
assert.equal((await freshReview(d,"approve")).status,400);
assert.equal((await freshReview(d,"verify_gstin")).status,200);
assert.equal((await freshReview(d,"verify_photo")).status,200);
const freshApproval=await freshReview(d,"approve");assert.equal(freshApproval.status,200,JSON.stringify(freshApproval.data));
const approvedApplicant=await call(applicant,onboard);assert.equal(approvedApplicant.data.application.status,"approved");
assert.equal((await call(applicant,"/api/dealer/overview")).status,200);
const newInventory=await call(applicant,"/api/dealer/inventory");assert.equal(newInventory.status,200);assert.equal(newInventory.data.branches.length,1);
console.log("Fresh verified account → self-service draft → private KYC → admin approval → dealer inventory access verified.");
const suffix=randomUUID().slice(0,8);
const fixture=await call(d,catalog,"POST",{action:"create",kind:"product",categoryId:category.id,slug:"test-stock-"+suffix,name:"Disposable cement fixture",description:"Local integration test only",attributes:{}});
assert.equal(fixture.status,201);
assert.equal((await call(d,catalog,"PATCH",{kind:"product",id:fixture.data.item.id,status:"published"})).status,200);
const variant=await call(d,catalog,"POST",{action:"create",kind:"variant",productId:fixture.data.item.id,sku:"TEST-"+suffix,unit:"bag",attributes:{}});
assert.equal(variant.status,201);
const variantId=variant.data.item.id;
assert.equal((await call(d,catalog,"PATCH",{kind:"variant",id:variantId,status:"published"})).status,200);
const stock={branchId:branches[0],variantId,quantity:10,unit:"bag",expectedUpdatedAt:null};
assert.equal((await call(a,"/api/dealer/inventory","POST",stock)).status,200);
assert.equal((await call(a,"/api/dealer/inventory","POST",{...stock,unit:"kg"})).status,409);
assert.equal((await call(a,"/api/dealer/inventory","POST",{...stock,quantity:-1})).status,400);
assert.equal((await call(b,"/api/dealer/inventory","POST",stock)).status,403);
const own=await call(a,"/api/dealer/inventory");
assert.ok(own.data.inventory.some(x=>x.variant_id===variantId&&Number(x.available_quantity)===10));
const initialStockVersion=own.data.inventory.find(x=>x.branch_id===branches[0]&&x.variant_id===variantId).updated_at;
const privateStock=await b.client.from("inventory").select("branch_id,variant_id,available_quantity").eq("branch_id",branches[0]).eq("variant_id",variantId);
assert.ifError(privateStock.error);assert.equal(privateStock.data.length,0,"Cross-tenant private stock leaked");
// Explicit local-only KYC and PIN fixtures: no actual GST verification implied.
const db=new URL(process.env.DB_URL??"postgresql://invalid.invalid");
assert.equal(db.protocol,"postgresql:");assert.equal(db.hostname,"127.0.0.1");assert.equal(db.port,"54322");assert.equal(db.pathname,"/postgres");
assert.equal(process.env.NEERVA_E2E_LOCAL,"yes");
const uuid=x=>{assert.match(x,/^[0-9a-f-]{36}$/i);return "'"+x+"'";};
const localSql=sql=>execFileSync("psql",[db.toString(),"-X","-v","ON_ERROR_STOP=1","-At","-c",sql],{encoding:"utf8"}).trim();
const tenantResult=await a.client.from("tenant_memberships").select("tenant_id").eq("user_id",a.id).single();
assert.ifError(tenantResult.error);const tenant=tenantResult.data.tenant_id;
const application=randomUUID();
// Provisioning of the tenant/membership is an isolated fixture; KYC itself uses
// the real dealer-owned database policies, private storage and admin HTTP review.
localSql("update public.tenants set status='pending' where id="+uuid(tenant));
const draft=await a.client.from("dealer_applications").insert({id:application,tenant_id:tenant,owner_id:a.id,legal_business_name:"Disposable dealer fixture",gstin:"09ABCDE1234F1Z5",shop_city:"Kanpur"}).select("id,status").single();
assert.ifError(draft.error);assert.equal(draft.data.status,"draft");
assert.ifError((await a.client.from("dealer_service_pincodes").insert({application_id:application,pincode:"208001"})).error);
assert.ifError((await a.client.from("dealer_categories").insert({application_id:application,category_id:category.id})).error);
const photoBytes=readFileSync("public/images/studio/finished.webp"),photoPath=application+"/"+randomUUID()+".webp";
assert.ifError((await a.client.storage.from("neerva-dealer-kyc").upload(photoPath,photoBytes,{contentType:"image/webp",upsert:false})).error);
assert.ifError((await a.client.from("dealer_shop_photos").insert({application_id:application,uploaded_by:a.id,storage_path:photoPath,content_type:"image/webp",file_bytes:photoBytes.length})).error);
const foreignKyc=await b.client.from("dealer_applications").select("id").eq("id",application);
assert.ifError(foreignKyc.error);assert.equal(foreignKyc.data.length,0);
const selfApprove=await a.client.from("dealer_applications").update({status:"approved",gstin_verification:"verified",reviewed_by:a.id,reviewed_at:new Date().toISOString()}).eq("id",application);
assert.ok(selfApprove.error,"Dealer cannot self-approve");
const submitted=await a.client.from("dealer_applications").update({status:"submitted",submitted_at:new Date().toISOString()}).eq("id",application).select("status").single();
assert.ifError(submitted.error);assert.equal(submitted.data.status,"submitted");
const reviewDealer=(actor,action,expected="submitted")=>call(actor,"/api/admin/dealers","PATCH",{id:application,expected,action,reason:"Disposable test evidence only; no real GST verification."});
assert.equal((await reviewDealer(a,"approve")).status,403);
assert.equal((await reviewDealer(d,"approve")).status,400,"Incomplete verification cannot approve");
assert.equal((await reviewDealer(d,"verify_gstin")).status,200);
assert.equal((await reviewDealer(d,"verify_photo")).status,200);
const approved=await reviewDealer(d,"approve");assert.equal(approved.status,200,JSON.stringify(approved.data));
assert.equal((await call(a,"/api/dealer/overview")).status,200);
assert.equal((await reviewDealer(d,"suspend","approved")).status,200);
assert.equal((await call(a,"/api/dealer/overview")).status,403);
assert.equal((await reviewDealer(d,"reactivate","suspended")).status,200);
assert.equal((await call(a,"/api/dealer/overview")).status,200);
console.log("Disposable dealer application, KYC privacy, anti-self-approval, admin review and suspension/reactivation verified.");

 // Two real catalog references, with disposable reviewed prices and stock.
 const combinedLines=[];
 for(const [slug,amount] of [["ppc-cement-50kg",20000],["opc-cement-53-grade",30000]]){
  let found=await d.client.from("products").select("id,status").eq("category_id",category.id).eq("slug",slug).maybeSingle();assert.ifError(found.error);
  let product=found.data;
  if(!product){const created=await call(d,catalog,"POST",{action:"create",kind:"product",categoryId:category.id,slug,name:"Disposable "+slug,description:"Local test fixture only",attributes:{}});assert.equal(created.status,201,JSON.stringify(created.data));product=created.data.item;}
  // Reference import contains unreviewed brand drafts. For this disposable fixture only, remove brand linkage instead of claiming manufacturer authorization.
  localSql("update public.products set brand_id=null where id="+uuid(product.id));
  if(product.status!=="published"){const published=await call(d,catalog,"PATCH",{kind:"product",id:product.id,status:"published"});assert.equal(published.status,200,JSON.stringify(published.data));}
  const made=await call(d,catalog,"POST",{action:"create",kind:"variant",productId:product.id,sku:"COMBINED-"+randomUUID().slice(0,8),unit:"bag",attributes:{}});assert.equal(made.status,201,JSON.stringify(made.data));
  const vid=made.data.item.id;assert.equal((await call(d,catalog,"PATCH",{kind:"variant",id:vid,status:"published"})).status,200);
  assert.equal((await call(a,"/api/dealer/inventory","POST",{branchId:branches[0],variantId:vid,quantity:20,unit:"bag",expectedUpdatedAt:null})).status,200);
  const rate=await call(d,"/api/admin/pricing","POST",{variantId:vid,tenantId:tenant,branchId:branches[0],city:"Kanpur",pincodePrefix:"208001",minimumQuantity:1,unit:"bag",amountPaise:amount,visibility:"public",validFrom:new Date(Date.now()-60000).toISOString()});
  assert.equal(rate.status,201,JSON.stringify(rate.data));assert.equal((await call(d,"/api/admin/pricing","PATCH",{id:rate.data.rule.id,status:"published"})).status,200);
  assert.equal((await call(d,"/api/admin/sku-tax","POST",{variantId:vid,hsn:"2523",rateBps:0,priceIncludesTax:true,reason:"Disposable test fixture only"})).status,200);
  combinedLines.push({category:"cement",productSlug:slug,quantity:2,unit:"bag"});
 }
 const shipping=await call(a,"/api/dealer/delivery-settings","POST",{branchId:branches[0],pincode:"208001",freightPaise:9000,unloadingPaise:3000,minimumMaterialPaise:0,leadDays:1,acceptingOrders:true});
 assert.equal(shipping.status,200,JSON.stringify(shipping.data));assert.equal((await call(d,"/api/admin/delivery-settings","PATCH",{id:shipping.data.row.id,status:"approved"})).status,200);
 const estimate=await c.client.rpc("neerva_combined_cart_estimate",{p_items:combinedLines,p_pin:"208001",p_unload:true});assert.ifError(estimate.error);assert.ok(estimate.data,JSON.stringify(estimate));assert.equal(estimate.data.material_paise,100000);assert.equal(estimate.data.freight_paise,9000);assert.equal(estimate.data.unloading_paise,3000);assert.equal(estimate.data.branch_id,branches[0]);
 const noUnload=await c.client.rpc("neerva_combined_cart_estimate",{p_items:combinedLines,p_pin:"208001",p_unload:false});assert.ifError(noUnload.error);assert.equal(noUnload.data.unloading_paise,0);assert.equal(estimate.data.estimated_total_paise-noUnload.data.estimated_total_paise,3000);
 const noCoverage=await c.client.rpc("neerva_combined_cart_estimate",{p_items:combinedLines,p_pin:"999999",p_unload:true});assert.ifError(noCoverage.error);assert.equal(noCoverage.data,null);
 const direct=await call(c,"/api/direct-orders","POST",{...combinedLines[0],items:combinedLines,idempotencyKey:randomUUID(),contactName:"Disposable order",phone:"9000000000",city:"Kanpur",pincode:"208001",deliveryAddress:"Disposable staging address, never dispatch",notes:"Synthetic combined shipment",unloadingRequested:true,consent:true});assert.equal(direct.status,201,JSON.stringify(direct.data));
 const assignedId=direct.data.order.id;
 const assignment=await a.client.from("direct_order_sourcing").select("order_id,status,estimate").eq("order_id",assignedId).single();assert.ifError(assignment.error);assert.equal(assignment.data.status,"assigned");assert.equal(assignment.data.estimate.freight_paise,9000);
 const hiddenAssignment=await b.client.from("direct_order_sourcing").select("order_id").eq("order_id",assignedId);assert.ifError(hiddenAssignment.error);assert.equal(hiddenAssignment.data.length,0);
 assert.equal((await b.client.rpc("neerva_respond_direct_sourcing",{p_order:assignedId,p_accept:true})).data,false);
 assert.equal((await a.client.rpc("neerva_respond_direct_sourcing",{p_order:assignedId,p_accept:true})).data,true);
 assert.equal((await a.client.rpc("neerva_respond_direct_sourcing",{p_order:assignedId,p_accept:false})).data,false);
 assert.equal((await call(c,"/api/direct-orders","PATCH",{orderId:assignedId,expectedStatus:"received",status:"cancelled"})).status,200);
 const closed=await a.client.from("direct_order_sourcing").select("status").eq("order_id",assignedId).single();assert.ifError(closed.error);assert.equal(closed.data.status,"closed");
 console.log("Combined shipment, one freight charge, unloading option, automatic sourcing, dealer isolation, acknowledgement and cancellation verified.");


async function acceptedOrder(customer){
 // Exercise the same authenticated endpoint as the customer enquiry form.
 const rfq=await call(customer,"/api/rfqs","POST",{idempotencyKey:randomUUID(),categorySlug:"cement",materialDescription:"Disposable cement fixture",quantity:10,unit:"bag",city:"Kanpur",pincode:"208001",contactName:"Disposable fixture",phone:"9000000000",privacyAccepted:true});
 assert.equal(rfq.status,201,JSON.stringify(rfq.data));const req=rfq.data.requestId;assert.ok(req);
 const ownRequests=await call(customer,"/api/customer/quotes");assert.equal(ownRequests.status,200);assert.ok(ownRequests.data.requests.some(q=>q.id===req));
 const outsider=customer.id===c.id?other:c;
 const hiddenRequests=await call(outsider,"/api/customer/quotes");assert.equal(hiddenRequests.status,200);assert.ok(!hiddenRequests.data.requests.some(q=>q.id===req));
 const invite=await call(d,"/api/admin/rfqs","POST",{requestId:req,tenantId:tenant});
 assert.equal(invite.status,409,"Automatically routed dealer must not receive a duplicate invite");
 const applicantInbox=await call(applicant,"/api/dealer/quotes");assert.equal(applicantInbox.status,200);assert.ok(applicantInbox.data.invites.some(q=>q.quote_request_id===req),"Matching approved new dealer receives automatic outreach");
 const inbox=await call(a,"/api/dealer/quotes");assert.equal(inbox.status,200);assert.ok(inbox.data.invites.some(q=>q.quote_request_id===req));
 const foreignInbox=await call(b,"/api/dealer/quotes");assert.equal(foreignInbox.status,200);assert.ok(!foreignInbox.data.invites.some(q=>q.quote_request_id===req));
 const quote=await call(a,"/api/dealer/quotes","POST",{quoteRequestId:req,tenantId:tenant,lines:[{description:"Disposable cement fixture",quantity:10,unit:"bag",unitPricePaise:1000}],taxPaise:0,freightPaise:0,unloadingPaise:0,terms:"Synthetic test; no delivery",validUntil:new Date(Date.now()+3600000).toISOString()});
 assert.equal(quote.status,201,JSON.stringify(quote.data));
 const offers=await call(customer,"/api/customer/quotes");assert.equal(offers.status,200);assert.ok(offers.data.requests.find(q=>q.id===req)?.offers.some(o=>o.id===quote.data.offer.id));
 const payload={offerId:quote.data.offer.id,idempotencyKey:randomUUID(),deliveryAddress:"Disposable Kanpur address only",quoteAccepted:true};
 const accept=await call(customer,"/api/orders","POST",payload);
 assert.equal(accept.status,201,JSON.stringify(accept.data));
 assert.equal(accept.data.order.customer_id,customer.id);
 assert.equal(accept.data.order.total_paise,10000);
 assert.equal(accept.data.order.pincode,"208001");assert.equal(accept.data.paymentTaken,false);
 const dealerOrders=await call(a,"/api/dealer/orders");assert.equal(dealerOrders.status,200);assert.ok(dealerOrders.data.orders.some(o=>o.id===accept.data.order.id));
 const foreignOrders=await call(b,"/api/dealer/orders");assert.equal(foreignOrders.status,200);assert.ok(!foreignOrders.data.orders.some(o=>o.id===accept.data.order.id));
 const customerOrders=await call(customer,"/api/orders");assert.equal(customerOrders.status,200);assert.ok(customerOrders.data.orders.some(o=>o.id===accept.data.order.id));
 const replay=await call(customer,"/api/orders","POST",payload);
 assert.equal(replay.status,200,JSON.stringify(replay.data));
 assert.equal(replay.data.order.id,accept.data.order.id);
 assert.equal((await call(customer,"/api/orders","POST",{...payload,deliveryAddress:"Different disposable delivery address"})).status,409);
 const stored=await customer.client.from("quote_requests").select("status").eq("id",req).single();
 assert.ifError(stored.error);assert.equal(stored.data.status,"accepted");
 return accept.data.order.id;
}
const [firstOrder,secondOrder]=await Promise.all([acceptedOrder(c),acceptedOrder(other)]);
console.log("Customer RFQ API → dealer invite/inbox → quote visibility → customer acceptance → dealer and customer order history verified.");
const reservePath="/api/dealer/orders/stock";
const selection=id=>({orderId:id,branchId:branches[0],variantIds:[variantId],exactSkuConfirmed:true});
assert.equal((await call(b,reservePath,"POST",selection(firstOrder))).status,403);
assert.equal((await call(c,reservePath,"POST",selection(firstOrder))).status,403);
assert.equal((await call(a,"/api/dealer/orders","PATCH",{orderId:firstOrder,expectedStatus:"pending_confirmation",status:"confirmed"})).status,409);
const bypass=await a.client.from("orders").update({status:"confirmed"}).eq("id",firstOrder).select("id");
assert.ok(bypass.error,"Direct database status update must not bypass reservation");
const results=await Promise.all([call(a,reservePath,"POST",selection(firstOrder)),call(a,reservePath,"POST",selection(secondOrder))]);
assert.deepEqual(results.map(x=>x.status).sort(),[200,409],"Last ten bags must have exactly one winner");
const winner=results[0].status===200?firstOrder:secondOrder,loser=winner===firstOrder?secondOrder:firstOrder;
const quantity=()=>Number(localSql("select available_quantity from public.inventory where branch_id="+uuid(branches[0])+" and variant_id="+uuid(variantId)));
assert.equal(quantity(),0);
const archiveHeld=await d.client.from("product_variants").update({status:"archived"}).eq("id",variantId).select("id");
assert.equal(archiveHeld.error?.code,"23514","Reserved SKU must not be archived before fulfillment or release");
assert.equal((await call(a,reservePath,"POST",selection(winner))).status,409);
assert.equal((await call(a,"/api/dealer/inventory","POST",{...stock,expectedUpdatedAt:initialStockVersion})).status,409,"Stale absolute update must not recreate held stock");
assert.equal((await call(d,"/api/admin/orders","PATCH",{orderId:winner,expectedStatus:"confirmed",status:"cancelled"})).status,200);
assert.equal(quantity(),10,"Cancellation must release stock exactly once");
assert.equal((await call(a,"/api/dealer/inventory","POST",{...stock,quantity:20,expectedUpdatedAt:initialStockVersion})).status,409,"A pre-reservation snapshot cannot overwrite stock even after release");
assert.equal((await call(d,"/api/admin/orders","PATCH",{orderId:winner,expectedStatus:"confirmed",status:"cancelled"})).status,409);
assert.equal(quantity(),10);
assert.equal((await call(a,reservePath,"POST",selection(loser))).status,200);
assert.equal(quantity(),0);
for(const [expectedStatus,status] of [["confirmed","preparing"],["preparing","out_for_delivery"]])assert.equal((await call(a,"/api/dealer/orders","PATCH",{orderId:loser,expectedStatus,status})).status,200);
assert.equal((await call(d,"/api/admin/orders","PATCH",{orderId:loser,expectedStatus:"out_for_delivery",status:"cancelled"})).status,200);
assert.equal(quantity(),0,"Dispatched stock cannot be restocked by cancellation");
const archived=await d.client.from("product_variants").update({status:"archived"}).eq("id",variantId).select("id").single();
assert.ifError(archived.error);assert.equal(archived.data.id,variantId);
const movement=Number(localSql("select coalesce(sum(quantity_delta),0) from public.inventory_movements where branch_id="+uuid(branches[0])+" and variant_id="+uuid(variantId)+" and reason in ('order_stock_reserved','order_stock_released')"));
assert.equal(movement,-10,"Movement journal must reconcile reserved and returned stock");

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
const purchases=await Promise.all([call(c,payment,"POST",{product}),call(c,payment,"POST",{product})]);
assert.deepEqual(purchases.map(x=>x.status),[200,200]);
const started=purchases[0];const orderId=started.data.orderId;assert.ok(orderId);assert.equal(started.data.pricePaise,14900);assert.equal(purchases[1].data.orderId,orderId,"Concurrent checkout must reuse the pending purchase");
const repeat=await call(c,payment,"POST",{product});assert.equal(repeat.data.orderId,orderId);
// Support ticket creation, retry receipt, ownership, account-private history and admin reply.
const support="/api/studio/support",supportBody={orderId,issue:"payment_not_verified",message:"Disposable support receipt test; no payment made.",requestId:randomUUID()};
const orderOptions=await call(c,support);assert.equal(orderOptions.status,200);assert.ok(orderOptions.data.orders.some(o=>o.id===orderId));
assert.equal((await call(other,support,"POST",supportBody)).status,403);
const ticket=await call(c,support,"POST",supportBody);assert.equal(ticket.status,201,JSON.stringify(ticket.data));assert.equal(ticket.data.ticket.id,supportBody.requestId);
const retryTicket=await call(c,support,"POST",supportBody);assert.equal(retryTicket.status,200);assert.equal(retryTicket.data.ticket.id,ticket.data.ticket.id);
assert.equal((await call(c,support,"POST",{...supportBody,message:"Different support content for this same ID."})).status,409);
const privateTickets=await call(other,support);assert.equal(privateTickets.status,200);assert.ok(!privateTickets.data.tickets.some(t=>t.id===ticket.data.ticket.id));
const reviewTicket=await call(d,"/api/admin/studio-support","PATCH",{ticketId:ticket.data.ticket.id,status:"resolved",reply:"Disposable test reply; no financial transaction."});assert.equal(reviewTicket.status,200);
const receipt=await call(c,support);assert.equal(receipt.status,200);assert.equal(receipt.data.tickets.find(t=>t.id===ticket.data.ticket.id)?.status,"resolved");
console.log("Authenticated support ticket receipt, idempotency, ownership and admin response verified.");
const claim={orderId,utr:"TEST"+randomUUID().replaceAll("-","").slice(0,20).toUpperCase(),paidAt:new Date().toISOString()};
assert.equal((await call(a,payment+"/claim","POST",claim)).status,409);
const claims=await Promise.all([call(c,payment+"/claim","POST",claim),call(c,payment+"/claim","POST",claim)]);
assert.deepEqual(claims.map(x=>x.status).sort(),[201,409],"Exactly one duplicate UTR submission may persist");
assert.equal((await call(c,payment+"/claim","POST",claim)).status,409);
assert.equal((await call(c,payment,"DELETE",{orderId})).status,409,"Claimed checkout cannot be cancelled");
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
assert.equal((await status()).data.canUseReport,false);
assert.equal((await call(d,"/api/admin/studio-payments","PATCH",{...review,action:"refunded"})).status,409,"Repeated refund must not reapply state");
// Race a claim and cancellation on a fresh checkout, then inspect the persisted result.
const raceOrder=await call(c,payment,"POST",{product});
assert.equal(raceOrder.status,200);const raceId=raceOrder.data.orderId;
const raceClaim={orderId:raceId,utr:"RACE"+randomUUID().replaceAll("-","").slice(0,20).toUpperCase(),paidAt:new Date().toISOString()};
const race=await Promise.all([call(c,payment+"/claim","POST",raceClaim),call(c,payment,"DELETE",{orderId:raceId})]);
assert.ok((race[0].status===201&&race[1].status===409)||(race[0].status===409&&race[1].status===200),"Claim/cancellation must have one winner");
const storedRace=await c.client.from("studio_paid_orders").select("status").eq("id",raceId).single();
assert.ifError(storedRace.error);
const storedClaims=await c.client.from("studio_payment_claims").select("id").eq("order_id",raceId);
assert.ifError(storedClaims.error);
assert.equal(storedRace.data.status,race[0].status===201?"requested":"cancelled");
assert.equal(storedClaims.data.length,race[0].status===201?1:0);
for(const pin of ["000000","20800","2080019","20A001"]){assert.equal((await call(c,"/api/customer/dealer-comparison?category=cement&slug=ppc-cement-50kg&qty=1&pin="+pin)).status,400);}
console.log(JSON.stringify({scope:"disposable fixtures; no real money, bank verification or dispatch",checks:["dealer branch isolation","cross-tenant writes denied","RLS read isolation","valid stock write","negative and incorrect-unit stock rejection","cross-tenant stock privacy","payment idempotency","foreign claim denied","duplicate claim denied","admin verification","refund revokes access"]}));
