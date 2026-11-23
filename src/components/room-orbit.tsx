"use client";
import { useEffect, useRef, useState } from "react";
import { RoomCutaway } from "./room-cutaway";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  baseline,
  roomModel,
  walls,
  type Finish,
  type Shade,
} from "@/modules/studio/room";
import type { Room } from "@/modules/studio/layout";
type Props = { room: Room; finish: Finish; shades: Shade[]; split: number };
export default function RoomOrbit(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    update = useRef<((p: Props) => void) | null>(null);
  const [fallback, setFallback] = useState(false);
  const { room } = props;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
    if (!gl) {
      const timer = setTimeout(() => setFallback(true), 0);
      return () => clearTimeout(timer);
    }
    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      antialias: true,
    });
    el.append(canvas);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e4e9e3");
    const model = roomModel(room),
      W = model.width / 1000,
      D = model.depth / 1000,
      H = model.height / 1000;
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
    camera.position.set¶»§q«^