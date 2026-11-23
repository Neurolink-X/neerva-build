import assert from "node:assert/strict";
import test from "node:test";
import { dealerApplicationSchema, dealerPhotoSchema } from "./onboarding.ts";

const valid = {
  legalBusinessName: "Kanpur Building Materials",
  gstin: "09AAACB1234C1Z5",
  shopCity: "Kanpur",
  servicePincodes: ["208001", "208002"],
  categoryIds: ["123e4567-e89b-42d3-a456-426614174000"],
};

test("accepts bounded dealer onboarding input and normalizes GSTIN", () => {
  const result = dealerApplicationSchema.parse({ ...valid, gstin: " 09aaacb1234c1z5 " });
  assert.equal(result.gstin, valid.gstin);
});

test("rejects invalid or duplicate pincodes and categories", () => {
  assert.equal(dealerApplicationSchema.safeParse({ ...valid, servicePincodes: ["208001", "208001"] }).success, false);
  assert.equal(dealerApplicationSchema.safeParse({ ...valid, servicePincodes: ["000000"] }).success, false);
  assert.equal(dealerApplicationSchema.safeParse({ ...valid, categoryIds: [valid.categoryIds[0], valid.categoryIds[0]] }).success, false);
});

test("rejects malformed GSTIN and unexpected privileged fields", () => {
  assert.equal(dealerApplicationSchema.safeParse({ ...valid, gstin: "XYZ" }).success, false);
  assert.equal(dealerApplicationSchema.safeParse({ ...valid, status: "approved" }).success, false);
  assert.equal(dealerApplicationSchema.safeParse({ ...valid, verified: true }).success, false);
});

test("requires small approved-mime shop photo metadata", () => {
  assert.equal(dealerPhotoSchema.safeParse({ applicationId: valid.categoryIds[0], mimeType: "image/webp", sizeBytes: 400000 }).success, true);
  assert.equal(dealerPhotoSchema.safeParse({ applicationId: valid.categoryIds[0], mimeType: "application/pdf", sizeBytes: 100 }).success, false);
  assert.equal(dealerPhotoSchema.safeParse({ applicationId: valid.categoryIds[0], mimeType: "image/png", sizeBytes: 8 * 1024 * 1024 }).success, false);
});
