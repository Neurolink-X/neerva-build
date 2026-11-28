"use client";
import {useMemo} from "react";
import {ventilationReport} from "@/modules/studio/ventilation";
import type {PlanModel} from "@/modules/studio/plan-model";
export function VentilationPanel({plan,floor,enhanced,onEnhance,onBest,changed}:{plan:PlanModel;floor:number;enhanced:boolean;onEnhance:(v:boolean)=>void;onBest:()=>void;changed:boolean}){
 const report=useMemo(()=>ventilationReport(plan),[plan]),rows=report.rows.filter(r=>r.floor===floor);
 return <details className="nroad-small"><summary><strong>Ventilation &amp; daylight</strong> · {report.exposed}/{report.total} rooms with screened exposure</summary>
 <p>Green openings in the ventilation drawing have a modeled road or open-space exposure. Amber windows need site review. Opposite openings indicate potential cross-ventilation, not measured air changes.</p>
 <div className="nroad-layout-filters"><label className="nroad-representative-toggle"><input type="checkbox" checked={enhanced} onChange={e=>onEnhance(e.target.checked)}/> Add feasible ventilation windows to this concept</label><button type="button" className="nroad-recovery-action" onClick={onBest}>Choose better-exposed layout</button></div>
 {enhanced&&<p role="status">{changed?"Additional modeled windows applied to the same 2D/3D plan.":"No further screened opening fits the selected geometry."}</p>}
 <p><strong>Selected floor</strong> · {rows.filter(r=>r.exposed).length}/{rows.length} rooms with screened exposure · {rows.filter(r=>r.cross).length} with opposite-wall potential</p>
 <ul>{rows.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.openings.length?r.openings.map(o=>o.compass+" "+o.width.toFixed(1)+" × "+o.height.toFixed(1)+" ft ("+(o.exposure==="review"?"review":o.exposure==="road"?"road-facing":"open strip")+")").join("; "):"No modeled window"}.
 {r.proposed.length>0&&<> Additional possible window wall: {r.proposed.map(o=>o.compass+" "+o.width+" ft").join(", ")}.</>} {r.recommendation}</li>)}</ul>
 <p>For tight plots, a shaft/courtyard or mechanical exhaust must be separately sized and modeled by a professional. No shaft, legal compliance or airflow is assumed merely from a recommendation.</p>
 </details>;
}
