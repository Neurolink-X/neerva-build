import assert from "node:assert/strict";
import test from "node:test";
import { rfqSchema } from "./schema.ts";
import {categoryUnitOptions,defaultCategoryUnit,isAllowedCategoryUnit,quantityUnitLabels} from "../catalog/category-units.ts";

const validRequest = {
  idempotencyKey: "f1d3068d-3f5f-4e5c-a14e-2546fb9902ed",
  categorySlug: "aggregates",
  materialDescription: "Washed sand for slab work",
  quantity: 1,
  unit: "truck",
  city: "Kanpur",
  pincode: "208001",
  contactName: "Asha Kumar",
  phone: "9876543210",
  privacyAccepted: true,
};

test("valid quote request has a bounded, typed shape", () => {
  assert.equal(rfqSchema.safeParse(validRequest).success, true);
});

test("invalid pincode, non-consent and unexpected fields are rejected", () => {
  assert.equal(rfqSchema.safeParse({ ...validRequest, privacyAccepted: false }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, privacyAccepted: undefined }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, pincode: "123" }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, dealerQuote: 100 }).success, false);
});

test("RFQ category and quantity unit must be supported together", () => {
  assert.equal(rfqSchema.safeParse({ ...validRequest, categorySlug: "not-a-category" }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, categorySlug: "cement", unit: "truck" }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, categorySlug: "cement", unit: "bag" }).success, true);
});

test("all nine customer material categories accept their own units and reject wrong ones",()=>{
 for(const [category,units] of Object.entries(categoryUnitOptions)){
  assert.ok(units.length>0,category);
  for(const unit of units){
   const parsed=rfqSchema.safeParse({...validRequest,categorySlug:category,unit});
   assert.equal(parsed.success,true,category+" "+unit);
   assert.equal(isAllowedCategoryUnit(category,unit),true);
   assert.ok(quantityUnitLabels[unit]);
  }
  assert.equal(defaultCategoryUnit(category),units[0]);
  const wrong=Object.keys(quantityUnitLabels).find(u=>!units.some(v=>v===u));
  assert.ok(wrong);
  assert.equal(rfqSchema.safeParse({...validRequest,categorySlug:category,unit:wrong}).success,false,category+" wrong unit "+wrong);
 }
});
test("paint litres, tiles square feet and electrical metres pass; cement trucks fail",()=>{
 for(const [category,unit] of [["paint","litre"],["tiles","square_foot"],["electrical","metre"],["plumbing","length"],["hardware","box"]] as const){
  assert.equal(rfqSchema.safeParse({...validRequest,categorySlug:category,unit}).success,true);
 }
 assert.equal(rfqSchema.safeParse({...validRequest,categorySlug:"cement",unit:"truck"}).success,false);
});
