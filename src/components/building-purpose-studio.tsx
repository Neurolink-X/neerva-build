"use client";
import {useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {BuildingEngineeringPanel} from "./building-engineering-panel";
import {buildingPurposes,purposeDetails,generateBuildingConcepts,buildingInputRequirements,buildingStarter,validateBuildingBrief,type BuildingPurpose,type BuildingBrief,type BuildingConcept,type BuildingZone} from "@/modules/studio/building-purpose";
import {roadRect,siteDimensions,roadSegment} from "@/modules/studio/plan-coordinate";
const colors:Record<BuildingZone["kind"],string>={primary:"#aac5d3",support:"#d3c2a4",toilet:"#c8b9d9",circulation:"#e8e6d7",core:"#bdc5bb",service:"#d9bfaa",parking:"#b6bdc3",open:"#c5d7ac"};
const defaults=buildingStarter("shops");
function PlanDrawing({plan,floor}:{plan:BuildingConcept;floor:number}){
 const b=plan.brief,{w,d}=siteDimensions(b.widthFt,b.depthFt,b.roadSide),road=roadSegment(b.widthFt,b.depthFt,b.roadSide);
 return <svg viewBox={[-8,-8,w+16,d+16].join(" ")} role="img" aria-label={"Purpose-specific zoning, floor "+(floor+1)} data-plan-id={plan.id} data-floor={floor}>
  <rect width={w} height={d} fill="#fbfaf5" stroke="#526655" strokeWidth=".5"/>
  <line x1={road.start.x} y1={road.start.y} x2={road.end.x} y2={road.end.y} stroke="#987456" strokeWidth="2"/>
  {plan.zones.filter(z=>z.floor===floor).map(z=>{const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide);return <g key={z.id}><title>{z.label}: {z.w.toFixed(1)} × {z.d.toFixed(1)} ft</title><rect x={r.x} y={r.y} width={r.w} height={r.d} fill={colors[z.kind]} stroke="#54665a" strokeWidth=".25"/><text x={r.x+r.w/2} y={r.y+r.d/2} textAnchor="middle" fontSize={Math.min(2.3,r.w/(z.label.length*.65),r.d*.21)} fill="#263d35">{z.label}</text></g>})}
  <text x={w/2} y={-3} textAnchor="middle" fontSize="2.5" fill="#344d40">North ↑ · Road {b.roadSide}</text>
  <text x={w/2} y={d+5} textAnchor="middle" fontSize="2.5" fill="#344d40">{w} × {d} ft · oriented plot</text>
 </svg>;
}
function Massing({plan,floor,angle}:{plan:BuildingConcept;floor:number|null;angle:number}){
 const b=plan.brief,dim=siteDimensions(b.widthFt,b.depthFt,b.roadSide);
 const rotate=(x:number,y:number)=>{const X=x-dim.w/2,Y=y-dim.d/2,t=angle*Math.PI/2;return [X*Math.cos(t)-Y*Math.sin(t),X*Math.sin(t)+Y*Math.cos(t)]};
 const project=(x:number,y:number,z:number)=>{const [X,Y]=rotate(x,y);return [(X-Y)*.86,(X+Y)*.44-z].join(",")};
 const faces=plan.zones.filter(z=>floor===null||z.floor===floor).flatMap(z=>{
  const r=roadRect(z,b.widthFt,b.depthFt,b.roadSide),base=(floor===null?z.floor:0)*13,h=["parking","open"].includes(z.kind) ? .25 : floor===null?13:3.5;
  const corners=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]];
  const depth=corners.reduce((sum,[x,y])=>{const [X,Y]=rotate(x,y);return sum+X+Y},0)/4;
  return [{id:z.id+"-top",depth,level:z.floor,points:corners.map(([x,y])=>project(x,y,base+h)).join(" "),fill:colors[z.kind],label:z.label},...corners.map(([x,y],i)=>{const [nx,ny]=corners[(i+1)%4];return {id:z.id+"-"+i,depth:depth-.001,level:z.floor,points:[project(x,y,base),project(nx,ny,base),project(nx,ny,base+h),project(x,y,base+h)].join(" "),fill:colors[z.kind],label:z.label}})];
 });
 const span=(dim.w+dim.d)*.86,high=(floor===null?b.floors*13:13)+(dim.w+dim.d)*.22;
 return <svg viewBox={[-span/2-8,-high-8,span+16,high+(dim.w+dim.d)*.22+16].join(" ")} role="img" aria-label={floor===null?"All floors three-dimensional zoning massing":"Selected floor three-dimensional zoning"} data-plan-id={plan.id} data-floor={floor??"all"}>
  {faces.sort((a,c)=>a.level-c.level||a.depth-c.depth).map(f=><polygon key={f.id} points={f.points} fill={f.fill} stroke="#536658" strokeWidth=".22"><title>{f.label}</title></polygon>)}
 </svg>;
}
export function BuildingPurposeStudio(){
 const [draft,setDraft]=useState<BuildingBrief>(defaults),[brief,setBrief]=useState<BuildingBrief>(defaults),[selected,setSelected]=useState(0),[floor,setFloor]=useState(0),[full,setFull]=useState(false),[angle,setAngle]=useState(0);
 const result=useMemo(()=>generateBuildingConcepts(brief),[brief]),plan=result.plans[selected];
 const info=purposeDetails[draft.purpose],active=purposeDetails[brief.purpose];
 const requirements=buildingInputRequirements(draft),issues=validateBuildingBrief(draft);
 function update<K extends keyof BuildingBrief>(key:K,value:BuildingBrief[K]){setDraft(d=>({...d,[key]:value}))}
 function selectPurpose(p:BuildingPurpose){setDraft(d=>({...d,purpose:p}))}
 function submit(e:FormEvent){e.preventDefault();if(issues.length)return;setBrief({...draft});setSelected(0);setFloor(0);setFull(false)}
 const changed=JSON.stringify(draft)!==JSON.stringify(brief);
 return <div className="purpose-studio">
  <header><span className="eyebrow">NEERVA BUILDING STUDIO · FEASIBILITY CONCEPTS</span><h1>Plan beyond your home.</h1><p>Choose a building purpose, enter exact site dimensions and compare up to 24 distinct zoning arrangements. Family homes use the dedicated residential planner.</p><Link className="button button-outline" href="/design-studio#start">Family home / BHK planner →</Link></header>
  <form onSubmit={submit} className="purpose-form">
   <label>Building purpose<select value={draft.purpose} onChange={e=>selectPurpose(e.target.value as BuildingPurpose)}>{buildingPurposes.map(p=><option key={p} value={p}>{purposeDetails[p].title}</option>)}</select></label>
   {([["widthFt","Frontage (ft)",20,500],["depthFt","Depth (ft)",30,600],["floors","Total floors",1,6],["unitsPerFloor",info.unit+"s per floor",1,24],["parkingBays","Parking reservations",0,40],["frontFt","Front open depth (ft)",info.front,300],["rearFt","Rear open depth (ft)",info.back,300],["sideFt","Open margin each side (ft)",0,100]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="number" required min={min} max={max} step={["floors","unitsPerFloor","parkingBays"].includes(key)?1:"any"} value={Number.isFinite(draft[key])?draft[key]:""} onChange={e=>update(key,e.target.valueAsNumber)}/></label>)}
   <label>Road direction<select value={draft.roadSide} onChange={e=>update("roadSide",e.target.value as BuildingBrief["roadSide"])}>{["N","E","S","W"].map(s=><option key={s}>{s}</option>)}</select></label>
   <button className="button button-outline" type="button" onClick={()=>setDraft(buildingStarter(draft.purpose))}>Load example inputs for {info.title}</button>
   <button className="button button-dark" type="submit" disabled={issues.length>0}>Generate distinct concepts →</button>
   <div className="purpose-input-review" aria-live="polite">
    <strong>Input feasibility · {info.title}</strong>
    {requirements&&Number.isFinite(requirements.minWidthFt)&&Number.isFinite(requirements.minDepthFt)&&<p>Current request requires at least {requirements.minWidthFt} × {requirements.minDepthFt} ft plot under this generator, including entered margins. Each {info.unit.toLowerCase()} needs at least {requirements.unitAreaSqFt} sq ft and {requirements.unitWidthFt} × {requirements.unitDepthFt} ft clear zone extents. These are necessary lower bounds, not a guarantee that layouts fit.</p>}
    {issues.length?<ul>{issues.map(s=><li key={s}>{s}</li>)}</ul>:<p>Basic inputs accepted. Generate to run the full geometry checks. Local approvals are still required.</p>}
    <small>Commercial projects use purpose-specific units, not BHK. Rental units here are envelopes; internal BHK planning is a separate future step. Example inputs are applied only on request.</small>
   </div>
  </form>
  {changed&&<p role="status">Inputs changed. Results below are for the last generated request, not the new inputs.</p>}
  <p className="purpose-warning">Concept minimums are internal planning assumptions, not legal setbacks, sanctioned occupancy or construction approval. Rectangular plots only. Parking bays are reservations, not a validated driveway or traffic plan.</p>
  <section aria-live="polite"><h2>{active.title} · {result.plans.length} distinct zoning concepts</h2><p>{brief.widthFt} × {brief.depthFt} ft · {brief.floors} floor(s) · {brief.unitsPerFloor} primary zones per floor</p>
   {result.blockers.map(s=><p role="alert" key={s}>{s}</p>)}
   {plan&&<><div className="purpose-options" role="group" aria-label="Choose zoning option">{result.plans.map((p,i)=><button type="button" key={p.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}><strong>Option {i+1}</strong><span>{p.layout}</span></button>)}</div>
    <div className="purpose-tabs" role="group" aria-label="Floor selection">{Array.from({length:brief.floors},(_,i)=><button type="button" key={i} aria-pressed={floor===i} onClick={()=>{setFloor(i);setFull(false)}}>{i===0?"Ground":"Floor "+i}</button>)}</div>
    <div className="purpose-views"><section><h3>2D zoning plan</h3><PlanDrawing plan={plan} floor={floor}/></section><section><h3>3D massing · same zones</h3><div className="purpose-tabs"><button type="button" onClick={()=>setAngle(a=>(a+1)%4)}>Rotate 90°</button><button type="button" aria-pressed={full} onClick={()=>setFull(f=>!f)}>{full?"Show selected floor":"Show all floors"}</button></div><Massing plan={plan} floor={full?null:floor} angle={angle}/></section></div>
    <details><summary>Selected floor zone schedule</summary><div className="purpose-table"><table><thead><tr><th>Zone</th><th>Dimensions (ft)</th><th>Area (sq ft)</th></tr></thead><tbody>{plan.zones.filter(z=>z.floor===floor).map(z=><tr key={z.id}><td>{z.label}</td><td>{z.w.toFixed(1)} × {z.d.toFixed(1)}</td><td>{Math.round(z.w*z.d)}</td></tr>)}</tbody></table></div></details>
    <BuildingEngineeringPanel plan={plan} floor={floor}/>
   </>}
  </section>
  <section className="purpose-warning"><h2>Professional review required</h2><ul>{active.checks.map(c=><li key={c}>{c}</li>)}</ul><p>Core and toilet zones reserve space only; stairs, lifts, doors, internal unit rooms, egress, fire services, structure, MEP and statutory approval are not engineered by this tool. Do not build from these zoning diagrams.</p><Link href="/support">Ask Neerva for planning support →</Link> · <Link href="/materials">Explore construction materials →</Link></section>
 </div>;
}
