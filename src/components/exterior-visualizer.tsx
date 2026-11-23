"use client";

import {PhotoPaint} from "./photo-paint";
import { useState } from "react";

type FinishKey = "main" | "accent" | "cladding" | "frames" | "glass" | "railing" | "gate";
type Finishes = Record<FinishKey, string>;
const defaults: Finishes = { main: "#e9e5dc", accent: "#d3c7b4", cladding: "#7a5b46", frames: "#303b37", glass: "#7eaaa9", railing: "#303b37", gate: "#3c4940" };
const surfaces: { key: FinishKey; label: string; detail: string }[] = [
  { key: "main", label: "Main wall", detail: "Base facade paint" }, { key: "accent", label: "Accent wall", detail: "Feature wall / parapet" }, { key: "cladding", label: "Cladding", detail: "Wood, stone or fluted finish" }, { key: "frames", label: "Window frames", detail: "Frame colour" }, { key: "glass", label: "Glass", detail: "Approximate tint" }, { key: "railing", label: "Balcony railing", detail: "Metal profile / finish" }, { key: "gate", label: "Gate", detail: "Front gate finish" },
];
const palettes = ["#f3eee4", "#e8dfd0", "#d4d6cd", "#aab4a4", "#7f9180", "#36483d", "#d9b49b", "#b97050", "#795c49", "#243941", "#fafafa", "#282c2b"];
const elevations = [
  { id: "modern", title: "Warm modern", set: { ...defaults } },
  { id: "sandstone", title: "Sandstone calm", set: { ...defaults, main: "#eee6d9", accent: "#c6916c", cladding: "#88684f", glass: "#8ea9aa", railing: "#74695e", gate: "#55534d" } },
  { id: "urban", title: "Urban slate", set: { ...defaults, main: "#d9ddda", accent: "#596b69", cladding: "#8c7662", frames: "#¶»§q«^