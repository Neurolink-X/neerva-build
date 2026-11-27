"use client";
import {useState} from "react";
import Link from "next/link";
import type {ProjectSource} from "@/modules/studio/project-exchange";
import {reviewedQuoteHref} from "@/modules/studio/project-exchange";
import {applyRoomFinish,defaultFinishScheme,finishSpaces,finishEstimate,finishPresets,type FinishScheme,type RoomFinish} from "@/modules/studio/finish-model";
export function PlanFinishStudio({source,floor,scheme,onChange,showExterior=true}:{source:ProjectSource;floor:number;scheme:FinishScheme;onChange:(s:FinishScheme)=>void;showExterior?:boolean}){
 const [scope,setScope]=useState("floor"),[surface,setSurface]=useState<keyof RoomFinish>("wall"),[coverage,setCoverage]=useState(""),[coats,setCoats]=useState(2),[reviewed,setReviewed]=useState(false);
 const rooms=finishSpaces(source),current=rooms.filter(r=>r.floor===floor);
 const chosen=scope==="all"?rooms:scope==="floor"?current:current.filter(r=>r.id===scope);
 const targets=chosen.length?chosen:current,ids=targets.map(r=>r.id);
 const value=scheme.rooms[ids[0]]?.[surface]??"#eeeeee";
 const purpose=source.kind==="residential"?"home":source.plan.brief.purpose;
 const preset=finishPresets[purpose];
 const estimate=finishEstimate(source,ids,Number(coverage),coats);
 const quantity=estimate?Math.ceil(estimate.paintLitres):0;
 const quote=reviewed&&quantity>0?reviewedQuoteHref("paint","litre",quantity,"Interior wall paint — selected concept rooms; verify shade and coverage"):null;
 return <section className="studio-project-exchange plan-finish-studio" aria-label="Plan color studio"><h2>Color & finishes</h2><p>Customize your selected design.</p>
 {showExterior&&<details open><summary>Exterior</summary><div className="purpose-tabs">{(["exterior","accent","glass"] as const).map(k=><label key={k}>{k==="exterior"?"Main wall":k==="accent"?"Accent":"Glass tint"}<input aria-label={k+" color"} type="color" value={scheme[k]} onChange={e=>onChange({...scheme,[k]:e.target.value})}/></label>)}</div></details>}
 <details><summary>Interior colors</summary><div className="purpose-tabs"><label>Apply to <select value={scope==="all"||scope==="floor"||current.some(r=>r.id===scope)?scope:"floor"} onChange={e=>{setScope(e.target.value);setReviewed(false)}}><option value="floor">Current floor</option><option value="all">All floors</option>{current.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label><label>Surface <select value={surface} onChange={e=>setSurface(e.target.value as keyof RoomFinish)}><option value="wall">Wall</option><option value="floor">Floor</option><option value="ceiling">Ceiling</option></select></label><label>Shade <input type="color" value={value} onChange={e=>{onChange(applyRoomFinish(source,scheme,ids,surface,e.target.value));setReviewed(false)}}/></label></div>
 <div className="finish-swatches">{[preset[surface],"#f5f1e8","#b9c7b1","#c1d3dd","#e1bb94","#9b8f87"].filter((s,i,a)=>a.indexOf(s)===i).map(s=><button key={s} type="button" title={s} aria-label={"Apply shade "+s} aria-pressed={value===s} style={{background:s}} onClick={()=>{onChange(applyRoomFinish(source,scheme,ids,surface,s));setReviewed(false)}}/>)}</div>
 <p className="nroad-small">Selected room colors are shown in the finish preview. Digital shades vary by lighting and device.</p>
 <div className="finish-room-preview">{targets.slice(0,24).map(r=>{const f=scheme.rooms[r.id];if(!f)return null;return <div key={r.id}><svg viewBox="0 0 120 78" role="img" aria-label={r.label+" finish concept"}><path d="M10 5H110L96 15H24Z" fill={f.ceiling}/><path d="M10 5L24 15V57L10 72Z" fill={f.wall}/><rect x="24" y="15" width="72" height="42" fill={f.wall}/><path d="M96 15L110 5V72L96 57Z" fill={f.wall}/><path d="M10 72L24 57H96L110 72Z" fill={f.floor}/><path d="M10 5H110V72H10Z M24 15H96V57H24Z" fill="none" stroke="#716f66" strokeWidth=".6"/></svg><small>{r.label}</small></div>})}</div>{targets.length>24&&<small>Showing first 24 spaces. Changes apply to all selected spaces.</small>}
 </details>
 <details><summary>Estimate paint & flooring</summary><p>Selected rooms: {ids.length}. Enter the product coverage from its technical sheet.</p><div className="purpose-tabs"><label>Coverage (m²/L per coat)<input type="number" min=".1" max="100" step=".1" value={coverage} onChange={e=>{setCoverage(e.target.value);setReviewed(false)}}/></label><label>Coats<select value={coats} onChange={e=>{setCoats(Number(e.target.value));setReviewed(false)}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label></div>
 {estimate&&ids.length>0&&<><p>Wall: {Math.round(estimate.wallSqFt)} sq ft · Floor: {Math.round(estimate.floorSqFt)} sq ft · Ceiling: {Math.round(estimate.ceilingSqFt)} sq ft · Paint: ~{quantity} L</p><small>{estimate.openingsDeducted?"Modeled openings deducted.":"Gross wall estimate; openings not deducted."} Excludes wastage and surface preparation.</small><label><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> I reviewed coverage and quantity.</label>{quote&&<Link className="button button-outline" href={quote}>Request paint quote →</Link>}</>}
 <p><Link href="/materials/paint">Browse paints</Link> · <Link href="/materials">Browse flooring and finishes</Link></p></details>
 <button type="button" className="button button-outline" onClick={()=>{const defaults=defaultFinishScheme(source);onChange(showExterior?defaults:{...defaults,exterior:scheme.exterior,accent:scheme.accent,glass:scheme.glass});setReviewed(false)}}>Reset colors</button></section>
}
