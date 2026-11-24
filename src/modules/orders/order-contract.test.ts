import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {acceptOfferInput,customerOrderStatusInput,dealerOrderStatusInput,adminOrderStatusInput,parseOrderJson,statusForOrderError,safeOrderError} from "./order-contract.ts";
const customer="11111111-1111-4111-8111-111111111111",offer="22222222-2222-4222-8222-222222222222";
test("customer accepts only a real offer id, idempotency key and complete address",()=>{
 const valid={offerId:offer,idempotencyKey:customer,deliveryAddress:"House 26, Civil Lines, Kanpur",quoteAccepted:true};
 assert.equal(acceptOfferInput.safeParse(valid).success,true);
 assert.equal(acceptOfferInput.safeParse({...valid,quoteAccepted:false}).success,false);
 assert.equal(acceptOfferInput.safeParse({...valid,deliveryAddress:"Kanpur"}).success,false);
 assert.equal(acceptOfferInput.safeParse({...valid,totalPaise:100}).success,false);
 assert.equal(acceptOfferInput.safeParse({...valid,tenantId:customer}).success,false);
 assert.equal(acceptOfferInput.safeParse({...valid,offerId:"unverified"}).success,false);
});
test("user, dealer and admin role transition schemas forbid arbitrary completion",()=>{
 const base={orderId:customer};
 assert.equal(customerOrderStatusInput.safeParse({...base,expectedStatus:"out_for_delivery",status:"delivered"}).success,true);
 assert.equal(customerOrderStatusInput.safeParse({...base,expectedStatus:"pending_confirmation",status:"cancelled"}).success,true);
 assert.equal(customerOrderStatusInput.safeParse({...base,expectedStatus:"pending_confirmation",status:"delivered"}).success,false);
 assert.equal(dealerOrderStatusInput.safeParse({...base,expectedStatus:"pending_confirmation",status:"confirmed"}).success,true);
 assert.equal(dealerOrderStatusInput.safeParse({...base,expectedStatus:"preparing",status:"out_for_delivery"}).success,true);
 assert.equal(dealerOrderStatusInput.safeParse({...base,expectedStatus:"preparing",status:"delivered"}).success,false);
 assert.equal(adminOrderStatusInput.safeParse({...base,expectedStatus:"confirmed",status:"preparing"}).success,true);
 assert.equal(adminOrderStatusInput.safeParse({...base,expectedStatus:"out_for_delivery",status:"delivered"}).success,false);
});
test("invalid content and unbounded JSON cannot reach the order table",async()=>{
 const valid=new Request("https://neerva.test/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:'{"offerId":"test"}'});
 assert.deepEqual(await parseOrderJson(valid),{offerId:"test"});
 const invalid=new Request("https://neerva.test/api/orders",{method:"POST",headers:{"content-type":"text/plain"},body:"foo"});
 assert.equal(await parseOrderJson(invalid),null);
 const large=new Request("https://neerva.test/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:'{"address":"'+"a".repeat(5000)+'"}'});
 assert.equal(await parseOrderJson(large,1024),null);
});
test("database errors remain opaque to customers and stable for safe retries",()=>{
 assert.equal(statusForOrderError({code:"23505"}),409);
 assert.equal(statusForOrderError({code:"23514"}),409);
 assert.equal(statusForOrderError({code:"42501"}),403);
 assert.equal(statusForOrderError({code:"PGRST205"}),503);
 assert.doesNotMatch(safeOrderError({code:"23514",message:"DATABASE_SECRET"}),/DATABASE_SECRET/);
});
test("SQL order workflow has atomic offer ownership, RLS and payment safety guards",()=>{
 const ddl=readFileSync("supabase/migrations/0016_typescript_order_workflow.sql","utf8");
 for(const required of [
  "alter table public.orders enable row level security",
  "grant insert(quote_offer_id,idempotency_key,delivery_address)",
  "customer_id=(select auth.uid())",
  "where id=chosen.quote_request_id for update",
  "DEALER_DELIVERY_AREA_UNVERIFIED",
  "OFFER_EXPIRED_OR_INVALID",
  "NEWER_OFFER_REVISION_AVAILABLE",
  "neerva_order_status_guard",
  "neerva_order_audit_insert",
  "neerva_order_audit_update",
  "check(invoice_number is null)"
 ])assert.ok(ddl.includes(required),required+" missing");
 assert.doesNotMatch(ddl,/grant all on public\.orders/i,"Never grant unconstrained order writes");
});

test("private order delivery addresses are denied to sales/inventory-only memberships",()=>{
 const ddl=readFileSync("supabase/migrations/0017_order_contact_role_scope.sql","utf8");
 assert.match(ddl,/create policy neerva_orders_read on public\.orders/);
 assert.match(ddl,/is_tenant_member\(tenant_id,array\['owner','manager','dispatch'\]/);
 assert.doesNotMatch(ddl,/array\['inventory'|'sales','inventory'/);
 const dealerApi=readFileSync("src/app/api/dealer/orders/route.ts","utf8");
 assert.match(dealerApi,/in\("role",\["owner","manager","dispatch"\]\)/);
 assert.match(dealerApi,/orderTenantIds\(auth\)/);
});


test("direct orders require valid material quantities and no browser-supplied prices",async()=>{const {directOrderInput,directAdminAction,directCustomerAction}=await import("./direct-contract.ts");const base={idempotencyKey:customer,category:"cement",productSlug:"ppc-cement-50kg",quantity:10,unit:"bag",contactName:"Test Customer",phone:"9000000000",city:"Kanpur",pincode:"208001",deliveryAddress:"Test delivery address only",notes:"",consent:true};assert.ok(directOrderInput.safeParse(base).success);assert.equal(directOrderInput.safeParse({...base,unit:"piece"}).success,false);assert.equal(directOrderInput.safeParse({...base,totalPaise:1}).success,false);assert.equal(directOrderInput.safeParse({...base,tenantId:offer}).success,false);assert.ok(directAdminAction.safeParse({orderId:customer,expectedStatus:"received",status:"price_ready",breakdown:{materialPaise:8000,taxPaise:1000,freightPaise:1000,unloadingPaise:0},terms:"All delivery terms confirmed"}).success);assert.equal(directAdminAction.safeParse({orderId:customer,expectedStatus:"received",status:"delivered"}).success,false);assert.equal(directCustomerAction.safeParse({orderId:customer,expectedStatus:"received",status:"confirmed"}).success,false);assert.ok(directCustomerAction.safeParse({orderId:customer,expectedStatus:"out_for_delivery",status:"delivered"}).success);const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/direct_orders enable row level security/);assert.match(ddl,/unique\(customer_id,idempotency_key\)/);assert.match(ddl,/direct_order_events_write/);assert.doesNotMatch(ddl.slice(ddl.indexOf("create table public.direct_orders ("),ddl.indexOf("create index direct_orders_customer_created")),/tenant_id uuid not null/);});


test("direct price totals are integer paise and pagination is bounded",async()=>{const {directPriceBreakdown,directPriceTotal,directOrderPage}=await import("./direct-contract.ts");const b={materialPaise:10000,taxPaise:1800,freightPaise:2000,unloadingPaise:500};assert.equal(directPriceTotal(directPriceBreakdown.parse(b)),14300);assert.equal(directPriceBreakdown.safeParse({...b,taxPaise:-1}).success,false);assert.equal(directPriceBreakdown.safeParse({...b,totalPaise:1}).success,false);assert.deepEqual(directOrderPage(new Request("https://example.test/api/direct-orders?page=2")),{page:2,from:30,to:59});});


test("marketplace fee policy is bounded, zero disables charge, and dealer price cannot carry a tenant override",async()=>{const {feePolicyInput,calculateMarketplaceFee,dealerRateInput}=await import("../pricing/marketplace-policy.ts");const policy={fixedPaise:1000,rateBps:200,capPaise:5000,commissionBps:300,reason:"Reviewed policy"};assert.ok(feePolicyInput.safeParse(policy).success);assert.equal(calculateMarketplaceFee(100000,policy),3000);assert.equal(calculateMarketplaceFee(1000000,policy),5000);assert.equal(calculateMarketplaceFee(100000,{...policy,capPaise:0}),0);assert.equal(feePolicyInput.safeParse({...policy,rateBps:5000}).success,false);const r={branchId:customer,variantId:offer,amountPaise:10000,minimumQuantity:1};assert.ok(dealerRateInput.safeParse(r).success);assert.equal(dealerRateInput.safeParse({...r,status:"published"}).success,false);assert.equal(dealerRateInput.safeParse({...r,tenantId:offer}).success,false);const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/marketplace_fee_versions enable row level security/);assert.match(ddl,/ADMIN_PUBLICATION_REQUIRED/);assert.match(ddl,/i.available_quantity>=p_qty/);assert.match(ddl,/sp.pincode=p_pin/);assert.match(ddl,/new.fee_version_id:=fee.id/);assert.doesNotMatch(ddl,/grant update\([^)]*platform_fee_paise/);});


test("dealer delivery and SKU tax inputs reject invalid scope and values",async()=>{const {deliveryInput,deliveryReview,skuTaxInput}=await import("../pricing/delivery-policy.ts");const x={branchId:customer,pincode:"208001",freightPaise:20000,unloadingPaise:0,minimumMaterialPaise:50000,leadDays:2,acceptingOrders:true};assert.ok(deliveryInput.safeParse(x).success);assert.equal(deliveryInput.safeParse({...x,status:"approved"}).success,false);assert.equal(deliveryInput.safeParse({...x,freightPaise:-1}).success,false);assert.equal(deliveryReview.safeParse({id:1,status:"pending"}).success,false);assert.ok(skuTaxInput.safeParse({variantId:offer,hsn:"2523",rateBps:1800,priceIncludesTax:true,reason:"Reviewed invoice"}).success);const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/dealer_delivery_versions enable row level security/);assert.match(ddl,/sku_tax_versions enable row level security/);assert.match(ddl,/d.accepting_orders/);});


test("multi-product cart uses unique SKU-unit entries and validates every item",async()=>{const {addDirectCart,safeDirectCart}=await import("./direct-cart.ts");const item={category:"cement",productSlug:"ppc-cement-50kg",productName:"Cement",quantity:2,unit:"bag"};assert.equal(addDirectCart([item],item)[0].quantity,4);assert.equal(safeDirectCart([{...item,unit:"piece"}]).length,0);const {directLine}=await import("./direct-contract.ts");assert.equal(directLine.safeParse({category:"cement",productSlug:"cement",quantity:2,unit:"piece"}).success,false);assert.equal(directLine.safeParse({category:"cement",productSlug:"cement",quantity:2,unit:"bag",amountPaise:1}).success,false);});


test("admin finance records distinguish collections, refunds and procurement cost",async()=>{const {operationsInput,summarizeOperations}=await import("./operations-contract.ts");assert.equal(operationsInput.safeParse({orderId:customer,kind:"cod_received",amountPaise:1000,evidenceRef:"COD-1",note:"Verified receipt",actor:offer}).success,false);assert.equal(operationsInput.safeParse({orderId:customer,kind:"refund_paid",amountPaise:-100,evidenceRef:"REF-1",note:"Verified transfer"}).success,false);assert.deepEqual(summarizeOperations([{kind:"procurement",amount_paise:500},{kind:"cod_received",amount_paise:1000},{kind:"refund_paid",amount_paise:100}],1000),{costs:500,received:1000,refunded:100,netReceived:900,balance:100,cashContribution:400});const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/REFUND_EXCEEDS_COLLECTION/);assert.match(ddl,/direct_order_operations enable row level security/);});


