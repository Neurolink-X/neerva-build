"use client";
import { useId, useRef, useState } from "react";
import {
  baseline,
  roomModel,
  walls,
  type Finish,
  type Shade,
  type Wall,
} from "@/modules/studio/room";
import type { Room } from "@/modules/studio/layout";
// A cutaway projection for browsers that cannot create a WebGL context.
export function RoomCutaway({
  room,
  finish,
  shades,
  split,
}: {
  room: Room;
  finish: Finish;
  shades: Shade[];
  split: number;
}) {
  const [angle, setAngle] = useState(0.65),
    previous = useRef<number | null>(null),
    clip = useId();
  const model = roomModel(room),
    w = model.width,
    d = model.depth,
    h = model.height;
  const scale = Math.min(
      480 / (Math.hypot(w, d) + 50),
      270 / (h + Math.hypot(w, d) * 0.38),
    ),
    c = Math.cos(angle),
    s = Math.sin(angle);
  function point(x: number, y: number, z: number) {
    x -= w / 2;
    y -= d / 2;
    return [
      250 + scale * (x * c - y * s),
      158 + scale * ((x * s + y * c) * 0.38 - z + h / 2),
    ].join(",");
  }
  function panel(
    wall: Wall,
    start: number,
    end: number,
    bottom: number,
    top: number,
  ) {
    const position = (a: number, z: number) =>
      wall === "rear"
        ? point(a, 0, z)
        : wall === "front"
          ? point(a, d, z)
          : wall === "left"
            ? point(0, a, z)
            : point(w, a, z);
    return [
      position(start, bottom),
      position(end, bottom),
      position(end, top),
      position(start,¶»§q«^