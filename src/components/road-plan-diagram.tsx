"use client";
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
 const {widthFt,roadSide}=plan.plot;
 const storeyFt=plan.walls.heightFt;
 const scale=Math.min(600/widthFt,280/(plan.floors*storeyFt));
 const x=(feet:number)=>350+(feet-widthFt/2)*scale;
 const y=(feet:number)=>355-feet*scale;
 const levels=Array.from({length:plan.floors},(_,floor)=>{
  const rooms=plan.rooms.filter(r=>r.floor===floor&&!["parking","verandah","balcony","terrace"].includes(r.kind));
  return {floor,left:Math.min(...rooms.map(r=>r.x)),right:Math.max(...rooms.map(r=>r.x+r.w))};
 });
 return <section className="nroad-elevation" aria-label="Road-side elevation derived from PlanModel">
  <svg viewBox="0 0 700 420" role="img" aria-label={`Road-side elevation for ${widthFt} ft frontage, ${plan.floors} levels`}>
   <rect width="700" height="420" fill="#e7efea"/>
   <rect x={x(0)} y={355} width={widthFt*scale} height={8} fill="#85938a"/>
   {levels.map(({floor,left,right})=><g key={floor}>
    <rect x={x(left)} y={y((floor+1)*storeyFt)} width={(right-left)*scale} height={storeyFt*scale} fill={main} stroke="#68736a"/>
    <rect x={x(left)} y={y((floor+1)*storeyFt)} width={(right-left)*scale} height={.55*scale} fill={accent}/>
   </g>)}
   {plan.rooms.filter(r=>r.kind==="balcony").map(r=><g key={r.id}>
    <rect x={x(r.x)} y={y(r.floor*storeyFt+3)} width={r.w*scale} height={3*scale} fill="#95b6ae" stroke="#526860"/>
    {plan.facade.kit==="jali-screen"&&Array.from({length:8},(_,i)=><rect key={i} x={x(r.x+(i+.5)*r.w/24)} y={y((r.floor+1)*storeyFt)} width={.26*scale} height={storeyFt*scale} fill={accent}/>)}
    {plan.facade.kit==="pergola"&&Array.from({length:6},(_,i)=><rect key={i} x={x(r.x+(i+.5)*r.w/6)} y={y((r.floor+1)*storeyFt)} width={.4*scale} height={.5*scale} fill={accent}/>)}
   </g>)}
   {[plan.gate,plan.pedestrianGate].filter(g=>g.widthFt>0).map(g=><rect key={g.xFt} x={x(g.xFt)} y={y(4)} width={g.widthFt*scale} height={4*scale} fill="#485d50" stroke="#304739"/>)}
   <text x="350" y="395" fontSize="15" textAnchor="middle" fill="#314e3e">{widthFt} ft frontage · Road {roadSide} · Concept elevation</text>
  </svg>
 </section>;
}

