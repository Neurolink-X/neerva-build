import test from "node:test";
import assert from "node:assert/strict";
import {isSameOfferReplay} from "./replay-identity.ts";
test("a changed delivery address or offer cannot reuse an accepted-order idempotency key",()=>{
 const old={quote_offer_id:"offer-a",delivery_address:"12 Test Street, Kanpur"};
 assert.equal(isSameOfferReplay(old,"offer-a"," 12 Test Street, Kanpur "),true);
 assert.equal(isSameOfferReplay(old,"offer-a","18 Test Street, Kanpur"),false);
 assert.equal(isSameOfferReplay(old,"offer-b",old.delivery_address),false);
 assert.equal(isSameOfferReplay(null,"offer-a",old.delivery_address),false);
});
