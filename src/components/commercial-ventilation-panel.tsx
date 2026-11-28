"use client";
import {useMemo,useState} from "react";
import {commercialPortals} from "@/modules/studio/commercial-detail";
import {commercialAirReport} from "@/modules/studio/commercial-ventilation";
import type {BuildingConcept} from "@/modules/studio/building-purpose";
export function CommercialVentilationPanel({plan,floor}:{plan:BuildingConcept;floor:number}){
 const rows=useMemo(()=>commercialAirReport(plan,commercialPortals(plan),floor),[plan,floor]);
 const [open,setOpen]=useState(true);
 return <details className="purpose-drawing-note" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>Ventilation &amp; daylight · {rows.filter(r=>r.exposed>0).length}/{rows.length} spaces with screened exposure</summary><p className="purpose-caption">Green openings have modeled exterior exposure; amber openings require clearance review. Glazing does not establish operability, legal ventilation or HVAC capacity.</p><ul>{rows.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.glazing.length?r.glazing.map(p=>p.length.toFixed(1)+" ft · "+p.exposure).join("; "):"No exterior glazing modeled"}. {r.cross?"Opposite-wall exposure potential. ":""}{["bath","toilet","kitchen","service-a","service-b","service","support"].includes(r.kind)?"Engineer dedicated exhaust, make-up air and safe discharge.":"Verify operable opening or engineered outdoor-air supply."}</li>)}</ul><p className="purpose-caption">A shaft, fire separation and mechanical air system require separate professional design. No automatic airflow or fire compliance claim.</p></details>;
}
