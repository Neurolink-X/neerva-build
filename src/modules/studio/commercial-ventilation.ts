import type {BuildingConcept} from "./building-purpose.ts";
import {commercialInternalSpaces} from "./commercial-internal.ts";
import {overlapArea,type Rect} from "./plan-model.ts";
import type {ConceptPortal} from "./commercial-detail.ts";
const EPS=1e-5;
type Space=Rect&{id:string;floor:number;kind:string;label:string};
type Face="front"|"rear"|"left"|"right";
export const commercialAirSpaces=(plan:BuildingConcept):Space[]=>{
 const rooms=commercialInternalSpaces(plan),parents=new Set(rooms.map(r=>r.parentId));
 return [...rooms,...plan.zones.filter(z=>!parents.has(z.id))].filter(r=>!["parking","open","stairs","lift","shaft","lobby","passage","circulation","core"].includes(r.kind));
};
function faceOf(r:Space,p:ConceptPortal):Face|null{
 if(p.axis==="x")return Math.abs(p.y-r.y)<EPS?"front":Math.abs(p.y-r.y-r.d)<EPS?"rear":null;
 return Math.abs(p.x-r.x)<EPS?"left":Math.abs(p.x-r.x-r.w)<EPS?"right":null;
}
/** Conservative geometric screen, not a code clearance or airflow calculation.
 * Check the full 3-foot strip against all covered zones above or at this floor.
 * Irregular site context is not treated as verified exterior clearance. */
export function commercialExposure(plan:BuildingConcept,r:Space,p:ConceptPortal):"road"|"open-strip"|"review"{
 const face=faceOf(r,p);if(!face||plan.brief.siteContext||p.length<=0)return "review";
 const x=p.x,y=p.y,l=p.length,W=plan.brief.widthFt,D=plan.brief.depthFt;
 const strip:Rect=face==="front"?{x,y:Math.max(0,y-3),w:l,d:Math.min(3,y)}:face==="rear"?{x,y,w:l,d:3}:face==="left"?{x:x-3,y,w:3,d:l}:{x,y,w:3,d:l};
 const blocked=(a:Rect)=>plan.zones.some(z=>z.floor>=r.floor&&!["parking","open"].includes(z.kind)&&overlapArea(z,a)>EPS);
 if(face==="front"&&y>=0&&x>=-EPS&&x+l<=W+EPS&&!blocked({x,y:0,w:l,d:y}))return "road";
 if(strip.x< -EPS||strip.y< -EPS||strip.x+strip.w>W+EPS||strip.y+strip.d>D+EPS||Math.min(strip.w,strip.d)<EPS||blocked(strip))return "review";
 return "open-strip";
}
export function additionalCommercialGlazing(plan:BuildingConcept,existing:readonly ConceptPortal[]):ConceptPortal[]{
 // Do not force openings in fire cores, toilets or kitchens. Those need a
 // separately engineered exhaust and makeup-air system, never a fake shaft.
 const out:ConceptPortal[]=[];
 for(const r of commercialAirSpaces(plan)){
  if(!["primary","bedroom","living","service-a","service-b"].includes(r.kind))continue;
  if(plan.brief.purpose==="restaurant"&&r.kind.startsWith("service-"))continue;
  const current=existing.filter(p=>p.zoneId===r.id&&p.kind==="exterior-glazing"&&commercialExposure(plan,r,p)!=="review");
  if(current.length)continue;
  for(const face of ["front","rear","left","right"] as const){
   const horizontal=face==="front"||face==="rear",span=horizontal?r.w:r.d;
   if(span<6)continue;const length=Math.min(5,span-2),at=(span-length)/2;
   const p:ConceptPortal={id:r.id+"-air-"+face,zoneId:r.id,floor:r.floor,axis:horizontal?"x":"y",x:horizontal?r.x+at:face==="left"?r.x:r.x+r.w,y:horizontal?(face==="front"?r.y:r.y+r.d):r.y+at,length,kind:"exterior-glazing",reviewRequired:true};
   if(commercialExposure(plan,r,p)==="review")continue;
   const start=p.axis==="x"?p.x:p.y,plane=p.axis==="x"?p.y:p.x;
   if([...existing,...out].some(q=>q.floor===p.floor&&q.axis===p.axis&&Math.abs((q.axis==="x"?q.y:q.x)-plane)<EPS&&Math.min(start+p.length,(q.axis==="x"?q.x:q.y)+q.length)-Math.max(start,q.axis==="x"?q.x:q.y)>-0.15))continue;
   out.push(p);break;
  }
 }
 return out;
}
export function commercialAirReport(plan:BuildingConcept,portals:readonly ConceptPortal[],floor:number){
 return commercialAirSpaces(plan).filter(r=>r.floor===floor).map(r=>{
  const glazing=portals.filter(p=>p.zoneId===r.id&&p.kind==="exterior-glazing").map(p=>({...p,exposure:commercialExposure(plan,r,p),face:faceOf(r,p)}));
  const exposed=glazing.filter(p=>p.exposure!=="review"),sides=new Set(exposed.map(p=>p.face));
  return {id:r.id,label:r.label,kind:r.kind,glazing,exposed:exposed.length,cross:sides.has("front")&&sides.has("rear")||sides.has("left")&&sides.has("right")};
 });
}
