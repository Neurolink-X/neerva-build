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
 const ddl=readFileSync("supabase/migrations/0017_order_role_visibility_hardening.sql","utf8");
 assert.match(ddl,/alter policy neerva_orders_read on public\.orders/);
 assert.match(ddl,/is_tenant_member\(tenant_id,array\['owner','manager','dispatch'\]/);
 assert.doesNotMatch(ddl,/array\['inventory'|'sales','inventory'/);
 const dealerApi=readFileSync("src/app/api/dealer/orders/route.ts","utf8");
 assert.match(dealerApi,/in\("role",\["owner","manager","dispatch"\]\)/);
 assert.match(dealerApi,/orderTenantIds\(auth\)/);
});
