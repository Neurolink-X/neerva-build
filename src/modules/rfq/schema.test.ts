import assert from "node:assert/strict";
import test from "node:test";
import { rfqSchema } from "./schema.ts";

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
  turnstileToken: "opaque-challenge-token",
};

test("valid quote request has a bounded, typed shape", () => {
  assert.equal(rfqSchema.safeParse(validRequest).success, true);
});

test("invalid pincode and unexpected fields are rejected", () => {
  assert.equal(rfqSchema.safeParse({ ...validRequest, pincode: "123" }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, dealerQuote: 100 }).success, false);
});

test("RFQ category and quantity unit must be supported together", () => {
  assert.equal(rfqSchema.safeParse({ ...validRequest, categorySlug: "not-a-category" }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, categorySlug: "cement", unit: "truck" }).success, false);
  assert.equal(rfqSchema.safeParse({ ...validRequest, categorySlug: "cement", unit: "bag" }).success, true);
});
