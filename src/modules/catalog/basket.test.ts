import assert from "node:assert/strict";
import test from "node:test";
import { safeBasket } from "./basket.ts";

test("basket validation removes malformed values and preserves valid material lines", () => {
  const result = safeBasket([
    { key: "cement:ppc:50kg:bag", category: "cement", productSlug: "ppc", productName: "PPC cement", brand: "Example", option: "PPC 50 kg", unit: "bag", quantity: 12 },
    { key: "bad", quantity: -2 },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.quantity, 12);
});

test("basket is capped to 25 items and rejects unreasonable quantities", () => {
  const lines = Array.from({ length: 30 }, (_, index) => ({ key: String(index), category: "steel", productSlug: `tmt-${index}`, productName: "TMT steel", brand: "Example", option: "12 mm", unit: "kg", quantity: 4 }));
  assert.equal(safeBasket(lines).length, 25);
  assert.equal(safeBasket([{ ...lines[0], quantity: Number.POSITIVE_INFINITY }]).length, 0);
});
