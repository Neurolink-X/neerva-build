import assert from "node:assert/strict";
import test from "node:test";
import { convertSquareFeet, squareFeetFromDimensions } from "./units.ts";

test("one square gaj is nine square feet", () => {
  assert.equal(convertSquareFeet(9).squareGaj, 1);
});

test("20 by 40 feet is 800 square feet and is not treated as linear gaj", () => {
  const area = convertSquareFeet(squareFeetFromDimensions(20, 40, "ft"));
  assert.equal(area.squareFeet, 800);
  assert.equal(area.squareGaj, 800 / 9);
});

test("plot dimensions reject zero and negative values", () => {
  assert.throws(() => squareFeetFromDimensions(0, 20, "ft"), RangeError);
  assert.throws(() => squareFeetFromDimensions(20, -1, "ft"), RangeError);
});
