"use client";
import type {GeneratedPlan} from "@/modules/studio/layout";
type Props={plan:GeneratedPlan;floor?:number;selected?:number|null;onSelect?:(index:number)=>void};
export function PlanSheet({plan,floor=0,selected=null,onSelect}:Props){
 const plate=plan.plates[floor]??plan.plates[0],w=plan.width,d=plan.depth,viewPad=Math.max(w,d)*.035;
 if(!plate)return <p>No plan available for this floor.</p>;
 const font=Math.max(160,Math.min(450,Math.min(w,d)*.032));
 return <div className="neerva-studio-plan" role="region" aria-label={"Ground-up concept floor "+(floor+1)}>
  <svg viewBox={[-viewPad,-viewPad,w+viewPad*2,d+viewPad*2].join(" ")} role="img" aria-label={"Plan showing "+plate.rooms.length+" conceptual rooms"}>
   <rect width={w} height={d} fill="#f9faf7" stroke="#51685b" strokeWidth="110"/>
   {plate.rooms.map((r,i)=><g key={i}>
    <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={selected===i?"#d8e9d8":["Balcony","Courtyard"].includes(r.name)?"#dfece4":"#f5ede0"} stroke={selected===i?"#b35b3c":"#46564b"} strokeWidth="80" />
    <text x={r.x+r.w/2} y={r.y+r.h/2-font*.22} textAnchor="middle" fill="#233f34" fontSize={font} fontWeight="600">{r.name}</text>
    <text x={r.x+r.w/2} y={r.y+r.h/2+font*.95} textAnchor="middle" fill="#5a7060" fontSize={font*.72}>{(r.w/1000).toFixed(1)} × {(r.h/1000).toFixed(1)} m</text>
    {onSelect&&<rect role="button" tabIndex={0} aria-label={"Select "+r.name+" "+(i+1)} x={r.x} y={r.y} width={r.w} height={r.h} fill="transparent" onClick={()=>onSelect(i)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect(i)}}}/>}
   </g>)}
   <text x={w/2} y={d-viewPad*.22} fontSize={font*.8} textAnchor="middle" fill="#33483d">STREET / CONCEPT ORIENTATION</text>
  </svg>
  <p style={{fontSize:12,lineHeight:1.6}}>All dimensions are indicative. This concept has not been checked for setbacks, building permits or structural safety.</p>
 </div>;
}
