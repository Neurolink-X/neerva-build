"use client";
import {useMemo} from "react";
import {interiorFitReport} from "@/modules/studio/furniture";
import type {PlanModel} from "@/modules/studio/plan-model";
export function InteriorFitPanel({plan,floor}:{plan:PlanModel;floor:number}){
 const report=useMemo(()=>interiorFitReport(plan),[plan]),rows=report.rows.filter(r=>r.floor===floor);
 return <details className="nroad-small"><summary><strong>Interior space planning</strong> · {rows.filter(r=>r.ready).length}/{rows.length} essential furniture layouts fit on selected floor</summary>
 <p>Same room geometry, doors and ventilation openings as the 2D/3D model. Compact furniture is used only where a standard footprint does not fit.</p>
 <ul>{rows.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.pieces.length?r.pieces.map(p=>p.kind+" "+p.w.toFixed(1)+" × "+p.d.toFixed(1)+" ft").join("; "):"No checked furniture placement"}. {!r.ready&&"Essential "+r.required+" placement requires a room-layout review."}</li>)}</ul>
 <p>Furniture footprints and opening buffers are indicative; finished clearances, circulation, accessibility and final furniture sizes require on-site review.</p></details>;
}
