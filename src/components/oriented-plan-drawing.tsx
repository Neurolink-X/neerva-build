"use client";
import type {FinishScheme} from "@/modules/studio/finish-model";
import {useMemo,useState} from "react";
import {planFurniture} from "@/modules/studio/furniture";
import {residentialStairStudies,stairFloorPatches} from "@/modules/studio/stair-study";
import {isOtsRoom,type Opening,type PlanModel,type Room} from "@/modules/studio/plan-model";
import {roadPoint,roadRect,roadSegment,siteDimensions} from "@/modules/studio/plan-coordinate";
import {siteOutline} from "@/modules/studio/site-shape";
import {windowExposure} from "@/modules/studio/ventilation";
const shortLabels:Record<string,string>={parking:"Car parking",verandah:"Verandah",living:"Living room",dining:"Dining / family",kitchen:"Kitchen",bath:"Bath / WC",stairs:"Stairs",corridor:"Passage",utility:"Utility",balcony:"Balcony",terrace:"Terrace",lounge:"Lounge"};
const colors:Record<string,string>={parking:"#d9e5e1",verandah:"#edebd5",living:"#dceee1",dining:"#e6edd6",kitchen:"#f2e5d2",bedroom:"#e7e8f4",bath:"#d5e8ed",stairs:"#dedbd6",corridor:"#f6f3e7",utility:"#eee1d7",balcony:"#dcece2",terrace:"#f0eee8",lounge:"#e2eed5"};
function ends(o:Opening,r:Room){
 if(o.side==="front")return [[r.x+o.atFt,r.y],[r.x+o.atFt+o.widthFt,r.y]];
 if(o.side==="rear")return [[r.x+o.atFt,r.y+r.d],[r.x+o.atFt+o.widthFt,r.y+r.d]];
 if(o.side==="left")return [[r.x,r.y+o.atFt],[r.x,r.y+o.atFt+o.widthFt]];
 return [[r.x+r.w,r.y+o.atFt],[r.x+r.w,r.y+o.atFt+o.widthFt]];
}
export function OrientedPlanDrawing({plan,floor=0,scheme}:{plan:PlanModel;floor?:number;scheme?:FinishScheme}){
 const [showFurniture,setShowFurniture]=useState(true),[showVentilation,setShowVentilation]=useState(true);
 const furniture=useMemo(()=>showFurniture?planFurniture(plan):[],[plan,showFurniture]);
 const stairs=useMemo(()=>residentialStairStudies(plan),[plan]);
 const {widthFt:w,depthFt:d,roadSide:side}=plan.plot,dim=siteDimensions(w,d,side);
 const rooms=plan.rooms.filter(r=>r.floor===floor),ids=new Set(rooms.map(r=>r.id));
 const seenOpenings=new Set<string>();
 const openings=plan.openings.filter(o=>ids.has(o.roomId)).filter(o=>{const r=rooms.find(r=>r.id===o.roomId)!;const signature=JSON.stringify([o.kind,ends(o,r).map(pt=>pt.map(v=>Math.round(v*100000))).sort()]);if(seenOpenings.has(signature))return false;seenOpenings.add(signature);return true;});
 const point=(x:number,y:number)=>roadPoint({x,y},w,d,side);
 const boundary=siteOutline(w,d,plan.plot.siteShape??{kind:"rectangle"}).map(p=>point(p.x,p.y));
 const road=roadSegment(w,d,side);
 const mid={x:(road.start.x+road.end.x)/2,y:(road.start.y+road.end.y)/2};
 const gates=(g:{xFt:number;widthFt:number})=>[point(g.xFt,0),point(g.xFt+g.widthFt,0)];
 const roadLabel={x:mid.x+(side==="E"?2.6:side==="W"?-2.6:0),y:mid.y+(side==="N"?-1.7:side==="S"?2.2:0)};
 return <section className="nroad-diagram" aria-label="Single-source geographical floor plan" data-plan-id={plan.id} data-selected-floor={floor} data-room-count={rooms.length} data-bedroom-count={rooms.filter(r=>r.kind==="bedroom").length} data-total-bedrooms={plan.rooms.filter(r=>r.kind==="bedroom").length} data-ventilation-windows={plan.openings.filter(o=>o.kind==="window"&&ids.has(o.roomId)).length} data-roof-jaal={rooms.some(isOtsRoom)?"modeled":"not-modeled"}>
  <label className="nroad-small"><input type="checkbox" checked={showFurniture} onChange={e=>setShowFurniture(e.target.checked)}/> Indicative furniture layout</label>
  <label className="nroad-small"><input type="checkbox" checked={showVentilation} onChange={e=>setShowVentilation(e.target.checked)}/> Highlight ventilation openings</label>
  <svg role="img" aria-label={`Road on ${side} side. Floor ${floor+1} with matching doors and rooms.`} viewBox={[-5,-5,dim.w+10,dim.d+10].join(" ")}>
   <rect width={dim.w} height={dim.d} fill="#f1eee6" stroke="#b0b0a7" strokeDasharray=".6 .3" strokeWidth=".15"/>
   <polygon points={boundary.map(p=>p.x+","+p.y).join(" ")} fill="#fdfcf7" stroke="#516552" strokeWidth=".4"/>
   <line x1={road.start.x} y1={road.start.y} x2={road.end.x} y2={road.end.y} stroke="#a96743" strokeWidth="1.25"/>
   <text x={roadLabel.x} y={roadLabel.y} textAnchor="middle" fontSize="1.1" fontWeight="800" fill="#8b4a2e">ROAD · {side}</text>
   <g><path d={`M ${dim.w-1.5} 3.5 V 1.6 l -.7 .9 M ${dim.w-1.5} 1.6 l .7 .9`} fill="none" stroke="#284735" strokeWidth=".3"/>
    <text x={dim.w-1.5} y=".9" textAnchor="middle" fontSize="1" fontWeight="800">N</text></g>
   {([["left",plan.setbacks.leftFt,plan.setbacks.leftFt/2,d/2],["right",plan.setbacks.rightFt,w-plan.setbacks.rightFt/2,d/2]] as const).filter(([,ft])=>ft>=2).map(([edge,ft,x,y])=>{const p=point(x,y);return <text key={edge} x={p.x} y={p.y} transform={`rotate(${side==="N"||side==="S"?-90:0} ${p.x} ${p.y})`} textAnchor="middle" fontSize=".85" fill="#526955">{ft.toFixed(1)} ft open strip</text>})}
   {rooms.map(r=>{const rect=roadRect(r,w,d,side),cx=rect.x+rect.w/2,cy=rect.y+rect.d/2,small=Math.min(rect.w,rect.d)<5,label=r.kind==="stairs"&&stairs.unresolved.includes(r.id)?"Stair reserve":isOtsRoom(r)?"OTS / roof jaal":r.kind==="bedroom"?r.label:(shortLabels[r.kind]??r.label),font=Math.min(small?.65:1.07,rect.w/(Math.max(label.length,1)*.64),rect.d*.20);
    return <g key={r.id} data-room-id={r.id} data-room-kind={r.kind}>
     <title>{r.label}</title>
     <rect x={rect.x} y={rect.y} width={rect.w} height={rect.d} fill={(scheme?.planId===plan.id?scheme.rooms[r.id]?.floor:undefined)??(isOtsRoom(r)?"#c6e9e4":colors[r.kind])??"#ecece6"} stroke="#4e6854" strokeWidth=".20"/>
     {isOtsRoom(r)&&<g stroke="#287a73" strokeWidth=".13" strokeDasharray=".35 .2"><path d={`M${rect.x} ${rect.y} L${rect.x+rect.w} ${rect.y+rect.d} M${rect.x+rect.w} ${rect.y} L${rect.x} ${rect.y+rect.d}`}/><title>Open vertical void; roof grille above, not a floor</title></g>}
     {r.kind==="stairs"&&stairs.studies.some(s=>s.upperRoomId===r.id)&&<><rect x={rect.x} y={rect.y} width={rect.w} height={rect.d} fill="#faf9f6" stroke="#826b50" strokeDasharray=".3 .2" strokeWidth=".12"/>{stairFloorPatches(r,stairs.studies).map((patch,i)=>{const b=roadRect(patch,w,d,side);return <rect key={i} x={b.x} y={b.y} width={b.w} height={b.d} fill="#a9c4ab" stroke="#516b52" strokeWidth=".12"><title>Landing at selected floor</title></rect>})}</>}
     {showFurniture&&furniture.filter(p=>p.roomId===r.id).map(p=>{const b=roadRect(p,w,d,side);return <g key={p.id} data-furniture-id={p.id}><rect x={b.x} y={b.y} width={b.w} height={b.d} rx=".12" fill="#a38970" fillOpacity=".25" stroke="#806b58" strokeWidth=".09"/><title>{`${p.kind} · illustrative placement`}</title></g>})}
     <text x={cx} y={cy-(small?.12:.28)} textAnchor="middle" fill="#253f33" fontWeight="800" fontSize={font} data-room-label="true">{label.toUpperCase()}</text>
     <text x={cx} y={cy+(small?.6:.95)} textAnchor="middle" fill="#526955" fontSize={Math.min(small?.52:.84,rect.w*.1,rect.d*.18)}>{r.w.toFixed(1)} × {r.d.toFixed(1)} ft</text>
    </g>;
   })}
   {stairs.studies.filter(s=>s.floor===floor).flatMap(s=>s.steps.map((step,i)=>{const r=roadRect(step,w,d,side);return <rect key={s.roomId+"-tread-"+i} x={r.x} y={r.y} width={r.w} height={r.d} fill="#d6c7ac" stroke="#826b50" strokeWidth=".09"><title>{`Stair tread ${i+1}`}</title></rect>}))}
   {openings.map(o=>{const r=rooms.find(r=>r.id===o.roomId)!;
    const e=ends(o,r).map(([x,y])=>point(x,y));
    const windowColor=showVentilation?(windowExposure(plan,r,o)==="review"?"#b06b16":"#18764c"):"#287e9f";
    return <g key={o.id} aria-label={o.kind==="door"?"Door opening":"Window opening"}>
      <line x1={e[0].x} y1={e[0].y} x2={e[1].x} y2={e[1].y} stroke={o.kind==="door"?"#a65f3f":windowColor} strokeWidth={o.kind==="door"?".6":".45"}/>
      {o.kind==="door"?<circle cx={e[0].x} cy={e[0].y} r=".15" fill="#a65f3f"/>:<circle cx={(e[0].x+e[1].x)/2} cy={(e[0].y+e[1].y)/2} r=".16" stroke={windowColor} fill="#fff"/>}
    </g>;
   })}
   <g stroke="#64736a" strokeWidth=".12" fill="none"><path d={`M0 ${dim.d+2.4} H${dim.w} M0 ${dim.d+1.8} V${dim.d+3} M${dim.w} ${dim.d+1.8} V${dim.d+3}`}/><path d={`M-3 0 V${dim.d} M-3.6 0 H-2.4 M-3.6 ${dim.d} H-2.4`}/></g>
   <text x={dim.w/2} y={dim.d+4} textAnchor="middle" fontSize="1" fill="#384f41">{dim.w.toFixed(1)} ft</text><text x="-4" y={dim.d/2} transform={`rotate(-90 -4 ${dim.d/2})`} textAnchor="middle" fontSize="1" fill="#384f41">{dim.d.toFixed(1)} ft</text>
   {floor===0&&[plan.gate,plan.pedestrianGate].filter(g=>g.widthFt>0).map((g,i)=>{const [a,b]=gates(g);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={g===plan.gate?"#a86643":"#23764d"} strokeWidth=".9"/>})}
  </svg>
  <div className="nroad-legend"><span>Road {side} · {plan.plot.siteShape&&plan.plot.siteShape.kind!=="rectangle"?"measured L-site outline, conservative no-build strip":"true compass orientation"}</span><span>{plan.parking?"Brown: doors & car gate":"Brown: doors"}</span><span>{showVentilation?"Green windows: exposed · Amber: review":"Blue: windows"}</span><span>Green: pedestrian gate</span></div>
  <p className="nroad-small">Open margins are unbuilt concept space, not extra rooms or confirmed legal setbacks. Front {plan.setbacks.frontFt.toFixed(1)} ft · rear {plan.setbacks.rearFt.toFixed(1)} ft · left {plan.setbacks.leftFt.toFixed(1)} ft · right {plan.setbacks.rightFt.toFixed(1)} ft.</p>
  <details><summary>Room dimensions & opening list</summary><ul>{rooms.map(r=><li key={r.id}><strong>{r.label}</strong> — {r.w.toFixed(1)} × {r.d.toFixed(1)} ft · {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="door").length} doors / {plan.openings.filter(o=>o.roomId===r.id&&o.kind==="window").length} windows</li>)}</ul></details>
  {rooms.some(r=>stairs.unresolved.includes(r.id))&&<p className="nroad-small" role="status"><strong>Stair reserve needs design:</strong> No supported flight and aligned landings were established. Stair layout and headroom need architectural review.</p>}<p className="nroad-small">Furniture is indicative; missing items did not fit the clearance check. Concept only. Verify with a licensed architect/engineer and local authority approval. Stair structural sizing, railings and legal setbacks remain unverified.</p>
 </section>;
}
