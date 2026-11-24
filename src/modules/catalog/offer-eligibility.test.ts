import test from "node:test";
import assert from "node:assert/strict";
import {hasRealActiveDiscount,type OfferValidity} from "./offer-eligibility.ts";
const now=Date.parse("2026-11-24T01:00:00Z");
const good:OfferValidity={
 basePaise:30000,offerPaise:27500,startsAt:"2026-11-23T00:00:00Z",
 endsAt:"2026-11-25T00:00:00Z",priceAmountPaise:30000,
 priceStatus:"published",visibility:"public",
 priceStartsAt:"2026-11-20T00:00:00Z",priceEndsAt:"2026-11-30T00:00:00Z"
};
test("only genuine lower-priced, currently published offers can show urgency",()=>{
 assert.equal(hasRealActiveDiscount(good,now),true);
 for(const [name,change] of [
  ["expired",{endsAt:"2026-11-24T00:00:00Z"}],
  ["future",{startsAt:"2026-11-25T00:00:00Z",endsAt:"2026-11-28T00:00:00Z"}],
  ["fake baseline",{priceAmountPaise:25000}],
  ["fake savings",{offerPaise:30000}],
  ["negative",{offerPaise:-1}],
  ["not published",{priceStatus:"draft"}],
  ["private price",{visibility:"quote_only"}],
  ["outside price window",{endsAt:"2026-12-01T00:00:00Z"}],
  ["unsafe amount",{offerPaise:Number.MAX_SAFE_INTEGER+3}]
 ] as [string,Partial<OfferValidity>][])
 assert.equal(hasRealActiveDiscount({...good,...change},now),false,name);
});
