import type {PlanModel,Room} from "./plan-model.ts";
import {isEnclosedRoom} from "./plan-surfaces.ts";
export type FrontPanel={floor:number;x:number;w:number;y:number;roomId:string;kind:Room["kind"]};
export type FacadeAccent={x:number;y:number;z:number;w:number;h:number;d:number;floor:number;kind:"band"|"pier"|"lintel"};
const EPS=1e-5;
export function frontagePanels(plan:PlanModel):FrontPanel[]{
 const out:FrontPanel[]=[];
 for(let floor=0;floor<plan.floors;floor++){
  const rooms=plan.rooms.filter(r=>r.floor===floor&&isEnclosedRoom(r));
  const cuts=[...new Set(rooms.flatMap(r=>[r.x,r.x+r.w]))].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++){
   const x=cuts[i-1],w=cuts[i]-x;if(w<EPS)continue;
   const r=rooms.filter(r=>r.x<=x+EPS&&r.x+r.w>=x+w-EPS).sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id))[0];
   if(!r)continue;
   const last=out.at(-1);
   if(last&&last.floor===floor&&last.roomId===r.id&&Math.abs(last.x+last.w-x)<EPS)last.w+=w;
   else out.push({floor,x,w,y:r.y,roomId:r.id,kind:r.kind});
  }
 }
 return out;
}
export function frontageOpenings(plan:PlanModel,panels=frontagePanels(plan)){
 return plan.openings.flatMap(o=>{
  const r=plan.rooms.find(r=>r.id===o.roomId);
  if(!r||o.side!=="front")return [];
  const start=r.x+o.atFt,end=start+o.widthFt;
  const visible=panels.filter(p=>p.floor===r.floor&&p.roomId===r.id&&Math.min(p.x+p.w,end)>Math.max(p.x,start)+EPS);
  return visible.map(p=>({o,r,a:Math.max(p.x,start),w:Math.min(p.x+p.w,end)-Math.max(p.x,start)}));
 });
}
/** Finish-only elements on real wall surfaces. No fake windows, balconies or
 * structural projections. Bands remain above existing openings. Piers use
 * only the solid lateral strips between actual openings. */
export function facadeAccents(plan:PlanModel,panels=frontagePanels(plan)):FacadeAccent[]{
 const out:FacadeAccent[]=[],height=plan.walls.heightFt;
 for(const p of panels){
  const openings=plan.openings.filter(o=>o.roomId===p.roomId&&o.side==="front");
  const r=plan.rooms.find(r=>r.id===p.roomId)!;
  const top=Math.max(0,...openings.map(o=>o.sillFt+o.heightFt));
  const depth=Math.min(.12,Math.max(.035,p.y>plan.setbacks.frontFt+.15?.1:.035));
  const z=p.y-plan.walls.externalFt/2;
  const add=(x:number,w:number,bottom:number,h:number,kind:FacadeAccent["kind"])=>{
   if(w>.08&&h>.08)out.push({x,y:p.floor*height+bottom,z,w,h,d:depth,floor:p.floor,kind});
  };
  const kit=plan.facade.kit;
  if(kit==="stepped-band"||kit==="cladding-band"||kit==="simple-parapet"){
   const h=Math.min(kit==="cladding-band"?.85:kit==="stepped-band"?.55:.22,Math.max(0,height-top-.08));
   add(p.x,p.w,height-h,h,"band");
  }else{
   const gap= Math.min(.5,Math.max(.18,p.w*.06));
   for(const x of [p.x+.06,p.x+p.w-gap-.06]){
    if(x<p.x||x+gap>p.x+p.w)continue;
    if(!openings.some(o=>r.x+o.atFt<x+gap+EPS&&r.x+o.atFt+o.widthFt>x-EPS))add(x,gap,.08,height-.16,"pier");
   }
   const h=Math.min(.38,Math.max(0,height-top-.08));add(p.x,p.w,height-h,h,"lintel");
  }
 }
 return out;
}
/** Street-visible identity ignores paint and hidden rear room partitions. */
export function frontageSignature(plan:PlanModel):string{
 const round=(v:number)=>Math.round(v*20)/20;
 const panels=frontagePanels(plan);
 return JSON.stringify([panels.map(p=>[p.floor,p.kind,round(p.x),round(p.w),round(p.y)]),frontageOpenings(plan,panels).map(({o,r,a,w})=>[r.floor,o.kind,round(a),round(w),o.sillFt,o.heightFt]).sort(),plan.rooms.filter(r=>r.kind==="balcony").map(r=>[r.floor,round(r.x),round(r.y),round(r.w),round(r.d)]).sort(),[plan.gate.xFt,plan.gate.widthFt,plan.pedestrianGate.xFt,plan.pedestrianGate.widthFt]]);
}
