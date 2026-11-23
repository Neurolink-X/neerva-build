// Geometry uses integer millimetres. The drawing frame always has the street at the bottom.
export type Side = "N" | "E" | "S" | "W";
export type Brief = {
  width: number;
  depth: number;
  road: Side;
  facing: Side;
  floors: number;
  beds: number;
  parking: boolean;
  variant?: number;
};
export type Rules = {
  front: number;
  rear: number;
  side: number;
  bags: number;
  steel: number;
};
export const conceptRules: Rules = {
  front: 1000,
  rear: 500,
  side: 500,
  bags: 4.4,
  steel: 40,
};
export const specs = {
  Living: [9500000, 2400],
  Bedroom: [9500000, 2400],
  Kitchen: [5000000, 1800],
  "Bath/WC": [2800000, 1200],
  Utility: [1500000, 1000],
  Puja: [1400000, 1000],
  Courtyard: [7500000, 2500],
  Balcony: [2400000, 1200],
  Stairs: [6800000, 2000],
} as const;
export type Kind = keyof typeof specs;
export type Room = {
  name: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  lane: number;
  streetWall?: boolean;
};
export type Plate = {
  rooms: Room[];
  hallX: number;
  hallY: number;
  hallH: number;
};
const wall = 150,
  passage = 1000;
export function generate(b: Brief, rules: Rules = conceptRules) {
  if (
    ![b.width, b.depth, b.beds, b.floors].every(Number.isSafeInteger) ||
    b.beds < 1 ||
    b.beds > 6 ||
    b.floors < 1 ||
    b.floors > 3 ||
    Math.max(b.width, b.depth) > 60000
  )
    return null;
  const sideRoad = b.road === "E" || b.road === "W";
  const width = sideRoad ? b.depth : b.width,
    depth = sideRoad ? ¶»§q«^