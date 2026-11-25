"use client";
import {useId} from "react";
import type {PlanModel,Room,Opening} from "@/modules/studio/plan-model";
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
   {floor===0&&<g>
    {plan.parking&&<g><line x1={plan.gate.xFt} y1="0" x2={plan.gate.xFt+plan.gate.widthFt} y2="0" stroke="#ba7748" strokeWidth=".85"/>
    <text x={plan.gate.xFt+plan.gate.widthFt/2} y={-0.65} fontSize=".8" fontWeight="800" textAnchor="middle">CAR GATE</text></g>}
    <line x1={plan.pedestrianGate.xFt} y1="0" x2={plan.pedestrianGate.xFt+plan.pedestrianGate.widthFt} y2="0" stroke="#2c7657" strokeWidth=".8"/>
    <text x={plan.pedestrianGate.xFt+plan.pedestrianGate.widthFt/2} y={-0.65} fontSize=".7" fontWeight="800" textAnchor="middle">ENTRY</text>
   </g>}
  </svg>
  <div className="nroad-legend"><span><i style={{background:"#b66b42"}}/>Door</span><span><i style={{background:"#3186a0"}}/>Window</span><span><i style={{background:"#d0ded9"}}/>Parking</span></div>
  <details><summary>Room dimensions and access details</summary>
   <ul>{rs.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.w.toFixed(1)} × {r.d.toFixed(1)} ft · {Math.round(r.w*r.d)} sq ft · {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="door").length} door(s), {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="window").length} window(s)</li>)}</ul>
  </details>
  <p className="nroad-small">Road side is at the top in this local coordinate view, whichever compass direction you select. Diagram is not scaled for print or construction use.</p>
 </section>;
}
export function RoadElevation({plan,main,accent}:{plan:PlanModel;main:string;accent:string}){
 const id=useId().replace(/:/g,"");
 const {widthFt,roadSide}=plan.plot,storeyFt=plan.walls.heightFt;
 const scale=Math.min(600/widthFt,285/(plan.floors*storeyFt));
 const x=(feet:number)=>350+(feet-widthFt/2)*scale;
 const y=(feet:number)=>355-feet*scale;
 const solid=plan.rooms.filter(r=>!["parking","verandah","balcony","terrace"].includes(r.kind));
 // Project only real room spans, ordered from the rear to the road. No invented
 // windows or solid infill across an open car bay.
 const frontRooms=[...solid].sort((a,b)=>b.y-a.y);
 const openings=plan.openings.flatMap(o=>{
  const r=solid.find(r=>r.id===o.roomId);
  if(!r||o.side!=="front"||o.connectsTo)return [];
  const a=r.x+o.atFt,b=a+o.widthFt;
  if(solid.some(s=>s.floor===r.floor&&s.y<r.y-.01&&s.x<b-.01&&s.x+s.w>a+.01))return [];
  return [{o,r,a}];
 });
 const gates=[plan.gate,plan.pedestrianGate].filter(g=>g.widthFt>0);
 return <section className="nroad-elevation" aria-label="Road-side elevation derived from PlanModel">
  <svg viewBox="0 0 700 420" role="img" aria-label={`Road-side elevation for ${widthFt} ft frontage, ${plan.floors} levels`}>
   <defs>
    <linearGradient id={id+"sky"} x2="0" y2="1"><stop stopColor="#cbdedc"/><stop offset="1" stopColor="#f6f4e9"/></linearGradient>
    <linearGradient id={id+"wall"} x2=".9" y2="1"><stop stopColor={main}/><stop offset=".65" stopColor={main}/><stop offset="1" stopColor={main}/></linearGradient>
    <linearGradient id={id+"glass"} x2="1" y2="1"><stop stopColor="#bfdbde"/><stop offset=".55" stopColor="#73949e"/><stop offset="1" stopColor="#38555c"/></linearGradient>
    <linearGradient id={id+"ground"} x2="0" y2="1"><stop stopColor="#d8d4c5"/><stop offset="1" stopColor="#8e9189"/></linearGradient>
   </defs>
   <rect width="700" height="420" fill={`url(#${id}sky)`}/>
   <rect y="355" width="700" height="65" fill={`url(#${id}ground)`}/>
   <path d="M0 371H700" stroke="#f6f4eb" strokeWidth="2"/>
   <rect x={x(0)} y={355} width={widthFt*scale} height="8" fill="#676f67"/>
   {frontRooms.map(r=><rect key={r.id} x={x(r.x)} y={y((r.floor+1)*storeyFt)} width={r.w*scale} height={storeyFt*scale} fill={`url(#${id}wall)`}/>)}
   {Array.from({length:plan.floors},(_,floor)=>{
    const rs=solid.filter(r=>r.floor===floor);
    return rs.map(r=><g key={r.id}><rect x={x(r.x)} y={y((floor+1)*storeyFt)} width={r.w*scale} height={.35*scale} fill={accent}/><rect x={x(r.x)} y={y((floor+1)*storeyFt)+.35*scale} width={r.w*scale} height={Math.max(1,.09*scale)} fill="#24352b" opacity=".25"/></g>);
   })}
   {openings.map(({o,r,a})=>{
    const w=o.widthFt*scale,h=o.heightFt*scale,left=x(a),top=y(r.floor*storeyFt+o.sillFt+o.heightFt),frame=Math.min(3,w*.08,h*.08);
    return <g key={o.id} data-opening-id={o.id}><rect x={left} y={top} width={w} height={h} fill={o.kind==="window"?`url(#${id}glass)`:"#594a3e"} stroke="#38423c" strokeWidth={frame}/>{o.kind==="window"&&<><path d={`M${left+w/2} ${top}v${h}`} stroke="#e8eee8" strokeWidth={frame}/><path d={`M${left+frame} ${top+h*.15}l${w*.35} ${-h*.12}`} stroke="#fff" opacity=".35" strokeWidth="2"/></>}</g>;
   })}
   {plan.rooms.filter(r=>r.kind==="balcony").map(r=><g key={r.id}>
    <rect x={x(r.x)} y={y(r.floor*storeyFt+3)} width={r.w*scale} height={3*scale} fill={`url(#${id}glass)`} stroke="#526860"/>
    <rect x={x(r.x)} y={y(r.floor*storeyFt+3)} width={r.w*scale} height={Math.max(2,.12*scale)} fill="#344b43"/>
    {Array.from({length:4},(_,k)=><line key={k} x1={x(r.x+r.w*k/3)} x2={x(r.x+r.w*k/3)} y1={y(r.floor*storeyFt+3)} y2={y(r.floor*storeyFt)} stroke="#536c64" strokeWidth="1.5"/>)}
    {plan.facade.kit==="jali-screen"&&Array.from({length:8},(_,k)=><rect key={k} x={x(r.x+(k+.5)*r.w/24)} y={y((r.floor+1)*storeyFt)} width={.26*scale} height={storeyFt*scale} fill={accent}/>)}
    {plan.facade.kit==="pergola"&&Array.from({length:6},(_,k)=><rect key={k} x={x(r.x+(k+.5)*r.w/6)} y={y((r.floor+1)*storeyFt)} width={.4*scale} height={.5*scale} fill={accent}/>)}
   </g>)}
   {gates.map(g=><g key={g.xFt}><rect x={x(g.xFt)} y={y(4)} width={g.widthFt*scale} height={4*scale} fill="#536359" stroke="#303f35"/>{Array.from({length:7},(_,k)=><line key={k} x1={x(g.xFt+g.widthFt*(k+.5)/7)} x2={x(g.xFt+g.widthFt*(k+.5)/7)} y1={y(3.8)} y2={y(.2)} stroke="#a7b2a6" strokeWidth="1.5"/>)}</g>)}
   <rect x="0" y="384" width="700" height="36" fill="#f4f5ef"/>
   <text x="350" y="407" fontSize="15" textAnchor="middle" fill="#314e3e">{widthFt} ft frontage · Road {roadSide} · Concept elevation</text>
  </svg>
  <p className="nroad-small">Plan-derived architectural illustration. Actual openings and gate positions are retained; materials and lighting are illustrative, not a photoreal render.</p>
 </section>;
}
