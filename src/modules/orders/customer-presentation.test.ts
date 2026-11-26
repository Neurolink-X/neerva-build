import test from "node:test";
import assert from "node:assert/strict";
import {customerRequestError,customerOrderLabel,customerQuoteLabel} from "./customer-presentation.ts";
test("customer copy never displays internal status or failure codes",()=>{
 assert.equal(customerOrderLabel("price_ready"),"Price ready for approval");
 assert.equal(customerOrderLabel("internal_db_failure"),"Status unavailable — refresh to check");
 assert.equal(customerQuoteLabel("open"),"Waiting for offers");
 assert.match(customerRequestError(503),/Check My Orders/);
 assert.match(customerRequestError(503,"quote"),/Check My Quotations/);
 assert.match(customerRequestError(409,"order","COUPON_UNAVAILABLE"),/Remove/);
 assert.match(customerRequestError(429),/try again/);
});
