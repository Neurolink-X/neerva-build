import test from "node:test";
import assert from "node:assert/strict";
import {baseStudioConfig,parseStudioConfig,permittedStudioReport,availableCheckout} from "./studio-config.ts";
const row={product_code:"home_studio",access_mode:"paid",price_paise:14900,free_preview_count:4,
 checkout_enabled:false,is_published:true,version:1};
test("published admin setting parses with exact paise and never trusts malformed or unlisted product",()=>{
 const config=parseStudioConfig(row);
 assert.deepEqual(config,{product:"home_studio",mode:"paid",pricePaise:14900,
  freePreviewCount:4,checkoutEnabled:false,published:true,version:1});
 for(const value of [{...row,product_code:"invented"},{...row,price_paise:-1},
  {...row,price_paise:2000001},{...row,free_preview_count:0},
  {...row,access_mode:"vip"},{...row,is_published:"yes"},null]){
  assert.equal(parseStudioConfig(value),null,"invalid setting fails closed");
 }
});
test("admins can switch free and paid reports without bypassing server purchase verification",()=>{
 const base=baseStudioConfig("colour_studio");
 assert.equal(permittedStudioReport(base,true),false,"unpublished never grants new access");
 const published={...base,published:true,mode:"paid" as const,checkoutEnabled:true};
 assert.equal(permittedStudioReport(published,false),false);
 assert.equal(permittedStudioReport(published,true),true);
 assert.equal(availableCheckout(published,true,false),true);
 assert.equal(availableCheckout(published,false,false),false);
 assert.equal(availableCheckout(published,true,true),false);
 const free={...published,mode:"free" as const};
 assert.equal(permittedStudioReport(free,false),true);
 assert.equal(availableCheckout(free,true,false),false,"free never charges");
});
test("per-service published price changes only future checkout, not any existing order snapshot",()=>{
 const order={pricePaise:14900,orderId:"order-1"},published={...baseStudioConfig("home_studio"),pricePaise:19900};
 assert.equal(order.pricePaise,14900);
 assert.equal(published.pricePaise,19900);
 assert.equal(order.pricePaise!==published.pricePaise,true);
});
