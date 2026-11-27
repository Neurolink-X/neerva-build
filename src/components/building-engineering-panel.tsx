"use client";
import {useMemo,useState} from "react";
import dynamic from "next/dynamic";
import type {BuildingConcept} from "@/modules/studio/building-purpose";
import {engineeringPreflight,jurisdictionSources,engineeringReferences,type Jurisdiction} from "@/modules/studio/building-engineering";
import {finishSpaces,type FinishScheme} from "@/modules/studio/finish-model";
import {commercialInteriorSnapshot} from "@/modules/studio/commercial-interior-render";
import {buildingRenderSnapshot} from "@/modules/studio/building-render";
import {roadRect,roadSegment,siteDimensions} from "@/modules/studio/plan-coordinate";
import {StudioProjectExchange} from "./studio-project-exchange";
import {CommercialEngineeringReservations} from "./commercial-engineering-reservations";
import {BuildingDemandWorksheet} from "./building-demand-worksheet";
import {BrowserArchitectureRender} from "./browser-architecture-render";
const CommercialRoomViewer=dynamic(()=>import("./commercial-room-viewer"),{ssr:false,loading:()=> <p role="status">Loading 3D preview…</p>});
const display=(n:number|null)=>n===null?"Not available":n.toLocaleString("en-IN",{maximumFractionDigits:1});
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]??c));
function download(name:string,content:string,mime:string){
 const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement("a");a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function floorSvg(plan:BuildingConcept,floor:number){
 const b=plan.brief,{w,d}=siteDimensions(b.widthFt,b.depthFt,b.roadSide),road=roadSegment(b.widthFt,b.depthFt,b.roadSide);
 const zones=plan.zones.filter(z=>z.floor===floor).map(z=>{
  const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide),size=Math.min(2,r.w/(z.label.length*.65),r.d*.18);
  return '<g><rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.d+'" fill="#e5e9e0" stroke="#374b40" stroke-width=".22"/><text x="'+(r.x+r.w/2)+'" y="'+(r.y+r.d/2)+'" font-size="'+size+'" text-anchor="middle">'+xml(z.label)+'</text><text x="'+(r.x+r.w/2)+'" y="'+(r.y+r.d/2+size*1.4)+'" text-anchor="middle" font-size="'+size+'">'+z.w.toFixed(1)+' × '+z.d.toFixed(1)+' ft</text></g>';
 }).join("");
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -16 '+(w+16)+' '+(d+32)+'"><rect x="-8" y="-16" width="'+(w+16)+'" height="'+(d+32)+'" fill="white"/><g font-family="Arial,sans-serif" fill="#273e32"><text x="'+w/2+'" y="-11" font-size="2.5" text-anchor="middle">NEERVA · CONCEPT ONLY · NOT FOR CONSTRUCTION</text><text x="'+w/2+'" y="-6" font-size="2" text-anchor="middle">Floor '+(floor+1)+' · road '+b.roadSide+' · north up</text><rect width="'+w+'" height="'+d+'" fill="#faf9f5" stroke="#273e32" stroke-width=".3"/><line x1="'+road.start.x+'" y1="'+road.start.y+'" x2="'+road.end.x+'" y2="'+road.end.y+'" stroke="#a56b45" stroke-width="1"/>'+zones+'<text x="'+w/2+'" y="'+(d+5)+'" font-size="2" text-anchor="middle">'+w+' × '+d+' ft · dimensions are concept zone extents</text><text x="'+w/2+'" y="'+(d+10)+'" font-size="2" text-anchor="middle">No structural, egress, MEP or municipal approval implied.</text></g></svg>';
}
export function BuildingEngineeringPanel({plan,floor,scheme}:{plan:BuildingConcept;floor:number;scheme:FinishScheme}){
 const review=useMemo(()=>engineeringPreflight(plan),[plan]),selected=review.floors.find(f=>f.floor===floor);
 const [showExterior3D,setShowExterior3D]=useState(false);
 const [city,setCity]=useState<Jurisdiction>("Other"),[evening,setEvening]=useState(false),[view,setView]=useState<"front"|"rear">("front"),[scenario,setScenario]=useState(false),[roomChoice,setRoomChoice]=useState(""),[showInteractive,setShowInteractive]=useState(false);
 const interiorRooms=finishSpaces({kind:"commercial",plan}).filter(r=>r.floor===floor&&r.w>=5&&r.d>=5),roomId=interiorRooms.some(r=>r.id===roomChoice)?roomChoice:interiorRooms[0]?.id;
 const authority=jurisdictionSources[city];
 return <section className="purpose-engineering" aria-label="Building engineering preflight">
  <h2>Explore your design</h2>
  {review.blockers.length>0?<p role="alert">{review.blockers.join("; ")}</p>:<>
   <details><summary>Advanced engineering review</summary><p><strong>Concept only.</strong> Metrics are not certified fire, evacuation, structural or services calculations.</p>
   <div className="purpose-metrics"><div><strong>{display(review.grossSqFt)} sq ft</strong><span>Gross concept zone area</span></div><div><strong>{display(review.conceptAreaRatio)}</strong><span>Area / plot ratio (not statutory FAR)</span></div><div><strong>{display(selected?.coreReserveSqFt??null)} sq ft</strong><span>Selected floor core reservation</span></div><div><strong>{display(selected?.spineWidthFt??null)} ft</strong><span>Selected floor access spine</span></div></div>
   <details><summary>Fire exit and evacuation sensitivity</summary><p>Illustrative centerline distances to core reserve centers. No actual doors, protected stairs or exit discharge have been designed. These numbers must not be compared with regulatory travel limits or used to plan evacuation.</p><label><input type="checkbox" checked={scenario} onChange={e=>setScenario(e.target.checked)}/> Assume nearest core unavailable for each zone (separate hypothetical cases)</label><p>Largest indicator: {display((scenario?selected?.worstSingleCoreFt:selected?.worstNormalFt)??null)} ft</p><div className="purpose-table"><table><thead><tr><th>Zone</th><th>Hypothetical distance (ft)</th></tr></thead><tbody>{selected?.routes.map(r=><tr key={r.zoneId}><td>{r.label}</td><td>{display(scenario?r.oneCoreUnavailableFt:r.nearestFt)}</td></tr>)}</tbody></table></div></details>
   <details><summary>Lift, structural and MEP review requirements</summary>{review.requirements.filter(r=>!["fire","evacuation","bylaws"].includes(r.id)).map(r=><article key={r.id}><h3>{r.title} — professional review required</h3><ul>{r.required.map(s=><li key={s}>{s}</li>)}</ul></article>)}<p>Selected floor toilet reserve: {display(selected?.toiletReserveSqFt??null)} sq ft. Reserved areas do not establish fixture or equipment capacity.</p></details>
   {selected&&<CommercialEngineeringReservations key={plan.id+":"+floor} plan={plan} floor={floor} areaSqFt={selected.coveredSqFt}/>}
   {selected&&<BuildingDemandWorksheet key={plan.id+":"+floor} areaSqFt={selected.coveredSqFt}/>}
   <details><summary>City-specific authority and accessibility references</summary><label>Project city <select value={city} onChange={e=>setCity(e.target.value as Jurisdiction)}>{Object.keys(jurisdictionSources).map(c=><option key={c}>{c}</option>)}</select></label><p>{authority.authority} · {authority.state??"Jurisdiction not verified"}</p>{authority.url&&<a href={authority.url} target="_blank" rel="noreferrer">Official authority website →</a>}<p>Current plot-specific clauses and amendments must be reviewed before any compliance calculation. No automated bylaw pass is issued.</p><ul>{engineeringReferences.map(r=><li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></li>)}</ul></details>
   <details><summary>Download concept drawings and review package</summary><p>Dimensioned zoning SVG for the selected floor, or the complete geometry and engineering review JSON. Neither is a signed construction drawing.</p><div className="purpose-tabs"><button type="button" onClick={()=>download("neerva-concept-floor-"+(floor+1)+".svg",floorSvg(plan,floor),"image/svg+xml")}>Download selected floor SVG</button><button type="button" onClick={()=>download("neerva-concept-review.json",JSON.stringify({notice:"CONCEPT ONLY — NOT FOR CONSTRUCTION",city,plan,review,authority,referenceSources:engineeringReferences},null,2),"application/json")}>Download full review JSON</button></div></details>
   </details>
   <details id="building-exterior"><summary>Exterior image preview</summary><p>Create an image of your selected concept, including proposed openings and finishes. Engineering approval is required.</p><div className="purpose-tabs"><label>View <select value={view} onChange={e=>setView(e.target.value as typeof view)}><option value="front">Road side</option><option value="rear">Rear side</option></select></label><label><input type="checkbox" checked={evening} onChange={e=>setEvening(e.target.checked)}/> Evening light</label></div><div className="purpose-tabs"><button type="button" aria-pressed={showExterior3D} onClick={()=>setShowExterior3D(v=>!v)}>{showExterior3D?"Close interactive exterior":"Explore interactive exterior"}</button></div>{showExterior3D&&<CommercialRoomViewer exterior key={plan.id+":"+view} snapshot={buildingRenderSnapshot(plan,"limestone",evening,view,scheme)}/>}<BrowserArchitectureRender key={JSON.stringify([plan.id,scheme.exterior,scheme.accent,scheme.glass,scheme.cladding,evening,view])} capture={()=>buildingRenderSnapshot(plan,"limestone",evening,view,scheme)}/></details>
   {roomId&&<details id="building-interior"><summary>Interior preview</summary><label>Room <select value={roomId} onChange={e=>setRoomChoice(e.target.value)}>{interiorRooms.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label><div className="purpose-tabs"><button type="button" aria-pressed={showInteractive} onClick={()=>setShowInteractive(v=>!v)}>{showInteractive?"Close interactive 3D":"Explore interactive 3D"}</button></div>{showInteractive&&<CommercialRoomViewer key={plan.id+":"+roomId} snapshot={commercialInteriorSnapshot(plan,scheme,roomId,evening)}/>}<BrowserArchitectureRender key={JSON.stringify([plan.id,roomId,scheme.rooms[roomId],scheme.glass,evening])} capture={()=>commercialInteriorSnapshot(plan,scheme,roomId,evening)}/></details>}
   <StudioProjectExchange key={plan.id} source={{kind:"commercial",plan}} scheme={scheme}/>
  </>}
 </section>;
}