test("dealer catalog requests and listing controls reject tenant and publication overrides",async()=>{const {productProposal,proposalReview,listingControl}=await import("../catalog/dealer-listings.ts");const r={branchId:customer,category:"plumbing",productName:"Pipe fitting",brandName:"Example",modelDetails:"20 mm CPVC elbow"};assert.ok(productProposal.safeParse(r).success);assert.equal(productProposal.safeParse({...r,tenantId:offer}).success,false);assert.equal(productProposal.safeParse({...r,status:"accepted"}).success,false);assert.equal(proposalReview.safeParse({id:customer,status:"published",note:"test"}).success,false);assert.ok(listingControl.safeParse({branchId:customer,variantId:offer,active:false}).success);const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/dealer_product_requests enable row level security/);assert.match(ddl,/dealer_listing_controls enable row level security/);assert.match(ddl,/lc.variant_id=v.id and not lc.active/);});


test("direct-order migration contains unique declarations and intact cart validation",()=>{const sql=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");const defs=[...sql.matchAll(/^create (?:unique )?(?:table|function|trigger|policy|index) ([^\s(]+)/gm)].map(m=>m[1]);assert.equal(new Set(defs).size,defs.length,"Duplicate migration declarations");assert.match(sql,/INVALID_CART_ITEM/);assert.match(sql,/INVALID_CART_UNIT/);assert.match(sql,/DUPLICATE_CART_ITEM/);assert.match(sql,/perform pg_advisory_xact_lock\(hashtextextended\(auth.uid\(\)::text,0\)\)/);assert.doesNotMatch(sql,/\{1,100\}\(hashtextextended/);});


test("dealer settlement calculation and evidence cannot override tenant or commission",async()=>{const {settlementAmounts,settlementRecord}=await import("./dealer-settlement.ts");assert.deepEqual(settlementAmounts(100000,120000,250),{commission:2500,payable:117500});assert.throws(()=>settlementAmounts(100000,120000,3100));assert.equal(settlementRecord.safeParse({orderId:customer,kind:"dealer_payout",amountPaise:1000,evidenceRef:"BANK-001",tenantId:offer}).success,false);const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/dealer_order_settlements enable row level security/);assert.match(ddl,/COLLECTION_AND_EXACT_PAYOUT_REQUIRED/);assert.match(ddl,/unique\(order_id,kind\)/);});


test("central pricing policies validate scope and bound platform-funded discounts",async()=>{const {feePolicyInput,calculateMarketplaceFee,calculatePlatformDiscount}=await import("../pricing/marketplace-policy.ts");const p=feePolicyInput.parse({category:"cement",pincodePrefix:"208",fixedPaise:1000,rateBps:100,capPaise:3000,commissionBps:200,discountFixedPaise:500,discountRateBps:500,discountCapPaise:4000,discountMinimumPaise:50000,reason:"Reviewed campaign"});assert.equal(calculateMarketplaceFee(100000,p),2000);assert.equal(calculatePlatformDiscount(100000,p),4000);assert.equal(calculatePlatformDiscount(49999,p),0);assert.equal(calculatePlatformDiscount(100,{...p,discountMinimumPaise:0}),99);assert.equal(calculatePlatformDiscount(100000,{...p,discountCapPaise:0}),0);assert.equal(feePolicyInput.safeParse({...p,category:"invalid"}).success,false);assert.equal(feePolicyInput.safeParse({...p,pincodePrefix:"0208"}).success,false);const ddl=readFileSync("supabase/migrations/0028_direct_order_intake.sql","utf8");assert.match(ddl,/neerva_effective_fee\(policy_category,new.pincode\)/);assert.match(ddl,/neerva_effective_fee\(p_category,p_pin\)/);assert.match(ddl,/platform_fee_paise-new.discount_paise/);assert.doesNotMatch(ddl,/grant update\([^)]*discount_paise/);});
