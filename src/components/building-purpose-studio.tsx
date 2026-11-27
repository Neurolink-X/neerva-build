"use client";
import dynamic from "next/dynamic";
import {buildingFloorSnapshot,buildingRenderSnapshot} from "@/modules/studio/building-render";
import {useMemo,useState,useSyncExternalStore,type FormEvent} from "react";
import Link from "@/components/intent-link";
import {preferLitePreview,preferLiteDevice,type NetworkHint} from "@/modules/navigation/intent";
import {recommendBuildingConcepts} from "@/modules/studio/building-recommendations";
import {polygonArea} from "@/modules/studio/irregular-plot";
import {IrregularPlotPlanner} from "./irregular-plot-planner";
import {CommercialFront} from "./commercial-front";
import {CommercialProjectSave} from "./commercial-project-save";
import {PlanFinishStudio} from "./plan-finish-studio";
import {defaultFinishScheme,rememberFinish,type FinishScheme} from "@/modules/studio/finish-model";
import {BuildingEngineeringPanel} from "./building-engineering-panel";
import {buildingPurposes,purposeDetails,generateBuildingConcepts,buildingInputRequirements,buildingStarter,validateBuildingBrief,buildingLayoutFamily,type BuildingLayoutFamily,type BuildingPurpose,type BuildingBrief,type BuildingConcept,type BuildingZone} from "@/modules/studio/building-purpose";
import {commercialInternalSpaces,commercialStairStudies} from "@/modules/studio/commercial-internal";
import {commercialElements} from "@/modules/studio/commercial-elements";
import {commercialFixtures} from "@/modules/studio/commercial-detail";
import {rentalLayouts} from "@/modules/studio/rental-layout";
import {roadRect,roadPoint,siteDimensions,roadSegment} from "@/modules/studio/plan-coordinate";
const colors:Record<BuildingZone["kind"],string>={primary:"#e0e9ec",support:"#ede5d8",toilet:"#e9e4ed",circulation:"#f5f2e8",core:"#dfe5dd",service:"#eee4da",parking:"#e0e2e4",open:"#e6eddc"};
const CommercialRoomViewer=dynamic(()=>import("./commercial-room-viewer"),{ssr:false,loading:()=> <p role="status">Loading interactive 3D…</p>});
const defaults:BuildingBrief={...buildingStarter("shops"),reserveLift:false};
const network=()=> (navigator as Navigator&{connection?:NetworkHint&EventTarget}).connection;
function subscribeNetwork(notify:()=>void){const connection=network();connection?.addEventListener?.("change",notify);window.addEventListener("online",notify);window.addEventListener("offline",notify);return()=>{connection?.removeEventListener?.("change",notify);window.removeEventListener("online",notify);window.removeEventListener("offline",notify)}}
const liteSnapshot=()=>preferLitePreview(network(),navigator.onLine)||preferLiteDevice({cores:navigator.hardwareConcurrency,memory:(navigator as Navigator&{deviceMemory?:number}).deviceMemory});
const serverLiteSnapshot=()=>false;
// SVG title must have one text child: SSR text separators can break hydration.
function PlanDrawing({plan,floor,scheme,showFurniture,technical}:{plan:BuildingConcept;floor:number;scheme:FinishScheme;showFurniture:boolean;technical:boolean}){
 const b=plan.brief,{w,d}=siteDimensions(b.widthFt,b.depthFt,b.roadSide),road=roadSegment(b.widthFt,b.depthFt,b.roadSide);
 const inside=commercialInternalSpaces(plan).filter(r=>r.floor===floor),parents=new Set(inside.map(r=>r.parentId));
 const rooms=inside.length?inside:rentalLayouts(plan).filter(u=>u.floor===floor).flatMap(u=>u.rooms);
 const flights=commercialStairStudies(plan).studies.filter(s=>s.floor===floor);
 const elements=commercialElements(plan),portals=elements.portals.filter(p=>p.floor===floor);
 const zoneFill=(kind:BuildingZone["kind"])=>technical?(kind==="open"?"#edf1e6":kind==="parking"?"#e9ecee":"#faf9f4"):colors[kind];
 const scale=w>=100?20:w>=50?10:5;
 return <svg viewBox={[-8,-8,w+16,d+16].join(" ")} role="img" aria-label={"Purpose-specific zoning, floor "+(floor+1)} data-plan-id={plan.id} data-floor={floor}>
  <rect width={w} height={d} fill="#fbfaf5" stroke="#526655" strokeWidth=".5"/>
  <line x1={road.start.x} y1={road.start.y} x2={road.end.x} y2={road.end.y} stroke="#987456" strokeWidth="2"/>
  {plan.zones.filter(z=>z.floor===floor).map(z=>{const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide),font=Math.min(2.3,r.w/(z.label.length*.65),r.d*.21);return <g key={z.id}><title>{`${z.label}: ${z.w.toFixed(1)} × ${z.d.toFixed(1)} ft`}</title><rect x={r.x} y={r.y} width={r.w} height={r.d} fill={zoneFill(z.kind)} stroke="#54665a" strokeWidth=".4"/><text x={r.x+r.w/2} y={r.y+r.d/2} textAnchor="middle" fontSize={font} paintOrder="stroke" stroke={zoneFill(z.kind)} strokeWidth=".35" fill="#263d35">{parents.has(z.id)?"":z.label}</text>{!parents.has(z.id)&&r.d>font*3&&r.w>10&&<text x={r.x+r.w/2} y={r.y+r.d/2+font*1.3} textAnchor="middle" fontSize={Math.min(font,1.7)} fill="#40574b">{`${z.w.toFixed(1)} × ${z.d.toFixed(1)} ft`}</text>}</g>})}
  {rooms.map(room=>{const r=roadRect(room,b.widthFt,b.depthFt,b.roadSide),font=Math.min(2,r.w/(room.label.length*.64),r.d*.2);return <g key={room.id}><title>{`${room.label} · ${room.w.toFixed(1)} × ${room.d.toFixed(1)} ft`}</title><rect x={r.x} y={r.y} width={r.w} height={r.d} fill={technical?"#faf9f4":scheme.rooms[room.id]?.floor??"#e2e8d9"} stroke="#54665a" strokeWidth=".15"/><text x={r.x+r.w/2} y={r.y+r.d/2} textAnchor="middle" fontSize={font} fill="#263d35">{room.label}</text>{r.d>font*4&&r.w>8&&<text x={r.x+r.w/2} y={r.y+r.d/2+font*1.4} textAnchor="middle" fontSize={Math.min(font,1.6)} fill="#52665a">{`${room.w.toFixed(1)} × ${room.d.toFixed(1)} ft`}</text>}</g>})}
  {flights.flatMap(s=>s.steps.map((step,i)=>{const r=roadRect(step,b.widthFt,b.depthFt,b.roadSide);return <rect key={s.roomId+"-step-"+i} x={r.x} y={r.y} width={r.w} height={r.d} fill="#d2c1a7" stroke="#695947" strokeWidth=".08"><title>{`Stair tread ${i+1}`}</title></rect>}))}
  {showFurniture&&commercialFixtures(plan).filter(p=>p.floor===floor).map(p=>{const r=roadRect(p,b.widthFt,b.depthFt,b.roadSide);return <rect key={p.id} x={r.x} y={r.y} width={r.w} height={r.d} fill="#8a735c" fillOpacity=".5" stroke="#675a4a" strokeWidth=".12"><title>{`${p.label} · indicative furniture`}</title></rect>})}
  {elements.walls.filter(w=>w.floor===floor&&w.bottom<.5).map(w=>{const a=roadPoint(w.axis==="x"?{x:w.start,y:w.plane}:{x:w.plane,y:w.start},b.widthFt,b.depthFt,b.roadSide),end=roadPoint(w.axis==="x"?{x:w.end,y:w.plane}:{x:w.plane,y:w.end},b.widthFt,b.depthFt,b.roadSide);return <line key={w.id} x1={a.x} y1={a.y} x2={end.x} y2={end.y} stroke="#35483e" strokeWidth={w.thickness}/>})}
  {portals.map(p=>{const a=roadPoint(p,b.widthFt,b.depthFt,b.roadSide),end=roadPoint({x:p.x+(p.axis==="x"?p.length:0),y:p.y+(p.axis==="y"?p.length:0)},b.widthFt,b.depthFt,b.roadSide),dx=end.x-a.x,dy=end.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len*.16,ny=dx/len*.16;return <g key={p.id}><title>{`${p.kind==="access"?"Access opening":"Glazing"} · ${p.length.toFixed(1)} ft · concept`}</title>{p.kind==="access"?<line x1={a.x} y1={a.y} x2={end.x} y2={end.y} stroke="#926036" strokeDasharray=".6 .4" strokeWidth=".22"/>:<><line x1={a.x+nx} y1={a.y+ny} x2={end.x+nx} y2={end.y+ny} stroke="#24788a" strokeWidth=".22"/><line x1={a.x-nx} y1={a.y-ny} x2={end.x-nx} y2={end.y-ny} stroke="#24788a" strokeWidth=".22"/></>}{[a,end].map((point,i)=><line key={i} x1={point.x-nx*1.8} y1={point.y-ny*1.8} x2={point.x+nx*1.8} y2={point.y+ny*1.8} stroke="#35483e" strokeWidth=".23"/>)}</g>})}
  <g aria-hidden="true" stroke="#344d40" strokeWidth=".2"><path d={`M-5 4 V-4 l-1.4 2 M-5 -4 l1.4 2`} fill="none"/><text x={-5} y={-4.8} fontSize="1.6" textAnchor="middle" stroke="none" fill="#344d40">N</text><path d={`M${w-scale} -1.2 H${w} m0 -.5 v1 M${w-scale} -1.7 v1`} fill="none"/><text x={w-scale/2} y={-2} fontSize="1.5" textAnchor="middle" stroke="none" fill="#344d40">{scale} ft</text></g>
  <text x={w/2} y={-3} textAnchor="middle" fontSize="2.5" fill="#344d40">North ↑ · Road {b.roadSide}</text>
  <line x1={0} y1={d+2.5} x2={w} y2={d+2.5} stroke="#65786a" strokeWidth=".18"/><path d={`M0 ${d+1.7}v1.6 M${w} ${d+1.7}v1.6 M-3 0h1.6 M-3 ${d}h1.6 M-2.2 0v${d}`} stroke="#65786a" strokeWidth=".2" fill="none"/><text transform={`translate(-4 ${d/2}) rotate(-90)`} fontSize="2" textAnchor="middle" fill="#40574b">{d} ft</text><text x={w/2} y={d+5} textAnchor="middle" fontSize="2.5" fill="#344d40">{w} × {d} ft · oriented plot</text>
 </svg>;
}
function Massing({plan,floor,angle,scheme,showFurniture}:{plan:BuildingConcept;floor:number|null;angle:number;scheme:FinishScheme;showFurniture:boolean}){
 const b=plan.brief,dim=siteDimensions(b.widthFt,b.depthFt,b.roadSide);
 const rotate=(x:number,y:number)=>{const X=x-dim.w/2,Y=y-dim.d/2,t=angle*Math.PI/2;return [X*Math.cos(t)-Y*Math.sin(t),X*Math.sin(t)+Y*Math.cos(t)]};
 const project=(x:number,y:number,z:number)=>{const [X,Y]=rotate(x,y);return [(X-Y)*.86,(X+Y)*.44-z].join(",")};
 const units=floor===null?[]:rentalLayouts(plan).filter(u=>u.floor===floor);
 const inside=floor===null?[]:commercialInternalSpaces(plan).filter(r=>r.floor===floor);
 const detailedZones:BuildingZone[]=inside.length?[...plan.zones.filter(z=>!inside.some(r=>r.parentId===z.id)),...inside.map(r=>({...r,kind:["lift","stairs","shaft"].includes(r.kind)?"core" as const:"primary" as const}))]:[...plan.zones.filter(z=>!units.some(u=>u.unitId===z.id)),...units.flatMap(u=>u.rooms.map(r=>({...r,kind:"primary" as const})))];
 const stairFaces=floor===null?[]:commercialStairStudies(plan).studies.filter(s=>s.floor===floor).flatMap(s=>[...s.steps,...s.landings.filter(l=>l.topFt>0)].map((step,i)=>{
  const r=roadRect(step,b.widthFt,b.depthFt,b.roadSide);
  return {id:s.roomId+"-step-"+i,depth:rotate(r.x+r.w/2,r.y+r.d/2).reduce((a,v)=>a+v,0),level:s.floor+.7,points:[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>project(x,y,step.topFt)).join(" "),fill:"#cbb496",label:"Concept stair walking surface"};
 }));
 const fixtures=floor===null||!showFurniture?[]:commercialFixtures(plan).filter(p=>p.floor===floor);
 const displayZones=[...detailedZones,...fixtures.map(p=>({...p,kind:"service" as const,fixture:true}))];
 const faces=displayZones.filter(z=>floor===null||z.floor===floor).flatMap(z=>{
  const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide),base=(floor===null?z.floor:0)*13,h="fixture" in z?2.5:["parking","open"].includes(z.kind) ? .25 : floor===null?13:0.35;
  const corners=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]];
  const depth=corners.reduce((sum,[x,y])=>{const [X,Y]=rotate(x,y);return sum+X+Y},0)/4;
  return [{id:z.id+"-top",depth,level:z.floor+("fixture" in z ? .5 : 0),points:corners.map(([x,y])=>project(x,y,base+h)).join(" "),fill:floor===null?(z.kind==="core"?scheme.accent:["open","parking"].includes(z.kind)?colors[z.kind]:scheme.exterior):scheme.rooms[z.id]?.floor??colors[z.kind],label:z.label},...corners.map(([x,y],i)=>{const [nx,ny]=corners[(i+1)%4];return {id:z.id+"-"+i,depth:depth-.001,level:z.floor,points:[project(x,y,base),project(nx,ny,base),project(nx,ny,base+h),project(x,y,base+h)].join(" "),fill:floor===null?(z.kind==="core"?scheme.accent:["open","parking"].includes(z.kind)?colors[z.kind]:scheme.exterior):scheme.rooms[z.id]?.floor??colors[z.kind],label:z.label}})];
 });
 // Reuse the real opening-aware wall segments instead of an empty flat slab.
 const wallFaces=floor===null?[]:commercialElements(plan).walls.filter(w=>w.floor===floor&&w.bottom<7).map(w=>{
  const endpoint=(v:number)=>roadPoint(w.axis==="x"?{x:v,y:w.plane}:{x:w.plane,y:v},b.widthFt,b.depthFt,b.roadSide);
  const a=endpoint(w.start),c=endpoint(w.end),low=Math.max(.35,w.bottom),high=Math.min(7,w.top);
  if(high<=low)return null;
  return {id:"cut-"+w.id,depth:(rotate(a.x,a.y).reduce((s,v)=>s+v,0)+rotate(c.x,c.y).reduce((s,v)=>s+v,0))/2,level:floor+.75,points:[project(a.x,a.y,low),project(c.x,c.y,low),project(c.x,c.y,high),project(a.x,a.y,high)].join(" "),fill:"#f0e9d9",label:"Concept wall with modeled openings"};
 }).filter(f=>f!==null);
 const polygons=[...faces,...stairFaces,...wallFaces];
 const points=polygons.flatMap(f=>f.points.split(" ").map(p=>p.split(",").map(Number)));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),pad=Math.max(3,Math.max(maxX-minX,maxY-minY)*.06);
 return <svg viewBox={[minX-pad,minY-pad,maxX-minX+2*pad,maxY-minY+2*pad].join(" ")} role="img" aria-label={floor===null?"All floors three-dimensional zoning massing":"Selected floor three-dimensional zoning"} data-plan-id={plan.id} data-floor={floor??"all"}>
  {polygons.sort((a,c)=>a.level-c.level||a.depth-c.depth).map(f=><polygon key={f.id} points={f.points} fill={f.fill} stroke="#536658" strokeWidth=".22"><title>{f.label}</title></polygon>)}
 </svg>;
}
export function BuildingPurposeStudio({cloudEnabled=false,initialPurpose}:{cloudEnabled?:boolean;initialPurpose?:BuildingPurpose}={}){
 const initial=initialPurpose?{...buildingStarter(initialPurpose),reserveLift:false}:defaults;
 const [draft,setDraft]=useState<BuildingBrief>(initial),[brief,setBrief]=useState<BuildingBrief>(initial),[selected,setSelected]=useState(0),[floor,setFloor]=useState(0),[full,setFull]=useState(false),[angle,setAngle]=useState(0);
 const [comparison,setComparison]=useState<{key:string;result:ReturnType<typeof recommendBuildingConcepts>}|null>(null);
 const briefKey=JSON.stringify(brief),compared=comparison?.key===briefKey?comparison.result:null;
 const [family,setFamily]=useState<BuildingLayoutFamily>("purpose-led");
 const result=useMemo(()=>generateBuildingConcepts(brief,24,family),[brief,family]),plan=result.plans[selected];
 const [interactiveChoice,setInteractive]=useState<boolean|null>(null),[fullHeight,setFullHeight]=useState(false);
 const [technical,setTechnical]=useState(true);
 const [showFurniture,setShowFurniture]=useState(false),[liteChoice,setLiteChoice]=useState<boolean|null>(null);
 const autoLite=useSyncExternalStore(subscribeNetwork,liteSnapshot,serverLiteSnapshot),lite=liteChoice??autoLite,interactive=interactiveChoice??!autoLite;
 const [finishHistory,setFinishHistory]=useState<Record<string,FinishScheme>>({});
 const floorSummary=useMemo(()=>{if(!plan)return null;const zones=plan.zones.filter(z=>z.floor===floor),covered=zones.filter(z=>!["parking","open"].includes(z.kind));return {area:covered.reduce((sum,z)=>sum+z.w*z.d,0),units:zones.filter(z=>z.kind==="primary").length,rooms:commercialInternalSpaces(plan).filter(r=>r.floor===floor).length};},[plan,floor]);
 const scheme=useMemo(()=>plan?(finishHistory[plan.id]??defaultFinishScheme({kind:"commercial",plan})):null,[plan,finishHistory]);
 const snapshot=useMemo(()=>!lite&&interactive&&plan&&scheme?(full?buildingRenderSnapshot(plan,"limestone",false,"front",scheme):buildingFloorSnapshot(plan,floor,scheme,fullHeight)):null,[lite,interactive,plan,scheme,full,floor,fullHeight]);
 const info=purposeDetails[draft.purpose],active=purposeDetails[brief.purpose];
 const requirements=buildingInputRequirements(draft),issues=validateBuildingBrief(draft);
 function update<K extends keyof BuildingBrief>(key:K,value:BuildingBrief[K]){setDraft(d=>({...d,[key]:value,...(key==="floors"&&value===1?{reserveLift:false}:{})}))}
 function selectPurpose(p:BuildingPurpose){
  const next={...draft,purpose:p};
  setDraft(next);setShowFurniture(false);
  // Keep exact measured inputs; never silently substitute a different plot.
  // A compatible purpose switch is immediate; incompatible inputs have no old-purpose preview.
  if(!validateBuildingBrief(next).length){setBrief(next);setSelected(0);setFloor(0);setFull(false);setAngle(0)}
 }
 function submit(e:FormEvent){e.preventDefault();if(issues.length)return;if(draft.floors>1&&draft.reserveLift!==brief.reserveLift)setFamily("internal");setBrief({...draft});setSelected(0);setFloor(0);setFull(false);setAngle(0);setShowFurniture(false)}
 function selectRecommendation(){
  const next=recommendBuildingConcepts(brief),best=next.options[0];
  setComparison({key:briefKey,result:next});
  if(best){setFamily(best.family);setSelected(best.index);setFloor(0);setFull(false);setAngle(0);setShowFurniture(false);}
 }
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
  <header><span className="eyebrow">NEERVA BUILDING STUDIO · FEASIBILITY CONCEPTS</span><h1>Plan beyond your home.</h1><p>Enter your exact site and building programme. Explore dimensioned plans, matching 3D architecture and recommended layouts. Family homes use the dedicated residential planner.</p><Link className="button button-outline" href="/design-studio#start">Family home / BHK planner →</Link></header>
  <IrregularPlotPlanner onUse={(widthFt,depthFt,siteContext)=>setDraft(d=>({...d,widthFt,depthFt,siteContext}))}/>
  {draft.siteContext&&<div className="purpose-input-review"><strong>Measured irregular site attached</strong><p>Selected envelope: {draft.widthFt} × {draft.depthFt} ft · road offset {draft.siteContext.offsetXFt.toFixed(2)} ft. Edited dimensions must remain inside the measured boundary.</p><button type="button" onClick={()=>setDraft(d=>{const next={...d};delete next.siteContext;return next})}>Remove survey and use rectangular plot</button></div>}
  <form onSubmit={submit} className="purpose-form">
   <label>Building purpose<select value={draft.purpose} onChange={e=>selectPurpose(e.target.value as BuildingPurpose)}>{buildingPurposes.map(p=><option key={p} value={p}>{purposeDetails[p].title}</option>)}</select></label>
   {([["widthFt","Frontage (ft)",20,500],["depthFt","Depth (ft)",30,600],["floors","Total floors",1,6],["unitsPerFloor",info.unit+"s per floor",1,24],["parkingBays","Parking reservations",0,40],["frontFt","Front open depth (ft)",info.front,300],["rearFt","Rear open depth (ft)",info.back,300],["sideFt","Open margin each side (ft)",0,100]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="number" required min={min} max={max} step={["floors","unitsPerFloor","parkingBays"].includes(key)?1:"any"} value={Number.isFinite(draft[key])?draft[key]:""} onChange={e=>update(key,e.target.valueAsNumber)}/></label>)}
   {draft.purpose==="rental"&&<label>Bedrooms per rental unit<select value={draft.rentalBedrooms??1} onChange={e=>update("rentalBedrooms",Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n} BHK</option>)}</select></label>}
   {draft.floors>1&&<label>Lift provision<select aria-label="Lift provision" value={draft.reserveLift===false?"no":"yes"} onChange={e=>update("reserveLift",e.target.value==="yes")}><option value="no">Stairs only</option><option value="yes">Reserve space for lift</option></select><small>Lift and accessibility requirements must be reviewed for the building use and height.</small></label>}
   <label>Road direction<select value={draft.roadSide} onChange={e=>update("roadSide",e.target.value as BuildingBrief["roadSide"])}>{["N","E","S","W"].map(s=><option key={s}>{s}</option>)}</select></label>
   <button className="button button-outline" type="button" onClick={()=>setDraft({...buildingStarter(draft.purpose),reserveLift:draft.reserveLift===true&&buildingStarter(draft.purpose).floors>1})}>Load example inputs for {info.title}</button>
   <button className="button button-dark" type="submit" disabled={issues.length>0}>Generate distinct concepts →</button>
   {issues.length>0&&<div className="purpose-input-review" aria-live="polite">
    <strong>Input feasibility · {info.title}</strong>
    {requirements&&Number.isFinite(requirements.minWidthFt)&&Number.isFinite(requirements.minDepthFt)&&<p>Current request requires at least {requirements.minWidthFt} × {requirements.minDepthFt} ft plot under this generator, including entered margins. Each {info.unit.toLowerCase()} needs at least {requirements.unitAreaSqFt} sq ft and {requirements.unitWidthFt} × {requirements.unitDepthFt} ft clear zone extents. These are necessary lower bounds, not a guarantee that layouts fit.</p>}
    {issues.length?<ul>{issues.map(s=><li key={s}>{s}</li>)}</ul>:<p>Basic inputs accepted. Generate to run the full geometry checks. Local approvals are still required.</p>}
   </div>}
  </form>
  {changed&&<p role="status">{pendingPurpose?"The new building purpose needs compatible dimensions and programme. Adjust the inputs and generate; the previous purpose is not shown.":"Inputs changed. Preview below is the previous generated request. Press Generate distinct concepts to apply your new inputs."}</p>}
  <details className="purpose-warning"><summary>Planning assumptions · concept only</summary><p>Minimums are internal planning assumptions, not legal setbacks or approved occupancy. Irregular sites use a contained rectangular envelope. Parking is a reservation, not a validated traffic plan.</p></details>
  {!pendingPurpose&&<section aria-live="polite" id="building-results"><div className="purpose-tabs" role="group" aria-label="Layout family"><button type="button" aria-pressed={family==="internal"} onClick={()=>{setFamily("internal");setSelected(0);setFloor(0);setAngle(0);setFull(false)}}>Rooms & shared facilities</button><button type="button" aria-pressed={family==="purpose-led"} onClick={()=>{setFamily("purpose-led");setSelected(0);setAngle(0)}}>Purpose-led layout</button><button type="button" aria-pressed={family==="classic"} onClick={()=>{setFamily("classic");setSelected(0);setAngle(0)}}>Classic access spine</button><button type="button" aria-pressed={family==="side-gallery"} onClick={()=>{setFamily("side-gallery");setSelected(0);setAngle(0);setFull(false)}}>Side gallery</button><button type="button" onClick={()=>setComparison({key:briefKey,result:recommendBuildingConcepts(brief)})}>Compare recommended designs</button><button type="button" onClick={selectRecommendation}>Open recommended layout</button></div>{compared&&<section aria-label="Recommended concept comparison"><h3>{compared.options.length} distinct recommended layouts</h3><p>{compared.detailedCount} include detailed internal rooms. The others are zoning concepts. Mirrored or repeated geometry is excluded from this comparison. Only layouts fitting the exact brief are shown.</p><div className="purpose-options">{compared.options.map(o=><button type="button" key={o.id} aria-pressed={plan?.id===o.id} onClick={()=>{setFamily(o.family);setSelected(o.index);setFloor(0);setFull(false);setAngle(0)}}><strong>{o.label}</strong><span>{o.detailed?`${o.interiorRoomCount} internal rooms / reserves`:"Zoning concept"} · Option {o.index+1}</span></button>)}</div></section>}<h2>{active.title} · {result.plans.length} {family==="internal"?"detailed interior concepts":"zoning concepts"}</h2>{result.plans.length<24&&result.plans.length>0&&<p className="purpose-caption">Only {result.plans.length} valid concepts fit this family and exact brief. Compare recommended designs for alternatives across layout families.</p>}<p>{brief.widthFt} × {brief.depthFt} ft · {brief.floors} floor(s) · {brief.unitsPerFloor} primary zones per floor</p>
   {result.blockers.map(s=><p role="alert" key={s}>{s}</p>)}
   {plan&&scheme&&<><div className="purpose-options" role="group" aria-label="Choose zoning option">{result.plans.map((p,i)=><button type="button" key={p.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}><strong>Option {i+1}</strong><span>{p.layout}</span></button>)}</div>
    <div className="purpose-tabs" role="group" aria-label="Floor selection">{Array.from({length:brief.floors},(_,i)=><button type="button" key={i} aria-pressed={floor===i} onClick={()=>{setFloor(i);setFull(false)}}>{i===0?"Ground":"Floor "+i}</button>)}</div>
    {floorSummary&&<div className="purpose-plan-summary" aria-label="Selected floor details"><span><strong>{Math.round(floorSummary.area).toLocaleString("en-IN")} sq ft</strong> Covered concept area</span><span><strong>{floorSummary.units}</strong> Primary spaces</span><span><strong>{floorSummary.rooms}</strong> Detailed rooms / reserves</span></div>}<div className="purpose-tabs" role="group" aria-label="Preview controls"><button type="button" aria-pressed={lite} onClick={()=>setLiteChoice(!lite)}>{lite?"Show 3D concept":"Lite view · 2D only"}</button><button type="button" aria-pressed={showFurniture} onClick={()=>{setShowFurniture(v=>!v);if(!showFurniture)setInteractive(false)}}>{showFurniture?"Hide space-use guidance":"Show space-use guidance"}</button><button type="button" onClick={()=>openPreview("building-exterior")}>Exterior & image render</button><button type="button" onClick={()=>openPreview("building-interior")}>Interior preview</button></div>{autoLite&&lite&&<p role="status">Lightweight preview is active for this connection or device. Open 3D whenever you need it.</p>}<p className="purpose-warning">Viewing generated {active.title.toLowerCase()} · Option {selected+1}. {brief.floors>1?"Stair and lift provisions require professional review. Unresolved stair bays remain reservations.":"Concept plan — professional review required."}</p><div className="purpose-views" style={lite?{gridTemplateColumns:"minmax(0,1fr)"}:undefined}><section><h3>2D architectural concept</h3><div className="purpose-tabs" role="group" aria-label="Plan drawing style"><button type="button" aria-pressed={technical} onClick={()=>setTechnical(true)}>Architectural</button><button type="button" aria-pressed={!technical} onClick={()=>setTechnical(false)}>Colour zoning</button></div><PlanDrawing plan={plan} floor={floor} scheme={scheme} showFurniture={showFurniture} technical={technical}/><p className="purpose-caption">North-up drawing · dimensions in feet · dashed openings indicate access; double blue lines indicate glazing.</p></section>{!lite&&<section><h3>3D concept · same plan</h3><div className="purpose-tabs"><button type="button" aria-pressed={!interactive} onClick={()=>{setInteractive(!interactive);if(!interactive)setShowFurniture(false)}}>{interactive?"Lightweight 3D":"Interactive 3D"}</button>{!interactive&&<button type="button" onClick={()=>setAngle(a=>(a+1)%4)}>Rotate 90°</button>}{interactive&&!full&&<button type="button" aria-pressed={fullHeight} onClick={()=>setFullHeight(v=>!v)}>{fullHeight?"Cutaway floor":"Full-height floor"}</button>}<button type="button" aria-pressed={full} onClick={()=>setFull(f=>!f)}>{full?"Show selected floor":"Show all floors"}</button></div>{interactive?<CommercialRoomViewer exterior key={plan.id+":"+floor+":"+full+":"+fullHeight} onUnavailable={()=>setInteractive(false)} snapshot={snapshot}/>:<Massing plan={plan} floor={full?null:floor} angle={angle} scheme={scheme} showFurniture={showFurniture}/>}<p className="purpose-caption">{full?"Full building concept":interactive&&fullHeight?"Full-height selected floor, roof hidden.":"Cutaway: walls are shortened for visibility only."} {interactive?"Street-relative model · drag to rotate; reset to fit.":"Open interactive 3D for depth, lighting and rotation."}</p></section>}</div>
    {brief.siteContext&&<details><summary>Measured site and building footprint</summary><svg role="img" aria-label="Generated footprint inside the measured site" viewBox={[-5,-5,Math.max(...brief.siteContext.points.map(p=>p.x))+10,Math.max(...brief.siteContext.points.map(p=>p.y))+10].join(" ")} style={{width:"100%",maxHeight:360}}><polygon points={brief.siteContext.points.map(p=>p.x+","+p.y).join(" ")} fill="#e6eddb" stroke="#405c42" strokeWidth=".7"/><rect x={brief.siteContext.offsetXFt} y={0} width={brief.widthFt} height={brief.depthFt} fill="none" stroke="#345a7b" strokeDasharray="2 1" strokeWidth=".6"/>{plan.zones.filter(z=>z.floor===floor).map(z=><rect key={z.id} x={z.x+brief.siteContext!.offsetXFt} y={z.y} width={z.w} height={z.d} fill={colors[z.kind]} stroke="#425447" strokeWidth=".2"><title>{z.label}</title></rect>)}</svg><p>Surveyed area: {polygonArea(brief.siteContext.points).toFixed(1)} sq ft. The dashed envelope contains the actual generated zones. Remaining land is unplanned; the detailed 3D view uses envelope-local coordinates, not a full polygon building.</p></details>}
    <CommercialFront plan={plan} scheme={scheme}/>
    {cloudEnabled&&<CommercialProjectSave key={plan.id} plan={plan} scheme={scheme} onRestore={restore}/>}
    <PlanFinishStudio key={plan.id+":"+floor} source={{kind:"commercial",plan}} floor={floor} scheme={scheme} onChange={next=>setFinishHistory(h=>rememberFinish(h,plan.id,next))}/>
    <details><summary>Plan legend</summary><p>Dashed brown: proposed entry. Double blue: proposed glazing. In colour zoning mode, blue floor zones indicate primary use, tan support, purple toilet reserve and green-grey vertical core reserve. Space-use markers are optional and illustrative.</p></details>
    <details><summary>Selected floor zone schedule</summary><div className="purpose-table"><table><thead><tr><th>Zone</th><th>Dimensions (ft)</th><th>Area (sq ft)</th></tr></thead><tbody>{plan.zones.filter(z=>z.floor===floor).map(z=><tr key={z.id}><td>{z.label}</td><td>{z.w.toFixed(1)} × {z.d.toFixed(1)}</td><td>{Math.round(z.w*z.d)}</td></tr>)}</tbody></table></div></details>
    {brief.purpose==="rental"&&<details><summary>Rental room schedules · {brief.rentalBedrooms??1} BHK per unit</summary>{rentalLayouts(plan).filter(u=>u.floor===floor).map((u,i)=><div key={u.unitId}><h4>Unit {i+1}</h4><ul>{u.rooms.map(r=><li key={r.id}>{r.label} · {r.w.toFixed(1)} × {r.d.toFixed(1)} ft</li>)}</ul></div>)}<p>Indicative room extents only; Final wall thickness, door/window specifications and independent utility connections need professional review.</p></details>}
    <BuildingEngineeringPanel plan={plan} floor={floor} scheme={scheme}/>
   </>}
  </section>}
  <section className="purpose-warning"><strong>Concept only — professional approval required before construction.</strong><details><summary>What needs professional review?</summary><ul>{info.checks.map(c=><li key={c}>{c}</li>)}</ul><p>Structural, fire, accessibility, MEP and local approval remain unverified.</p></details><Link href="/support">Planning support →</Link></section>
 </div>;
}
