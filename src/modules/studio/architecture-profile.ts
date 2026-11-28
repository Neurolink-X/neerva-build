import {sharedEdge,type PlanModel,type Room} from "./plan-model.ts";
/** Coarse architectural role and position, not hundredths of a foot or paint.
 * Keep exact geometry validation separate from perceptual similarity. */
export function entranceArrangement(plan:PlanModel):"front-stair"|"front-bedroom"|"front-verandah"|"pedestrian"{
 const parking=plan.rooms.find(r=>r.floor===0&&r.kind==="parking");
 if(!parking)return "pedestrian";
 const adjacent=(r:Room)=>r.floor===0&&Math.abs(r.y-parking.y)<.05&&!!sharedEdge(r,parking);
 if(plan.rooms.some(r=>r.kind==="stairs"&&adjacent(r)))return "front-stair";
 // The pedestrian verandah may separate the car and bedroom; both still
 // face the street. Do not misclassify this independent entry family.
 if(plan.rooms.some(r=>r.kind==="bedroom"&&r.floor===0&&Math.abs(r.y-parking.y)<.05))return "front-bedroom";
 return "front-verandah";
}
export function architectureTopology(plan:PlanModel){
 const W=plan.plot.widthFt-plan.setbacks.leftFt-plan.setbacks.rightFt,D=plan.plot.depthFt-plan.setbacks.frontFt-plan.setbacks.rearFt;
 const parking=plan.rooms.find(r=>r.floor===0&&r.kind==="parking"),mirror=parking?parking.x+parking.w/2>plan.plot.widthFt/2:plan.variant==="parking-right";
 const roles=plan.rooms.map(r=>{
  const x=(r.x+r.w/2-plan.setbacks.leftFt)/W,y=(r.y+r.d/2-plan.setbacks.frontFt)/D;
  return [r.floor,r.kind,Math.min(2,Math.max(0,Math.floor((mirror?1-x:x)*3))),Math.min(2,Math.max(0,Math.floor(y*3)))].join(":");
 }).sort();
 const byId=new Map(plan.rooms.map(r=>[r.id,r]));
 const links=new Set(plan.openings.filter(o=>o.connectsTo&&o.kind==="door").map(o=>{const a=byId.get(o.roomId),b=byId.get(o.connectsTo!);return a&&b?[a.floor,...[a.kind,b.kind].sort()].join(":"):""}).filter(Boolean));
 return JSON.stringify([entranceArrangement(plan),roles,[...links].sort()]);
}

/** Return representative indices without changing saved IDs or option indices. */
export function representativeIndices<T>(items:readonly T[],signature:(item:T)=>string){
 const seen=new Set<string>();return items.flatMap((item,i)=>{const key=signature(item);if(seen.has(key))return [];seen.add(key);return [i];});
}
