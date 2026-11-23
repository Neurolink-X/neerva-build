import test from "node:test";
import assert from "node:assert/strict";
import {
  generate,
  specs,
  conceptRules,
  alternatives,
  type Side,
} from "./layout.ts";
test("all successful footprints respect clear size, containment, count and separation", () => {
  let feasible = 0;
  for (const road of ["N", "E", "S", "W"] as Side[])
    for (const width of [4500, 6096, 9144, 12000])
      for (const beds of [1, 2, 4])
        for (const floors of [1, 2, 3]) {
          const brief = {
            width,
            depth: 15240,
            road,
            facing: road,
            beds,
            floors,
            parking: true,
          };
          const plan = generate(brief);
          if (!plan) continue;
          feasible++;
          assert.equal(
            plan.plates
              .flatMap((p) => p.rooms)
              .filter((r) => r.name === "Bedroom").length,
            beds,
          );
          for (const plate of plan.plates)
            for (const r of plate.rooms) {
              assert.ok(
                r.w * r.h >= specs[r.name][0] &&
                  Math.min(r.w, r.h) >= specs[r.name][1],
              );
              assert.ok(
                r.x >= plan.side &&
                  r.x + r.w <= plan.width - plan.side &&
                  r.y >= plan.rear &&
                  r.y + r.h <= plan.depth - plan.front,
              );
              for (const s of plate.rooms)
                assert.ok(
                  s === r ||
        ¶»§q«^