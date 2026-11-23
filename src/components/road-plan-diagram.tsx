"use client";
import type {PlanModel,Room,Opening,Side} from "@/modules/studio/plan-model";
const labels:Record<string,string>={parking:"PARKING",verandah:"VERANDAH",living:"LIVING",dining:"DINING",kitchen:"KITCHEN",bedroom:"BEDROOM",bath:"BATH",stairs:"STAIRS",corridor:"PASSAGE",utility:"UTILITY",balcony:"BALCONY",lounge:"LOUNGE",terrace:"TERRACE"};
const fills:Record<string,string>={parking:"#d0ded9",verandah:"#e6e4cd",living:"#d9ebe0",dining:"#e3e9d4",kitchen:"#f4e7d2",bedroom:"#e5e7f3",bath:"#d4e5ec",stairs:"#dcd9d3",corridor:"#f5f2e7",utility:"#ebe0d1",balcony:"#dbe6dd",lounge:"#e8ecd5",terrace:"#f0efe9"};
function lineFor(o:Opening,r:Room){
 const k=o.atFt,wd=o.widthFt;
 switch(o.side){
  case "front":return {x1:r.x+k,y1:r.y,x2:r.x+k+wd,y2:r.y};
  case "rear":return {x1:r.x+k,y1:r.y+r.d,x2:r.x+k+wd,y2:r.y+r.d};
  case "left":return {x1:r.x,y1:r.y+k,x2:r.x,y2:r.y+k+wd};
  case "right":return {x1:r.x+r.w,y1:r.y+k,x2:r.x+r.w,y2:r.y+k+wd};
 }
}
export function RoadPlanDiagram({plan,floor=0}:{plan:PlanModel;floor?:number}){
 const rs=plan.rooms.filter(r=>r.floor===floor),viewWidth=plan.plot.widthFt,viewDepth=plan.plot.depthFt;
 return <section className="nroad-diagram" aria-label={"PlanModel floor "+(floor+1)}>
  <svg role="img" aria-label={`Road at top: ${plan.plot.roadSide} side. Floor ${floor+1} rooms with actual dimensions, doors and windows.`}
    viewBox={[-2,-6,viewWidth+4,viewDepth+11].join(" ")}>
   <rect x={0} y={0} width={viewWidth} height={viewDepth} fill="#fafaf7" stroke="#516a5b" strokeWidth=".3"/>
   <path d={`M -2 -3 H ${viewWidth+2}`} stroke="#606e69" strokeWidth="2"/>
   <text x={viewWidth/2} y={-4.2} textAnchor="middle" fontSize="1.1" fontWeight="800" fill="#254b39">ROAD · {plan.plot.roadSide} (ENTRY SIDE)</text>
   {rs.map(r=><g key={r.id}>
    <rect x={r.x} y={r.y} width={r.w} height={r.d} fill={fills[r.kind]??"#f1f1f1"} stroke="#43584c" strokeWidth=".20"/>
    <text x={r.x+r.w/2} y={r.y+r.d/2-.15} fontSize={Math.min(1.05,r.w*.1,r.d*.20)} textAnchor="middle" fontWeight="750" fill="#234234">
     {labels[r.kind]??r.label.toUpperCase()}
    </text>
    <text x={r.x+r.w/2} y={r.y+r.d/2+1.05} fontSize={Math.min(.9,r.w*.095,r.d*.16)} textAnchor="middle" fill="#486455">{r.w.toFixed(1)} × {r.d.toFixed(1)} ft</text>
   </g>)}
   {plan.openings.filter(o=>rs.some(r=>r.id===o.roomId)).map(o=>{
    const r=rs.find(r=>r.id===o.roomId)!;const l=lineFor(o,r);
    return <g key={o.id}><line {...l} stroke={o.kind==="door"?"#b66b42":"#3186a0"} strokeWidth={o.kind==="door"?".65":".38"}/></g>;
   })}
   {floor===0&&<g><line x1={plan.gate.xFt} y1="0" x2={plan.gate.xFt+plan.gate.widthFt} y2="0" stroke="#ba7748" strokeWidth=".85"/><text x={plan.gate.xFt+plan.gate.widthFt/2} y={-0.65} fontSize=".8" fontWeight="800" textAnchor="middle">CAR GATE</text></g>}
  </svg>
  <div className="nroad-legend"><span><i style={{background:"#b66b42"}}/>Door</span><span><i style={{background:"#3186a0"}}/>Window</span><span><i style={{background:"#d0ded9"}}/>Parking</span></div>
  <details><summary>Room dimensions and access details</summary>
   <ul>{rs.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.w.toFixed(1)} × {r.d.toFixed(1)} ft · {Math.round(r.w*r.d)} sq ft · {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="door").length} door(s), {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="window").length} window(s)</li>)}</ul>
  </details>
  <p className="nroad-small">Road side is at the top in this local coordinate view, whichever compass direction you select. Diagram is not scaled for print or construction use.</p>
 </section>;
}
export function RoadElevation({plan,main,accent}:{plan:PlanModel;main:string;accent:string}){
 const front=plan.rooms.filter(r=>r.floor===0&&r.y<=16);
 const w=plan.plot.widthFt,d=plan.floors,scale=600/w,left=50,roofY=d===1?147:65,storey=136,bottom=roofY+storey*d;
 const g=plan.gate;
 return <section className="nroad-elevation" aria-label="Road-side elevation derived from PlanModel">
  <svg viewBox="0 0 700 460" role="img" aria-label={`Illustrative road-side elevation for ${w} ft frontage with ${d} levels and gate located ${g.xFt} ft along the road`}>
   <rect x="0" y="0" width="700" height="460" fill="#e7efea"/>
   <rect x={left} y={roofY} width={600} height={bottom-roofY} fill={main} stroke="#5e655d" strokeWidth="4"/>
   {d===2&&<rect x={left} y={roofY} width={600} height={storey} fill={accent} fillOpacity=".2"/>}
   {d===2&&<rect x={left} y={roofY-30} width={600} height="30" fill={accent} stroke="#7e796c" strokeWidth="3"/>}
   <rect x={left-8} y={bottom-52} width={616} height="72" fill="#677e6e" stroke="#3f5e50" strokeWidth="4"/>
   <rect x={left+g.xFt*scale} y={bottom-52} width={g.widthFt*scale} height="72" fill="#44524d" stroke="#22382f" strokeWidth="4"/>
   {Array.from({length:8},(_,i)=><line key={i} x1={left+g.xFt*scale+i*g.widthFt*scale/8} x2={left+g.xFt*scale+i*g.widthFt*scale/8} y1={bottom-50} y2={bottom+18} stroke="#b9c7bb" strokeWidth="3"/>)}
   {d===2&&<g><rect x={left+5} y={roofY+95} width={590} height="32" fill="#8bb8af" fillOpacity=".65" stroke="#4c6760" strokeWidth="4"/></g>}
   <rect x={left} y={bottom+22} width="600" height="10" fill="#969f91"/>
   <text x="350" y="420" fontSize="15" textAnchor="middle" fill="#314e3e">ROAD-SIDE FRONT · {plan.plot.roadSide} · CONCEPT ONLY</text>
   <text x="350" y="442" fontSize="11" textAnchor="middle" fill="#516554">Not a site photograph, structural drawing or verified facade</text>
   <title>{front.length} front-zone spaces; exact wall openings are represented in the plan and 3D</title>
  </svg>
 </section>;
}
