import assert from "node:assert/strict";
import test from "node:test";
import { toPublicPrice } from "./public-price.ts";

test("quote-only records return no public amount fields", () => {
  const result = toPublicPrice({ visibility: "quote_only", amountPaise: 999999, currency: "INR", unit: "truck", updatedAt: "2026-11-22T00:00:00.000Z" });
  assert.equal(result, null);
});

test("public serializer allowlists a nonnegative integer paise price", () => {
  assert.deepEqual(toPublicPrice({ visibility: "public", amountPaise: 125050, currency: "INR", unit: "bag", updatedAt: "2026-11-22T00:00:00.000Z" }), {
    amountPaise: 125050, currency: "INR", unit: "bag", updatedAt: "2026-11-22T00:00:00.000Z",
  });
  assert.equal(toPublicPrice({ visibility: "public", amountPaise: -1, currency: "INR", unit: "bag", updatedAt: "2026-11-22T00:00:00.000Z" }), null);
});
