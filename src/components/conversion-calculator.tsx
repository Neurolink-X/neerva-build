"use client";

import { useMemo, useState } from "react";
import { convertSquareFeet, squareFeetFromDimensions } from "@/modules/calculator/units";

export function ConversionCalculator() {
  const [length, setLength] = useState("20"); const [width, setWidth] = useState("40"); const [unit, setUnit] = useState<"ft" | "m">("ft");
  const result = useMemo(() => { try { return convertSquareFeet(squareFeetFromDimensions(Number(length), Number(width), unit)); } catch { return null; } }, [length, width, unit]);
  return <div className="calculator-card calculator-page-card"><div className="calculator-card-head"><div><span className="calculator-icon">â–¦</span><div><strong>Plot area converter</strong><small>Area, not linear gaj</small></div></div><span className="calculator-tag">ESTIMATE</span></div><div className="input-row"><label>Length<input inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} /></label><label>Width<input inputMode="decimal" value={width} onChange={(event) => setWidth(event.target.value)} /></label><label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value as "ft" | "m")}><option value="ft">Feet</option><option value="m">Metres</option></select></label></div>{result ? <div className="area-results"><div><strong>{result.squareFeet.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong><span>sq ft</span></div><div><strong>{result.squareGaj.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong><sp¶»§q«^