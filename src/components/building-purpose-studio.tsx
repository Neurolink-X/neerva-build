"use client";
import {useMemo,useState,useSyncExternalStore,type FormEvent} from "react";
import Link from "@/components/intent-link";
import {preferLitePreview,type NetworkHint} from "@/modules/navigation/intent";
import {recommendBuildingConcepts} from "@/modules/studio/building-recommendations";
import {polygonArea} from "@/modules/studio/irregular-plot";
import {IrregularPlotPlanner} from "./irregular-plot-planner";
import {CommercialProjectSave} from "./commercial-project-save";
import {PlanFinishStudio} from "./plan-finish-studio";
import {defaultFinishScheme,rememberFinish,type FinishScheme} from "@/modules/studio/finish-model";
import {BuildingEngineeringPanel} from "./building-engineering-panel";
import {buildingPurposes,purposeDetails,generateBuildingConcepts,buildingInputRequirements,buildingStarter,validateBuildingBrief,buildingLayoutFamily,type BuildingLayoutFamily,type BuildingPurpose,type BuildingBrief,type BuildingConcept,type BuildingZone} from "@/modules/studio/building-purpose";
import {commercialElements} from "@/modules/studio/commercial-elements";
import {commercialFixtures,commercialPortals,commercialFrontPanels} from "@/modules/studio/commercial-detail";
import {rentalLayouts} from "@/modules/studio/rental-layout";
import {roadRect,roadPoint,siteDimensions,roadSegment} from "@/modules/studio/plan-coordinate";
const colors:Record<BuildingZone["kind"],string>={primary:"#aac5d3",support:"#d3c2a4",toilet:"#c8b9d9",circulation:"#e8e6d7",core:"#bdc5bb",service:"#d9bfaa",parking:"#b6bdc3",open:"#c5d7ac"};
const defaults=buildingStarter("shops");
const network=()=> (navigator as Navigator&{connection?:NetworkHint&EventTarget}).connection;
function subscribeNetwork(notify:()=>void){const connection=network();connection?.addEventListener?.("change",notify);window.addEventListener("online",notify);window.addEventListener("offline",notify);return()=>{connection?.removeEventListener?.("change",notify);window.removeEventListener("online",notify);window.removeEventListener("offline",notify)}}
const liteSnapshot=()=>preferLitePreview(network(),navigator.onLine);
const serverLiteSnapshot=()=>false;
// SVG title must have one text child: SSR text separators can break hydration.
function PlanDrawing({plan,floor,scheme,showFurniture}:{plan:BuildingConcept;floor:number;scheme:FinishScheme;showFurniture:boolean}){
 const b=plan.brief,{w,d}=siteDimensions(b.widthFt,b.depthFt,b.roadSide),road=roadSegment(b.widthFt,b.depthFt,b.roadSide);
 return <svg viewBox={[-8,-8,w+16,d+16].join(" ")} role="img" aria-label={"Purpose-specific zoning, floor "+(floor+1)} data-plan-id={plan.id} data-floor={floor}>
  <rect width={w} height={d} fill="#fbfaf5" stroke="#526655" strokeWidth=".5"/>
  <line x1={road.start.x} y1={road.start.y} x2={road.end.x} y2={road.end.y} stroke="#987456" strokeWidth="2"/>
  {plan.zones.filter(z=>z.floor===floor).map(z=>{const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide);return <g key={z.id}><title>{`${z.label}: ${z.w.toFixed(1)} × ${z.d.toFixed(1)} ft`}</title><rect x={r.x} y={r.y} width={r.w} height={r.d} fill={colors[z.kind]} stroke="#54665a" strokeWidth=".25"/><text x={r.x+r.w/2} y={r.y+r.d/2} textAnchor="middle" fontSize={Math.min(2.3,r.w/(z.label.length*.65),r.d*.21)} paintOrder="stroke" stroke={colors[z.kind]} strokeWidth=".35" fill="#263d35">{z.label}</text></g>})}
  {rentalLayouts(plan).filter(u=>u.floor===floor).flatMap(u=>u.rooms.map(room=>{const r=roadRect(room,b.widthFt,b.depthFt,b.roadSide);return <g key={room.id}><title>{`${room.label} · ${room.w.toFixed(1)} × ${room.d.toFixed(1)} ft`}</title><rect x={r.x} y={r.y} width={r.w} height={r.d} fill={scheme.rooms[room.id]?.floor??"#e2e8d9"} stroke="#54665a" strokeWidth=".15"/><text x={r.x+r.w/2} y={r.y+r.d/2} textAnchor="middle" fontSize={Math.min(1.8,r.w/(room.label.length*.65),r.d*.2)}>{room.label}</text></g>}))}
  {showFurniture&&commercialFixtures(plan).filter(p=>p.floor===floor).map(p=>{const r=roadRect(p,b.widthFt,b.depthFt,b.roadSide);return <rect key={p.id} x={r.x} y={r.y} width={r.w} height={r.d} fill="#8a735c" fillOpacity=".5" stroke="#675a4a" strokeWidth=".12"><title>{`${p.label} · indicative furniture`}</title></rect>})}
  {commercialPortals(plan).filter(p=>p.floor===floor).map(p=>{const a=roadPoint(p,b.widthFt,b.depthFt,b.roadSide),end=roadPoint({x:p.x+(p.axis==="x"?p.length:0),y:p.y+(p.axis==="y"?p.length:0)},b.widthFt,b.depthFt,b.roadSide);return <line key={p.id} x1={a.x} y1={a.y} x2={end.x} y2={end.y} stroke={p.kind==="access"?"#926036":"#24788a"} strokeWidth=".65"><title>{`${p.kind} candidate — review required`}</title></line>})}
  <text x={w/2} y={-3} textAnchor="middle" fontSize="2.5" fill="#344d40">North ↑ · Road {b.roadSide}</text>
  <text x={w/2} y={d+5} textAnchor="middle" fontSize="2.5" fill="#344d40">{w} × {d} ft · oriented plot</text>
 </svg>;
}
function Massing({plan,floor,angle,scheme,showFurniture}:{plan:BuildingConcept;floor:number|null;angle:number;scheme:FinishScheme;showFurniture:boolean}){
 const b=plan.brief,dim=siteDimensions(b.widthFt,b.depthFt,b.roadSide);
 const rotate=(x:number,y:number)=>{const X=x-dim.w/2,Y=y-dim.d/2,t=angle*Math.PI/2;return [X*Math.cos(t)-Y*Math.sin(t),X*Math.sin(t)+Y*Math.cos(t)]};
 const project=(x:number,y:number,z:number)=>{const [X,Y]=rotate(x,y);return [(X-Y)*.86,(X+Y)*.44-z].join(",")};
 const units=floor===null?[]:rentalLayouts(plan).filter(u=>u.floor===floor);
 const detailedZones:BuildingZone[]=[...plan.zones.filter(z=>!units.some(u=>u.unitId===z.id)),...units.flatMap(u=>u.rooms.map(r=>({...r,kind:"primary" as const})))];
 const fixtures=floor===null||!showFurniture?[]:commercialFixtures(plan).filter(p=>p.floor===floor);
 const displayZones=[...detailedZones,...fixtures.map(p=>({...p,kind:"service" as const,fixture:true}))];
 const faces=displayZones.filter(z=>floor===null||z.floor===floor).flatMap(z=>{
  const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide),base=(floor===null?z.floor:0)*13,h="fixture" in z?2.5:["parking","open"].includes(z.kind) ? .25 : floor===null?13:0.35;
  const corners=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]];
  const depth=corners.reduce((sum,[x,y])=>{const [X,Y]=rotate(x,y);return sum+X+Y},0)/4;
  return [{id:z.id+"-top",depth,level:z.floor+("fixture" in z ? .5 : 0),points:corners.map(([x,y])=>project(x,y,base+h)).join(" "),fill:floor===null?(z.kind==="core"?scheme.accent:["open","parking"].includes(z.kind)?colors[z.kind]:scheme.exterior):scheme.rooms[z.id]?.floor??colors[z.kind],label:z.label},...corners.map(([x,y],i)=>{const [nx,ny]=corners[(i+1)%4];return {id:z.id+"-"+i,depth:depth-.001,level:z.floor,points:[project(x,y,base),project(nx,ny,base),project(nx,ny,base+h),project(x,y,base+h)].join(" "),fill:floor===null?(z.kind==="core"?scheme.accent:["open","parking"].includes(z.kind)?colors[z.kind]:scheme.exterior):scheme.rooms[z.id]?.floor??colors[z.kind],label:z.label}})];
 });
 // Reuse the real opening-aware wall segments instead of an empty flat slab.
 const wallFaces=floor===null?[]:commercialElements(plan).walls.filter(w=>w.floor===floor&&w.bottom<4.5).map(w=>{
  const endpoint=(v:number)=>roadPoint(w.axis==="x"?{x:v,y:w.plane}:{x:w.plane,y:v},b.widthFt,b.depthFt,b.roadSide);
  const a=endpoint(w.start),c=endpoint(w.end),low=Math.max(.35,w.bottom),high=Math.min(4.5,w.top);
  if(high<=low)return null;
  return {id:"cut-"+w.id,depth:(rotate(a.x,a.y).reduce((s,v)=>s+v,0)+rotate(c.x,c.y).reduce((s,v)=>s+v,0))/2,level:floor+.75,points:[project(a.x,a.y,low),project(c.x,c.y,low),project(c.x,c.y,high),project(a.x,a.y,high)].join(" "),fill:"#f0e9d9",label:"Concept wall with modeled openings"};
 }).filter(f=>f!==null);
 const span=(dim.w+dim.d)*.86,high=(floor===null?b.floors*13:13)+(dim.w+dim.d)*.22;
 return <svg viewBox={[-span/2-8,-high-8,span+16,high+(dim.w+dim.d)*.22+16].join(" ")} role="img" aria-label={floor===null?"All floors three-dimensional zoning massing":"Selected floor three-dimensional zoning"} data-plan-id={plan.id} data-floor={floor??"all"}>
  {[...faces,...wallFaces].sort((a,c)=>a.level-c.level||a.depth-c.depth).map(f=><polygon key={f.id} points={f.points} fill={f.fill} stroke="#536658" strokeWidth=".22"><title>{f.label}</title></polygon>)}
 </svg>;
}
function CommercialFront({plan,scheme}:{plan:BuildingConcept;scheme:FinishScheme}){
 const panels=commercialFrontPanels(plan),portals=commercialPortals(plan).filter(p=>p.axis==="x"),w=plan.brief.widthFt,h=plan.brief.floors*13;
 return <section className="purpose-front"><h3>Street-facing elevation study</h3><p>Front elevation of your selected layout.</p><svg viewBox={[-4,-6,w+8,h+12].join(" ")} role="img" aria-label="Street-facing conceptual elevation" data-plan-id={plan.id}>
 {panels.map((p,i)=><g key={i}><rect x={p.x} y={h-(p.floor+1)*13} width={p.w} height="13" fill={p.kind==="core"?scheme.accent:scheme.exterior} stroke="#58685b" strokeWidth=".3"/><path d={"M"+p.x+" "+(h-(p.floor+1)*13+.5)+"h"+p.w} stroke="#746b5e" strokeWidth=".35"/><title>{`Level ${p.floor+1} · ${p.w.toFixed(1)} ft width · ${p.y.toFixed(1)} ft from road`}</title></g>)}
 {portals.map(p=><rect key={p.id} x={p.x} y={h-p.floor*13-8} width={p.length} height={p.kind==="access"?8:5} fill={p.kind==="access"?"#4d5452":scheme.glass} stroke="#485b60" strokeWidth=".2"/>)}
 <line x1="0" y1={h} x2={w} y2={h} stroke="#354a3a" strokeWidth=".5"/></svg></section>
}
export function BuildingPurposeStudio({cloudEnabled=false}:{cloudEnabled?:boolean}={}){
 const [draft,setDraft]=useState<BuildingBrief>(defaults),[brief,setBrief]=useState<BuildingBrief>(defaults),[selected,setSelected]=useState(0),[floor,setFloor]=useState(0),[full,setFull]=useState(false),[angle,setAngle]=useState(0);
 const [comparison,setComparison]=useState<{key:string;result:ReturnType<typeof recommendBuildingConcepts>}|null>(null);
 const briefKey=JSON.stringify(brief),compared=comparison?.key===briefKey?comparison.result:null;
 const [family,setFamily]=useState<BuildingLayoutFamily>("purpose-led");
 const result=useMemo(()=>generateBuildingConcepts(brief,24,family),[brief,family]),plan=result.plans[selected];
 const [showFurniture,setShowFurniture]=useState(false),[liteChoice,setLiteChoice]=useState<boolean|null>(null);
 const autoLite=useSyncExternalStore(subscribeNetwork,liteSnapshot,serverLiteSnapshot),lite=liteChoice??autoLite;
 const [finishHistory,setFinishHistory]=useState<Record<string,FinishScheme>>({});
 const scheme=useMemo(()=>plan?(finishHistory[plan.id]??defaultFinishScheme({kind:"commercial",plan})):null,[plan,finishHistory]);
 const info=purposeDetails[draft.purpose],active=purposeDetails[brief.purpose];
 const requirements=buildingInputRequirements(draft),issues=validateBuildingBrief(draft);
 function update<K extends keyof BuildingBrief>(key:K,value:BuildingBrief[K]){setDraft(d=>({...d,[key]:value}))}
 function selectPurpose(p:BuildingPurpose){
  const next={...draft,purpose:p};
  setDraft(next);setShowFurniture(false);
  // Keep exact measured inputs; never silently substitute a different plot.
  // A compatible purpose switch is immediate; incompatible inputs have no old-purpose preview.
  if(!validateBuildingBrief(next).length){setBrief(next);setSelected(0);setFloor(0);setFull(false);setAngle(0)}
 }
 function submit(e:FormEvent){e.preventDefault();if(issues.length)return;setBrief({...draft});setSelected(0);setFloor(0);setFull(false);setAngle(0);setShowFurniture(false)}
 function restore(snapshot:{plan:BuildingConcept;finishes:FinishScheme}){
  const next=snapshot.plan.brief;
  const restoredFamily=buildingLayoutFamily(snapshot.plan.id);
  const index=generateBuildingConcepts(next,24,restoredFamily).plans.findIndex(p=>p.id===snapshot.plan.id&&p.signature===snapshot.plan.signature);
  if(index<0||snapshot.finishes.planId!==snapshot.plan.id)return false;
  setFamily(restoredFamily);setDraft({...next});setBrief({...next});setSelected(index);setFloor(0);setFull(false);setAngle(0);
  setFinishHistory(h=>rememberFinish(h,snapshot.plan.id,snapshot.finishes));return true;
 }
 const changed=JSON.stringify(draft)!==JSON.stringify(brief),pendingPurpose=draft.purpose!==brief.purpose;
 function openPreview(id:string){const el=document.getElementById(id);if(el instanceof HTMLDetailsElement){el.open=true;el.scrollIntoView({block:"start",behavior:"auto"});el.querySelector("summary")?.focus({preventScroll:true})}}
 return <div className="purpose-studio">
  <header><span className="eyebrow">NEERVA BUILDING STUDIO · FEASIBILITY CONCEPTS</span><h1>Plan beyond your home.</h1><p>Choose a building purpose, enter exact site dimensions and compare up to 24 distinct zoning arrangements. Family homes use the dedicated residential planner.</p><Link className="button button-outline" href="/design-studio#start">Family home / BHK planner →</Link></header>
  <IrregularPlotPlanner onUse={(widthFt,depthFt,siteContext)=>setDraft(d=>({...d,widthFt,depthFt,siteContext}))}/>
  {draft.siteContext&&<div className="purpose-input-review"><strong>Measured irregular site attached</strong><p>Selected envelope: {draft.widthFt} × {draft.depthFt} ft · road offset {draft.siteContext.offsetXFt.toFixed(2)} ft. Edited dimensions must remain inside the measured boundary.</p><button type="button" onClick={()=>setDraft(({siteContext: _site,...rest})=>rest)}>Remove survey and use rectangular plot</button></div>}
  <form onSubmit={submit} className="purpose-form">
   <label>Building purpose<select value={draft.purpose} onChange={e=>selectPurpose(e.target.value as BuildingPurpose)}>{buildingPurposes.map(p=><option key={p} value={p}>{purposeDetails[p].title}</option>)}</select></label>
   {([["widthFt","Frontage (ft)",20,500],["depthFt","Depth (ft)",30,600],["floors","Total floors",1,6],["unitsPerFloor",info.unit+"s per floor",1,24],["parkingBays","Parking reservations",0,40],["frontFt","Front open depth (ft)",info.front,300],["rearFt","Rear open depth (ft)",info.back,300],["sideFt","Open margin each side (ft)",0,100]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="number" required min={min} max={max} step={["floors","unitsPerFloor","parkingBays"].includes(key)?1:"any"} value={Number.isFinite(draft[key])?draft[key]:""} onChange={e=>update(key,e.target.valueAsNumber)}/></label>)}
   {draft.purpose==="rental"&&<label>Bedrooms per rental unit<select value={draft.rentalBedrooms??1} onChange={e=>update("rentalBedrooms",Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n} BHK</option>)}</select></label>}
   <label>Road direction<select value={draft.roadSide} onChange={e=>update("roadSide",e.target.value as BuildingBrief["roadSide"])}>{["N","E","S","W"].map(s=><option key={s}>{s}</option>)}</select></label>
   <button className="button button-outline" type="button" onClick={()=>setDraft(buildingStarter(draft.purpose))}>Load example inputs for {info.title}</button>
   <button className="button button-dark" type="submit" disabled={issues.length>0}>Generate distinct concepts →</button>
   <div className="purpose-input-review" aria-live="polite">
    <strong>Input feasibility · {info.title}</strong>
    {requirements&&Number.isFinite(requirements.minWidthFt)&&Number.isFinite(requirements.minDepthFt)&&<p>Current request requires at least {requirements.minWidthFt} × {requirements.minDepthFt} ft plot under this generator, including entered margins. Each {info.unit.toLowerCase()} needs at least {requirements.unitAreaSqFt} sq ft and {requirements.unitWidthFt} × {requirements.unitDepthFt} ft clear zone extents. These are necessary lower bounds, not a guarantee that layouts fit.</p>}
    {issues.length?<ul>{issues.map(s=><li key={s}>{s}</li>)}</ul>:<p>Basic inputs accepted. Generate to run the full geometry checks. Local approvals are still required.</p>}
    <small>Commercial projects use purpose-specific units, not BHK. Rental units include concept room partitions for the requested 1–3 BHK; door, window, wall and statutory review remains required. Example inputs are applied only on request.</small>
   </div>
  </form>
  {changed&&<p role="status">{pendingPurpose?"The new building purpose needs compatible dimensions and programme. Adjust the inputs and generate; the previous purpose is not shown.":"Inputs changed. Preview below is the previous generated request. Press Generate distinct concepts to apply your new inputs."}</p>}
  <p className="purpose-warning">Concept minimums are internal planning assumptions, not legal setbacks, sanctioned occupancy or construction approval. The building generator uses rectangular envelopes, including contained envelopes on irregular plots. Parking bays are reservations, not a validated driveway or traffic plan.</p>
  {!pendingPurpose&&<section aria-live="polite" id="building-results"><div className="purpose-tabs" role="group" aria-label="Layout family"><button type="button" aria-pressed={family==="purpose-led"} onClick={()=>{setFamily("purpose-led");setSelected(0);setAngle(0)}}>Purpose-led layout</button><button type="button" aria-pressed={family==="classic"} onClick={()=>{setFamily("classic");setSelected(0);setAngle(0)}}>Classic access spine</button><button type="button" aria-pressed={family==="side-gallery"} onClick={()=>{setFamily("side-gallery");setSelected(0);setAngle(0);setFull(false)}}>Side gallery</button><button type="button" onClick={()=>setComparison({key:briefKey,result:recommendBuildingConcepts(brief)})}>Compare recommended designs</button></div>{compared&&<section aria-label="Recommended concept comparison"><h3>{compared.distinct} unique feasible zoning candidates across families</h3><p>Compare up to 24 candidates, balanced across available families and ordered within each by primary-area share. These are indicative planning metrics, not architectural approval or a quality guarantee.</p><div className="purpose-options">{compared.options.map(o=><button type="button" key={o.id} aria-pressed={plan?.id===o.id} onClick={()=>{setFamily(o.family);setSelected(o.index);setFloor(0);setFull(false);setAngle(0)}}><strong>{o.label}</strong><span>{Math.round(o.primaryAreaShare*100)}% primary area · {Math.round(o.accessAreaShare*100)}% access area</span></button>)}</div></section>}<h2>{active.title} · {result.plans.length} distinct zoning concepts</h2><p>{brief.widthFt} × {brief.depthFt} ft · {brief.floors} floor(s) · {brief.unitsPerFloor} primary zones per floor</p>
   {result.blockers.map(s=><p role="alert" key={s}>{s}</p>)}
   {plan&&scheme&&<><div className="purpose-options" role="group" aria-label="Choose zoning option">{result.plans.map((p,i)=><button type="button" key={p.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}><strong>Option {i+1}</strong><span>{p.layout}</span></button>)}</div>
    <div className="purpose-tabs" role="group" aria-label="Floor selection">{Array.from({length:brief.floors},(_,i)=><button type="button" key={i} aria-pressed={floor===i} onClick={()=>{setFloor(i);setFull(false)}}>{i===0?"Ground":"Floor "+i}</button>)}</div>
    <div className="purpose-tabs" role="group" aria-label="Preview controls"><button type="button" aria-pressed={lite} onClick={()=>setLiteChoice(!lite)}>{lite?"Show 3D concept":"Lite view · 2D only"}</button><button type="button" aria-pressed={showFurniture} onClick={()=>setShowFurniture(v=>!v)}>{showFurniture?"Hide indicative furniture":"Show indicative furniture"}</button><button type="button" onClick={()=>openPreview("building-exterior")}>Exterior & image render</button><button type="button" onClick={()=>openPreview("building-interior")}>Interior preview</button></div>{autoLite&&lite&&<p role="status">Slow connection or data saver detected. The 2D preview is active; open 3D whenever you need it.</p>}<p className="purpose-warning">Viewing generated {active.title.toLowerCase()} · Option {selected+1}. Core zones are reserves, not designed stairs or lifts.</p><div className="purpose-views" style={lite?{gridTemplateColumns:"minmax(0,1fr)"}:undefined}><section><h3>2D zoning plan</h3><PlanDrawing plan={plan} floor={floor} scheme={scheme} showFurniture={showFurniture}/></section>{!lite&&<section><h3>3D concept · same plan</h3><div className="purpose-tabs"><button type="button" onClick={()=>setAngle(a=>(a+1)%4)}>Rotate 90°</button><button type="button" aria-pressed={full} onClick={()=>setFull(f=>!f)}>{full?"Show selected floor":"Show all floors"}</button></div><Massing plan={plan} floor={full?null:floor} angle={angle} scheme={scheme} showFurniture={showFurniture}/></section>}</div>
    {brief.siteContext&&<details><summary>Measured site and building footprint</summary><svg role="img" aria-label="Generated footprint inside the measured site" viewBox={[-5,-5,Math.max(...brief.siteContext.points.map(p=>p.x))+10,Math.max(...brief.siteContext.points.map(p=>p.y))+10].join(" ")} style={{width:"100%",maxHeight:360}}><polygon points={brief.siteContext.points.map(p=>p.x+","+p.y).join(" ")} fill="#e6eddb" stroke="#405c42" strokeWidth=".7"/><rect x={brief.siteContext.offsetXFt} y={0} width={brief.widthFt} height={brief.depthFt} fill="none" stroke="#345a7b" strokeDasharray="2 1" strokeWidth=".6"/>{plan.zones.filter(z=>z.floor===floor).map(z=><rect key={z.id} x={z.x+brief.siteContext!.offsetXFt} y={z.y} width={z.w} height={z.d} fill={colors[z.kind]} stroke="#425447" strokeWidth=".2"><title>{z.label}</title></rect>)}</svg><p>Surveyed area: {polygonArea(brief.siteContext.points).toFixed(1)} sq ft. The dashed envelope contains the actual generated zones. Remaining land is unplanned; the detailed 3D view uses envelope-local coordinates, not a full polygon building.</p></details>}
    <CommercialFront plan={plan} scheme={scheme}/>
    {cloudEnabled&&<CommercialProjectSave key={plan.id} plan={plan} scheme={scheme} onRestore={restore}/>}
    <PlanFinishStudio key={plan.id+":"+floor} source={{kind:"commercial",plan}} floor={floor} scheme={scheme} onChange={next=>setFinishHistory(h=>rememberFinish(h,plan.id,next))}/>
    <details><summary>Plan legend</summary><p>Brown: proposed entry. Blue: proposed glazing. Blue floor zones: primary use. Tan: support. Purple: toilet reserve. Green-grey: vertical core reserve. Furniture is optional and illustrative.</p></details>
    <details><summary>Selected floor zone schedule</summary><div className="purpose-table"><table><thead><tr><th>Zone</th><th>Dimensions (ft)</th><th>Area (sq ft)</th></tr></thead><tbody>{plan.zones.filter(z=>z.floor===floor).map(z=><tr key={z.id}><td>{z.label}</td><td>{z.w.toFixed(1)} × {z.d.toFixed(1)}</td><td>{Math.round(z.w*z.d)}</td></tr>)}</tbody></table></div></details>
    {brief.purpose==="rental"&&<details><summary>Rental room schedules · {brief.rentalBedrooms??1} BHK per unit</summary>{rentalLayouts(plan).filter(u=>u.floor===floor).map((u,i)=><div key={u.unitId}><h4>Unit {i+1}</h4><ul>{u.rooms.map(r=><li key={r.id}>{r.label} · {r.w.toFixed(1)} × {r.d.toFixed(1)} ft</li>)}</ul></div>)}<p>Indicative room extents only; doors, windows, wall thickness and independent utility connections need professional design.</p></details>}
    <BuildingEngineeringPanel plan={plan} floor={floor} scheme={scheme}/>
   </>}
  </section>}
  <section className="purpose-warning"><strong>Concept only — professional approval required before construction.</strong><details><summary>What needs professional review?</summary><ul>{info.checks.map(c=><li key={c}>{c}</li>)}</ul><p>Structural, fire, accessibility, MEP and local approval remain unverified.</p></details><Link href="/support">Planning support →</Link></section>
 </div>;
}
