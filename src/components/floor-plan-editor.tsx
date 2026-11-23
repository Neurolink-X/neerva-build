"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type FloorRoom = { id: string; name: string; x: number; y: number; w: number; h: number; type: "room" | "open" | "parking" | "service" };
type Plot = { label: string; w: number; d: number };

const colours: Record<FloorRoom["type"], string> = { room: "#e9eadf", open: "#e2ebdc", parking: "#e1e9e7", service: "#dce8e6" };
function overlaps(a: FloorRoom, b: FloorRoom) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

export function FloorPlanEditor({ plot, title, summary, rooms: initialRooms, onSave }: { plot: Plot; title: string; summary: string; rooms: FloorRoom[]; onSave: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<FloorRoom[] | null>(null);
  const [rooms, setRooms] = useState(initialRooms);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<FloorRoom[][]>([]);
  const [future, setFuture] = useState<FloorRoom[][]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const selectedRoom = rooms.find((item) => item.id === selected);

  function point(event: ReactPointerEvent<SVGElement>) {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: ((ev¶»§q«^