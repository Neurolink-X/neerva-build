"use client";
import type {Opening,PlanModel,Room} from "@/modules/studio/plan-model";
import {roadPoint,roadRect,roadSegment,siteDimensions} from "@/modules/studio/plan-coordinate";
import {siteOutline} from "@/modules/studio/site-shape";
const shortLabels:Record<string,string>={parking:"Car parking",verandah:"Verandah",living:"Living room",dining:"Dining / family",kitchen:"Kitchen",bath:"Bath / WC",stairs:"Stairs",corridor:"Passage",utility:"Utility",balcony:"Balcony",terrace:"Terrace",lounge:"Lounge"};
const colors:Record<string,string>={parking:"#d9e5e1",verandah:"#edebd5",living:"#dceee1",dining:"#e6edd6",kitchen:"#f2e5d2",bedroom:"#e7e8f4",bath:"#d5e8ed",stairs:"#dedbd6",corridor:"#f6f3e7",utility:"#eee1d7",balcony:"#dcece2",terrace:"#f0eee8",lounge:"#e2eed5"};
function ends(o:Opening,r:Room){
 if(o.side==="front")return [[r.x+o.atFt,r.y],[r.x+o.atFt+o.widthFt,r.y]];
 if(o.side==="rear")return [[r.x+o.atFt,r.y+r.d],[r.x+o.atFt+o.widthFt,r.y+r.d]];
 if(o.side==="left")return [[r.x,r.y+o.atFt],[r.x,r.y+o.atFt+o.widthFt]];
 return [[r.x+r.w,r.y+o.atFt],[r.x+r.w,r.y+o.atFt+o.widthFt]];
}
export function OrientedPlanDrawing({plan,floor=0}:{plan:PlanModel;floor?:number}){
 const {widthFt:w,depthFt:d,roadSide:side}=plan.plot,dim=siteDimensions(w,d,side);
 const rooms=plan.rooms.filter(r=>r.floor===floor),ids=new Set(rooms.map(r=>r.id));
 const point=(x:number,y:number)=>roadPoint({x,y},w,d,side);
 const boundary=siteOutline(w,d,plan.plot.siteShape??{kind:"rectangle"}).map(p=>point(p.x,p.y));
 const road=roadSegment(w,d,side);
 const mid={x:(road.start.x+road.end.x)/2,y:(road.start.y+road.end.y)/2};
 const gates=(g:{xFt:number;widthFt:number})=>[point(g.xFt,0),point(g.xFt+g.widthFt,0)];
 const roadLabel={x:mid.x+(side==="E"?2.6:side==="W"?-2.6:0),y:mid.y+(side==="N"?-1.7:side==="S"?2.2:0)};
 return <section className="nroad-diagram" aria-label="Single-source geographical floor plan" data-plan-id={plan.id} data-selected-floor={floor} data-room-count={rooms.length} data-bedroom-count={rooms.filter(r=>r.kind==="bedroom").length} data-total-bedrooms={plan.rooms.filter(r=>r.kind==="bedroom").length}>
  <svg role="img" aria-label={`Road on ${side} side. Floor ${floor+1} with matching doors and rooms.`} viewBox={[-4,-4,dim.w+8,dim.d+8].join(" ")}>
   <rect width={dim.w} height={dim.d} fill="#f1eee6" stroke="#b0b0a7" strokeDasharray=".6 .3" strokeWidth=".15"/>
   <polygon points={boundary.map(p=>p.x+","+p.y).join(" ")} fill="#fdfcf7" stroke="#516552" strokeWidth=".4"/>
   <line x1={road.start.x} y1={road.start.y} x2={road.end.x} y2={road.end.y} stroke="#a96743" strokeWidth="1.25"/>
   <text x={roadLabel.x} y={roadLabel.y} textAnchor="middle" fontSize="1.1" fontWeight="800" fill="#8b4a2e">ROAD · {side}</text>
   <g><path d={`M ${dim.w-1.5} 3.5 V 1.6 l -.7 .9 M ${dim.w-1.5} 1.6 l .7 .9`} fill="none" stroke="#284735" strokeWidth=".3"/>
    <text x={dim.w-1.5} y=".9" textAnchor="middle" fontSize="1" fontWeight="800">N</text></g>
   {rooms.map(r=>{const rect=roadRect(r,w,d,side),cx=rect.x+rect.w/2,cy=rect.y+rect.d/2,small=Math.min(rect.w,rect.d)<5,label=r.kind==="bedroom"?r.label:(shortLabels[r.kind]??r.label),font=Math.min(small?.65:1.07,rect.w/(Math.max(label.length,1)*.64),rect.d*.20);
    return <g key={r.id} data-room-id={r.id} data-room-kind={r.kind}>
     <title>{r.label}</title>
     <rect x={rect.x} y={rect.y} width={rect.w} height={rect.d} fill={colors[r.kind]??"#ecece6"} stroke="#4e6854" strokeWidth=".20"/>
     <text x={cx} y={cy-(small?.12:.28)} textAnchor="middle" fill="#253f33" fontWeight="800" fontSize={font} data-room-label="true">{label.toUpperCase()}</text>
     <text x={cx} y={cy+(small?.6:.95)} textAnchor="middle" fill="#526955" fontSize={Math.min(small?.52:.84,rect.w*.1,rect.d*.18)}>{r.w.toFixed(1)} × {r.d.toFixed(1)} ft</text>
    </g>;
   })}
   {plan.openings.filter(o=>ids.has(o.roomId)).map(o=>{const r=rooms.find(r=>r.id===o.roomId)!;
    const e=ends(o,r).map(([x,y])=>point(x,y));
    return <g key={o.id} aria-label={o.kind==="door"?"Door opening":"Window opening"}>
      <line x1={e[0].x} y1={e[0].y} x2={e[1].x} y2={e[1].y} stroke={o.kind==="door"?"#a65f3f":"#287e9f"} strokeWidth={o.kind==="door"?".6":".45"}/>
      {o.kind==="door"?<circle cx={e[0].x} cy={e[0].y} r=".15" fill="#a65f3f"/>:<circle cx={(e[0].x+e[1].x)/2} cy={(e[0].y+e[1].y)/2} r=".16" stroke="#287e9f" fill="#fff"/>}
    </g>;
   })}
   {floor===0&&[plan.gate,plan.pedestrianGate].map((g,i)=>{const [a,b]=gates(g);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={i===0?"#a86643":"#23764d"} strokeWidth=".9"/>})}
  </svg>
  <div className="nroad-legend"><span>Road {side} · {plan.plot.siteShape&&plan.plot.siteShape.kind!=="rectangle"?"measured L-site outline, conservative no-build strip":"true compass orientation"}</span><span>{plan.parking?"Brown: doors & car gate":"Brown: doors"}</span><span>Blue: windows</span><span>Green: pedestrian gate</span></div>
  <details><summary>Room dimensions & opening list</summary><ul>{rooms.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.w.toFixed(1)} × {r.d.toFixed(1)} ft · {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="door").length} doors / {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="window").length} windows</li>)}</ul></details>
  <p className="nroad-small">Concept only. Verify with a licensed architect/engineer and local authority approval. Stairs, turning and legal setbacks remain unchecked.</p>
 </section>;
}
