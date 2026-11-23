"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  alternatives,
  generate,
  type Brief,
  type Side,
  type Rules,
} from "@/modules/studio/layout";
import { PlanPreview } from "./plan-preview";
import { palette, type Shade } from "@/modules/studio/room";
import { readDesign, type Design } from "@/modules/studio/share";
import { useMaterialBasket } from "./material-basket";

export function HomeStudio({
  rules: cityRules,
  configured,
  shades = palette,
}: {
  rules: Rules;
  configured: boolean;
  shades?: Shade[];
}) {
  const [saved, setSaved] = useState<Design | null>(null);
  const rules = saved?.rules ?? cityRules;
  const [hi, setHi] = useState(false),
    t = (en: string, hindi: string) => (hi ? hindi : en);
  const [unit, setUnit] = useState("ft"),
    [width, setWidth] = useState("30"),
    [depth, setDepth] = useState("50");
  const [settings, setSettings] = useState({
    road: "S" as Side,
    facing: "S" as Side,
    beds: 2,
    floors: 1,
    parking: true,
    variant: 0,
  });
  useEffect(() => {
    if (new URLSearchParams(location.search).get("lang") === "hi")
      queueMicrotask(() => setHi(true));
    function restore() {
      const d = readDesign(location.hash);
      if (!d) return;
      setSaved(d);
      setUnit("m");
      setWidth(String(d.brief.width / 1000));
      setDepth(String(d.brief.depth / 1000));
      setSettings({ ...d.brief, variant: ¶»§q«^