"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {generateSpatialPortfolio} from "@/modules/studio/road-generator";
import type {PlanBrief,RoadSide,PlanModel} from "@/modules/studio/plan-model";
import {depthFromGaj,gajFromFeet} from "@/modules/studio/plot-area";

const fill:Record<string,string>={parking:"#bcd8d1",verandah:"#e9e3c0",living:"#d1e2d5",dining:"#e2e6c6",kitchen:"#edd8bb",bedroom:"#d8dfed",bath:"#c3dce8",stairs:"#d0d6cf",utility:"#e8d5bf",lounge:"#cce3ce",terrace:"#d7e9d8",corridor:"#eee8d5",balcony:"#dce8dc"};
function entranceType(plan:PlanModel){
 if(!plan.parking)return "Pedestrian-only entrance";
 if(plan.rooms.find(r=>r.id==="stairs-g")?.y===plan.setbacks.frontFt)return "Staircase beside parking";
 if(plan.rooms.find(r=>r.id==="bed-g")?.y===plan.setbacks.frontFt)return "Bedroom beside parking";
 return "Verandah beside parking";
}
function planLabel(plan:PlanModel,index:number){
 if(!plan.parking&&!plan.stairs.roomIds.length)return "Plan "+(index+1)+" · Compact 1 BHK · "+(plan.variant==="parking-left"?"left kitchen":"right kitchen");
 const rear=plan.rooms.find(r=>r.id==="utility-g");
 const family=plan.rooms.find(r=>r.id==="dining");
 const rearName=rear?.kind==="terrace"?"Courtyard":rear?.kind==="lounge"?"Rear gallery":rear?.kind==="living"?"Rear veranda":"Utility";
 const hall=family?.kind==="lounge"?"Family lounge":family?.kind==="living"?"Family hall":"Dining hall";
 return "Plan "+String(index+1).padStart(2,"0")+" · "+entranceType(plan)+" · "+rearName+" + "+hall;
}
function MiniSpatialPlan({plan,floor=0}:{plan:PlanModel;floor?:number}){
 const w=plan.plot.widthFt,d=plan.plot.depthFt;
 return <svg viewBox={"-2 -2 "+(w+4)+" "+(d+5)} className="nbd-spatial-map" role="img" aria-label={"Actual floor "+(floor+1)+" room geometry, "+w+" by "+d+" ft, road "+plan.plot.roadSide}>
   <rect width={w} height={d} fill="#fffaf3" stroke="#325744" strokeWidth=".5"/>
   {plan.rooms.filter(r=>r.floor===floor).map(r=><g key={r.id}>
    <rect x={r.x} y={r.y} width={r.w} height={r.d} stroke="#536c5d" strokeWidth=".16" fill={fill[r.kind]??"#ece9dc"}/>
    {r.w>=4&&r.d>=4&&<text x={r.x+r.w/2} y={r.y+r.d/2} textAnchor="middle" fontSize={Math.min(1.65,Math.max(.75,r.w/7))} fill="#234535">{r.kind==="bedroom"?"BED":r.kind==="kitchen"?"KITCHEN":r.kind==="parking"?"PARK":r.kind==="terrace"?"OPEN":r.kind==="lounge"?"LOUNGE":r.kind.toUpperCase()}</text>}
   </g>)}
   <line x1="0" y1="0" x2={w} y2="0" stroke="#b56543" strokeWidth=".9"/>
   <text x={w/2} y={d+2.6} textAnchor="middle" fill="#5d503e" fontSize="1.3">ROAD · {plan.plot.roadSide}</text>
  </svg>;
}
export function SpatialPlanGallery(){
 const [width,setWidth]=useState("18"),[depth,setDepth]=useState("50"),[floors,setFloors]=useState(2);
 const [bedrooms,setBedrooms]=useState(3),[road,setRoad]=useState<RoadSide>("N"),[parking,setParking]=useState(true);
 const [areaGaj,setAreaGaj]=useState(""),[areaError,setAreaError]=useState(""),[previewFloor,setPreviewFloor]=useState(0);
 function applyArea(value:string){
  const d=depthFromGaj(Number(value),Number(width));
  if(d===null){setAreaError("Enter a valid area and frontage; resulting depth must be 15–250 ft.");return;}
  setAreaGaj(value);setDepth(String(d));setAreaError("");
 }
 const brief:PlanBrief=useMemo(()=>({
  widthFt:width.trim()?Number(width):NaN,depthFt:depth.trim()?Number(depth):NaN,
  floors:floors as 1|2|3,bedrooms,roadSide:road,parking,
  setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}
 }),[width,depth,floors,bedrooms,road,parking]);
 const result=useMemo(()=>generateSpatialPortfolio(brief,24),[brief]);
 const baseParams={width:String(brief.widthFt),depth:String(brief.depthFt),road,floors:String(floors),bedrooms:String(bedrooms),parking:String(parking)};
 return <section className="nbd-spatial" aria-labelledby="nbd-spatial-title">
  <div className="nbd-spatial-intro"><span className="nbd-kicker">LIVE ROOM LAYOUTS · 2D AND 3D USE ONE PLAN</span><h2 id="nbd-spatial-title">Different rooms, not just different paint.</h2>
   <p>Choose your plot and compare real changes to the parking side, family hall, rear spaces and room partitions. Open any card to see <strong>that exact layout</strong> in both 2D and 3D.</p>
  </div>
  <div className="nbd-spatial-fields">
   <label>Width (ft)<input type="number" value={width} onChange={e=>setWidth(e.target.value)} min="10" max="200" step="any" inputMode="decimal"/></label>
   <label>Depth (ft)<input type="number" value={depth} onChange={e=>setDepth(e.target.value)} min="15" max="250" step="any" inputMode="decimal"/></label>
   <label>Total floors<select value={floors} onChange={e=>{setFloors(Number(e.target.value));setPreviewFloor(0)}}><option value={1}>Ground only</option><option value={2}>G + 1</option><option value={3}>G + 2</option></select></label>
   <label>Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n} BHK</option>)}</select></label>
   <label>Road side<select value={road} onChange={e=>setRoad(e.target.value as RoadSide)}>{(["N","E","S","W"] as const).map(dir=><option key={dir} value={dir}>{({N:"North",E:"East",S:"South",W:"West"} as const)[dir]}</option>)}</select></label>
   <label className="nbd-spatial-parking"><input type="checkbox" checked={parking} onChange={e=>setParking(e.target.checked)}/> Car parking</label>
   <div className="nbd-gaj-tool"><label>Plot area (square gaj / yards)<input type="number" min="1" step="any" placeholder="e.g. 120" inputMode="decimal" value={areaGaj} onChange={e=>setAreaGaj(e.target.value)}/></label><button type="button" onClick={()=>applyArea(areaGaj)}>Use this area</button></div>
  </div>
  <div className="nbd-area-presets" aria-label="Common gaj plot areas">{[120,130,140,150].map(n=><button type="button" key={n} onClick={()=>applyArea(String(n))}>{n} gaj</button>)}</div>
  <p className="nbd-spatial-area-note">Current plot: {gajFromFeet(brief.widthFt,brief.depthFt)??"—"} gaj. Width is the road frontage; gaj is area, not a fixed plot shape. 1 gaj = 9 sq ft.</p>
  {areaError&&<p role="alert" className="nbd-area-error">{areaError}</p>}
  <label className="nbd-spatial-preview-floor">Preview floor in all 24 cards <select value={previewFloor} onChange={e=>setPreviewFloor(Number(e.target.value))}>{Array.from({length:floors},(_,i)=><option key={i} value={i}>{["Ground floor","First floor","Second floor"][i]}</option>)}</select></label>
  <p className="nbd-spatial-count" role="status"><strong>{result.plans.length}</strong> distinct checked concept layouts for {Number.isFinite(brief.widthFt)?brief.widthFt:"—"} × {Number.isFinite(brief.depthFt)?brief.depthFt:"—"} ft · {floors===1?"Ground only":"G + "+(floors-1)}</p>
  {result.plans.length===0?<div className="nbd-spatial-empty"><strong>No checked layout for these constraints.</strong><p>{result.blockers.slice(0,2).join(" ")}</p><Link href="/design-studio/portfolio">Review detailed constraints →</Link></div>:
  <div className="nbd-spatial-grid">{result.plans.map((plan,i)=><article className="nbd-spatial-card" key={plan.id}>
    <div className="nbd-spatial-image"><MiniSpatialPlan plan={plan} floor={previewFloor}/><span>{["GROUND","FIRST","SECOND"][previewFloor]} FLOOR · ACTUAL PARTITIONS</span></div>
    <div className="nbd-spatial-copy">
     <h3>{planLabel(plan,i)}</h3>
     <p>{entranceType(plan)} · {plan.variant==="parking-left"?"Left":"Right"} · {floors===1?"Ground only":"G+"+(floors-1)} · {bedrooms} BHK</p>
     <Link href={"/design-studio/portfolio?"+new URLSearchParams({...baseParams,option:String(i)}).toString()+"#selected-plan-drawing"}>Explore this exact 2D + 3D →</Link>
    </div>
   </article>)}</div>}
  <p className="nbd-spatial-note">Illustrative planning models only; not measured construction drawings. Setbacks, circulation, structure and legal approvals require a licensed architect. Unsupported inputs do not generate made-up designs.</p>
 </section>;
}

