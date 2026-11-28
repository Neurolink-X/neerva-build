"use client";
import {useMemo} from "react";
import {commercialInternalSpaces} from "@/modules/studio/commercial-internal";
import {commercialPortals} from "@/modules/studio/commercial-detail";
import type {BuildingConcept} from "@/modules/studio/building-purpose";
export function CommercialVentilationPanel({plan,floor}:{plan:BuildingConcept;floor:number}){
 const rows=useMemo(()=>{
  const internal=commercialInternalSpaces(plan),partitioned=new Set(internal.map(r=>r.parentId)),portals=commercialPortals(plan);
  const spaces=[...internal,...plan.zones.filter(z=>!partitioned.has(z.id))].filter(r=>!["parking","open","stairs","lift","shaft","lobby","circulation","core"].includes(r.kind));
  return spaces.filter(r=>r.floor===floor).map(r=>({id:r.id,label:r.label,kind:r.kind,glazing:portals.filter(p=>p.zoneId===r.id&&p.kind==="exterior-glazing")}));
 },[plan,floor]);
 return <details className="purpose-drawing-note"><summary>Ventilation &amp; daylight · {rows.filter(r=>r.glazing.length).length}/{rows.length} spaces with modeled glazing</summary><p className="purpose-caption">Blue glazing is a daylight opening candidate, not proof of an operable fresh-air window. Commercial occupancy, fire separation and HVAC need engineering review.</p><ul>{rows.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.glazing.length?r.glazing.map(p=>p.length.toFixed(1)+" ft glazing at ("+p.x.toFixed(1)+", "+p.y.toFixed(1)+")").join("; "):"No exterior glazing modeled"}. {["bath","toilet","kitchen","service-a","service-b","service","support"].includes(r.kind)?"Review dedicated exhaust, make-up air and safe discharge.":"Review operable opening or engineered outdoor-air supply."}</li>)}</ul></details>;
}
