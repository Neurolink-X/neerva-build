import { z } from "zod";
import { walls } from "./room.ts";
const side = z.enum(["N", "E", "S", "W"]),
  size = z.number().int().min(1).max(60000),
  id = z.string().regex(/^[a-z0-9-]{1,40}$/);
const finish = z.object({
  wall: id,
  accent: id,
  ceiling: id,
  accentWall: z.enum(walls),
  floor: z.enum(["tile", "wood", "marble"]),
});
const design = z.object({
  version: z.literal(1),
  brief: z.object({
    width: size,
    depth: size,
    road: side,
    facing: side,
    floors: z.number().int().min(1).max(3),
    beds: z.number().int().min(1).max(6),
    parking: z.boolean(),
    variant: z.number().int().min(0).max(1).optional(),
  }),
  rules: z.object({
    front: z.number().int().min(0).max(20000),
    rear: z.number().int().min(0).max(20000),
    side: z.number().int().min(0).max(20000),
    bags: z.number().positive().max(25),
    steel: z.number().positive().max(250),
  }),
  finishes: z.record(z.string().regex(/^\d-\d{1,2}$/), finish),
  exterior: z.object({ main: id, band: id, boundary: id, gate: id, trim: id }),
  coats: z.number().int().min(1).max(5),
  coverage: z.number().min(1).max(30),
});
export type Design = z.infer<typeof design>;
export function readDesign(hash: string): Design | null {
  if (!hash.startsWith("#design=") || hash.length > 32000) return null;
  try {
    return design.parse(JSON.parse(decodeURIComponent(hash.slice(8))));
  } catch {
    return null;
  }
}
