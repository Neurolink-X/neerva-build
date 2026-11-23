import type { Room } from "./layout.ts";
export const walls = ["rear", "right", "front", "left"] as const;
export type Wall = (typeof walls)[number];
export type Opening = {
  wall: Wall;
  offset: number;
  width: number;
  sill: number;
  height: number;
  kind: "door" | "window";
};
export function roomModel(r: Room) {
  const height = 2800;
  const openings: Opening[] = [
    {
      kind: "door",
      wall: r.lane ? "left" : "right",
      offset: 120,
      width: 850,
      height: 2100,
      sill: 0,
    },
    {
      kind: "window",
      wall: r.lane ? "right" : "left",
      offset: Math.floor(r.h * 0.4),
      width: Math.min(900, Math.floor(r.h * 0.35)),
      height: 1100,
      sill: 900,
    },
  ];
  if (r.streetWall)
    openings.push({
      kind: "window",
      wall: "front",
      offset: Math.floor(r.w * 0.3),
      width: Math.min(1200, Math.floor(r.w * 0.4)),
      height: 1100,
      sill: 900,
    });
  const lengths = { rear: r.w, right: r.h, front: r.w, left: r.h };
  const wallAreas = Object.fromEntries(
    walls.map((w) => [
      w,
      (lengths[w] * height -
        openings
          .filter((o) => o.wall === w)
          .reduce((a, o) => a + o.width * o.height, 0)) /
        1e6,
    ]),
  ) as Record<Wall, number>;
  return {
    width: r.w,
    depth: r.h,
    height,
    lengths,
    openings,
    wallAreas,
    netWalls: Object.values(wallAreas).reduce((a, v) => a + v, 0),
    ceiling: (r.w * r.h) / 1e6,
  };
}
export type Shade =¶»§q«^