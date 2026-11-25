import assert from "node:assert/strict";
import {test} from "node:test";
import {isStudioCheckoutStatus} from "./checkout-status.ts";
const status={product:"home_studio",enabled:true,mode:"paid",paid:false,canUseReport:false,pricePaise:29900,orders:[{id:"order1",status:"requested",created_at:"2026-11-25",amount_paise:29900}],claimedOrderIds:[]};
test("accepts a valid checkout response",()=>assert.equal(isStudioCheckoutStatus(status,"home_studio"),true));
test("rejects wrong product or malformed entitlement",()=>{for(const v of [null,{...status,product:"colour_studio"},{...status,paid:"false"},{...status,enabled:1},{...status,mode:"other"}])assert.equal(isStudioCheckoutStatus(v,"home_studio"),false);});
test("rejects unsafe prices and invalid order records",()=>{for(const v of [{...status,pricePaise:NaN},{...status,orders:[null]},{...status,orders:[{...status.orders[0],amount_paise:0}]},{...status,claimedOrderIds:[null]}])assert.equal(isStudioCheckoutStatus(v,"home_studio"),false);});
test("accepts a free product without an order",()=>assert.equal(isStudioCheckoutStatus({...status,mode:"free",enabled:false,canUseReport:true,pricePaise:0,orders:[]},"home_studio"),true));

test("reject inconsistent entitlements, unknown states and unrelated claims",()=>{for(const v of [{...status,canUseReport:true},{...status,paid:true},{...status,pricePaise:0},{...status,orders:[{...status.orders[0],status:"unknown"}]},{...status,orders:[{...status.orders[0],created_at:"invalid"}]},{...status,orders:[status.orders[0],status.orders[0]]},{...status,claimedOrderIds:["different-order"]}])assert.equal(isStudioCheckoutStatus(v,"home_studio"),false);});
