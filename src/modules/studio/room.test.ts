import test from "node:test";
import assert from "node:assert/strict";
import { generate } from "./layout.ts";
import { baseline, paintAreas, roomModel } from "./room.ts";
test("every room elevation and paint quantity uses the plan's clear dimensions and openings", () => {
  const p = generate({
    width: 18000,
    depth: 18000,
    beds: 3,
    floors: 2,
    road: "W",
    facing: "N",
    parking: true,
  })!;
  for (const plate of p.plates)
    for (const r of plate.rooms) {
      const m = roomModel(r);
      assert.equal(m.width, r.w);
      assert.equal(m.depth, r.h);
      for (const o of m.openings) {
        assert.ok(o.offset + o.width <= m.lengths[o.wall]);
        assert.ok(o.sill + o.height <= m.height);
      }
      const gross = (2 * (r.w + r.h) * m.height) / 1e6;
      assert.ok(
        Math.abs(
          m.netWalls -
            (gross -
              m.openings.reduce(
                (sum, o) => sum + (o.width * o.height) / 1e6,
                0,
              )),
        ) < 1e-8,
      );
      const area = Object.values(paintAreas(r, baseline)).reduce(
        (a, v) => a + v,
        0,
      );
      assert.ok(
        Math.abs(
          area -
            (m.netWalls +
              (["Courtyard", "Balcony"].includes(r.name) ? 0 : m.ceiling)),
        ) < 1e-8,
      );
    }
});
