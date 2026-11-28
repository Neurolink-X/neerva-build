"use client";
import {useMemo,useState} from "react";
import {ventilationReport} from "@/modules/studio/ventilation";
import {isOtsRoom,type PlanModel} from "@/modules/studio/plan-model";
export function VentilationPanel({plan,floor,enhanced,ots,onOts,onEnhance,onBest,onFindShaft,searching,addedWindows}:{plan:PlanModel;floor:number;enhanced:boolean;ots:boolean;onOts:(v:boolean)=>void;onEnhance:(v:boolean)=>void;onBest:()=>void;onFindShaft:()=>void;searching:boolean;addedWindows:number}){
 const report=useMemo(()=>ventilationReport(plan),[plan]),rows=report.rows.filter(r=>r.floor===floor),shaft=plan.rooms.find(r=>r.floor===floor&&isOtsRoom(r));
 const [open,setOpen]=useState(true);
 const attached=plan.setbacks.leftFt<3&&plan.setbacks.rightFt<3;
 const front=rows.some(r=>r.openings.some(o=>o.exposure==="road"));
 const rear=rows.some(r=>r.openings.some(o=>o.side==="rear"&&o.exposure==="open-strip"));
 const wetShaft=rows.some(r=>["bath","utility","kitchen"].includes(r.kind)&&r.openings.some(o=>o.exposure==="ots"));
 const hasShaft=rows.some(r=>r.openings.some(o=>o.exposure==="ots"));
 const grade=front&&rear&&hasShaft?"Good potential":front&&wetShaft?"Usable potential":rows.some(r=>r.exposed)?"Needs review":"Weak exposure";

 return <details className="nroad-small" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary><strong>Ventilation &amp; daylight</strong> · {report.exposed}/{report.total} rooms with screened exposure</summary>
 {attached&&<p><strong>Attached-house review:</strong> do not count neighbour-side windows as fresh air. Prefer a continuous roof-jaal court, road-facing openings and a professionally designed outdoor exhaust route. A skylight alone is not ventilation.</p>}
 <p>Green openings in the ventilation drawing have a modeled road or open-space exposure. Amber windows need site review. Opposite openings indicate potential cross-ventilation, not measured air changes.</p>
 <div className="nroad-air-controls nroad-air-result"><label className="nroad-air-choice"><input type="checkbox" checked={enhanced} onChange={e=>onEnhance(e.target.checked)}/><span>Additional screened windows</span></label><label className="nroad-air-choice"><input type="checkbox" checked={ots} onChange={e=>onOts(e.target.checked)}/><span>Open-to-sky ventilation / roof jaal</span></label><button type="button" className="nroad-recovery-action" disabled={searching} onClick={onBest}>Choose better-exposed layout</button>{ots&&!shaft&&<button type="button" className="nroad-recovery-action" disabled={searching} onClick={onFindShaft}>Find feasible roof-jaal layout</button>}</div>
 {searching&&<p role="status">Checking feasible layout alternatives…</p>}
 {ots&&<p role="status">{shaft?`Modeled OTS reserve: ${shaft.w.toFixed(1)} × ${shaft.d.toFixed(1)} ft, continuous to roof; grille is conceptual.`:"No aligned shaft fits this layout without losing essential room space or access. This is NOT a verified ventilated layout. Find a feasible alternative or revise the brief."}</p>}
 {enhanced&&<p role="status">{addedWindows?`${addedWindows} additional screened windows applied to the same 2D/3D plan.`:"No further screened opening fits the selected geometry."}</p>}
 <p><strong>Selected floor screening: {grade}</strong> · {front?"Road exposure":"No road-facing opening"} · {rear?"Rear open strip":"No screened rear strip"} · {wetShaft?"Wet core connected to shaft":"Wet-core shaft not established"}</p>
 <p><strong>Selected floor</strong> · {rows.filter(r=>r.exposed).length}/{rows.length} rooms with screened exposure · {rows.filter(r=>r.cross).length} with opposite-wall potential</p>
 <ul>{rows.map(r=><li key={r.id}><strong>{r.label}</strong> · {r.cross?"Opposite exposed openings":r.exposed?"Screened opening":"Weak / unverified exposure"} — {r.openings.length?r.openings.map(o=>o.compass+" "+o.width.toFixed(1)+" × "+o.height.toFixed(1)+" ft ("+(o.exposure==="review"?"review":o.exposure==="road"?"road-facing":o.exposure==="ots"?"open-to-sky shaft":"open strip")+")").join("; "):"No modeled window"}.
 {r.proposed.length>0&&<> Additional possible window wall: {r.proposed.map(o=>o.compass+" "+o.width+" ft").join(", ")}.</>} {r.recommendation}</li>)}</ul>
 <p>For every plot, shaft size, grille load and fall protection, fire separation, rain drainage, exhaust and legal ventilation require professional review. Modeled exposure is not measured airflow.</p>
 </details>;
}
