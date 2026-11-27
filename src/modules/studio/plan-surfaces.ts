import type {PlanModel,Rect,Room} from "./plan-model.ts";
const EPS=1e-6;
export const isEnclosedRoom=(r:Room)=>!["parking","verandah","balcony","terrace"].includes(r.kind);
export function subtractRect(base:Rect,cut:Rect):Rect[]{
 const x0=Math.max(base.x,cut.x),x1=Math.min(base.x+base.w,cut.x+cut.w),y0=Math.max(base.y,cut.y),y1=Math.min(base.y+base.d,cut.y+cut.d);
 if(x1-x0<=EPS||y1-y0<=EPS)return [base];
 return [{x:base.x,y:base.y,w:x0-base.x,d:base.d},{x:x1,y:base.y,w:base.x+base.w-x1,d:base.d},
  {x:x0,y:base.y,w:x1-x0,d:y0-base.y},{x:x0,y:y1,w:x1-x0,d:base.y+base.d-y1}].filter(r=>r.w>EPS&&r.d>EPS);
}
export type RoofPatch=Rect&{floor:number;roomId:string};
/** Only the part not covered by any higher-level floor plate needs its own
 * visible roof. Roofs are conceptual surfaces, not structural slab design. */
export function exposedRoofPatches(plan:PlanModel):RoofPatch[]{
 return plan.rooms.filter(isEnclosedRoom).flatMap(room=>{
  const above=plan.rooms.filter(r=>r.floor===room.floor+1&&r.kind!=="parking");
  const exposed=above.reduce<Rect[]>((pieces,cut)=>pieces.flatMap(p=>subtractRect(p,cut)),[{x:room.x,y:room.y,w:room.w,d:room.d}]);
  return exposed.map(r=>({...r,floor:room.floor+1,roomId:room.id}));
 });
}
