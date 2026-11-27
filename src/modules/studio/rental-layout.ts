import {area,overlapArea,type Rect} from "./plan-model.ts";
import type {BuildingZone,BuildingConcept} from "./building-purpose.ts";
export type RentalRoom=Rect&{id:string;unitId:string;floor:number;kind:"bedroom"|"living"|"kitchen"|"bath"|"passage"|"utility";label:string};
export type RentalLayout={unitId:string;floor:number;bedrooms:number;rooms:RentalRoom[]};
const EPS=1e-6;
/** Concept partitions, not net wall clearances, doors or approved dwelling plans.
 * Access-side living and passage, outer-side bedrooms and kitchen. */
export function rentalLayout(unit:BuildingZone,hall:BuildingZone,bedrooms:number):RentalLayout|null{
 if(unit.kind!=="primary"||hall.kind!=="circulation"||unit.floor!==hall.floor||!Number.isInteger(bedrooms)||bedrooms<1||bedrooms>3||unit.w<22||unit.d<Math.max(20,bedrooms*10+8))return null;
 const hallOnRight=Math.abs(unit.x+unit.w-hall.x)<EPS;
 if(!hallOnRight&&Math.abs(unit.x-hall.x-hall.w)>=EPS)return null;
 const outer=Math.max(10,Math.min(14,unit.w*.43)),passage=4,inner=unit.w-outer-passage;
 if(inner<8-EPS)return null;
 const rooms:RentalRoom[]=[];
 function add(kind:RentalRoom["kind"],label:string,x:number,y:number,w:number,d:number){
  rooms.push({id:unit.id+"-"+rooms.length,unitId:unit.id,floor:unit.floor,kind,label,x:unit.x+(hallOnRight?x:unit.w-x-w),y:unit.y+y,w,d});
 }
 const kitchenDepth=Math.max(8,Math.min(12,unit.d-bedrooms*10)),bedDepth=(unit.d-kitchenDepth)/bedrooms;
 if(bedDepth<10-EPS)return null;
 for(let i=0;i<bedrooms;i++)add("bedroom","Bedroom "+(i+1),0,i*bedDepth,outer,bedDepth);
 add("kitchen","Kitchen",0,unit.d-kitchenDepth,outer,kitchenDepth);
 add("passage","Private passage",outer,0,passage,unit.d);
 const livingDepth=Math.max(12,unit.d*.48),bathDepth=6;
 if(livingDepth+bathDepth>unit.d+EPS)return null;
 add("living","Living / hall",outer+passage,0,inner,livingDepth);
 add("bath","Bath / WC",outer+passage,livingDepth,inner,bathDepth);
 if(unit.d-livingDepth-bathDepth>EPS)add("utility","Utility / storage",outer+passage,livingDepth+bathDepth,inner,unit.d-livingDepth-bathDepth);
 if(rooms.some(r=>Math.abs(overlapArea(r,unit)-area(r))>EPS)||rooms.some((r,i)=>rooms.slice(i+1).some(s=>overlapArea(r,s)>EPS)))return null;
 return {unitId:unit.id,floor:unit.floor,bedrooms,rooms};
}
export function internalVariant(id:string):number|null{const m=/-internal-v1-([0123])$/.exec(id);return m?Number(m[1]):null;}
/** A living-first apartment has a full-width entrance/living space, with
 * bedrooms on the outside wall and wet rooms off the private passage.
 * It is not the same corridor layout with new colours. */
export function internalRentalLayout(unit:BuildingZone,hall:BuildingZone,bedrooms:number,variant:number):RentalLayout|null{
 const base=rentalLayout(unit,hall,bedrooms);if(!base)return null;
 if(variant===0)return base;
 if(variant===1){
  return {...base,rooms:base.rooms.map(r=>({...r,y:unit.y+unit.d-(r.y-unit.y)-r.d}))};
 }
 const entryDepth=12,rest=unit.d-entryDepth,outer=Math.max(10,Math.min(14,unit.w*.43)),passage=4,inner=unit.w-outer-passage;
 if(rest<Math.max(16,bedrooms*10)||inner<8||unit.w*entryDepth<120)return null;
 const right=Math.abs(unit.x+unit.w-hall.x)<EPS,rooms:RentalRoom[]=[];
 const add=(kind:RentalRoom["kind"],label:string,x:number,y:number,w:number,d:number)=>rooms.push({id:unit.id+"-"+rooms.length,unitId:unit.id,floor:unit.floor,kind,label,x:unit.x+(right?x:unit.w-x-w),y:unit.y+y,w,d});
 add("living","Living / dining",0,0,unit.w,entryDepth);
 const kitchenD=variant===3?10:0,bedD=(rest-kitchenD)/bedrooms;
 if(bedD<10)return null;
 for(let i=0;i<bedrooms;i++)add("bedroom","Bedroom "+(i+1),0,entryDepth+i*bedD,outer,bedD);
 if(variant===3)add("kitchen","Exterior-side kitchen",0,unit.d-kitchenD,outer,kitchenD);
 add("passage","Private passage",outer,entryDepth,passage,rest);
 const wetStart=variant===3?0:10;
 if(variant!==3)add("kitchen","Kitchen",outer+passage,entryDepth,inner,10);
 add("bath","Bath / WC",outer+passage,entryDepth+wetStart,inner,6);
 if(rest>wetStart+6+EPS)add("utility","Utility / storage",outer+passage,entryDepth+wetStart+6,inner,rest-wetStart-6);
 return {unitId:unit.id,floor:unit.floor,bedrooms,rooms};
}
export function rentalLayouts(plan:BuildingConcept):RentalLayout[]{
 if(plan.brief.purpose!=="rental")return [];
 return plan.zones.filter(z=>z.kind==="primary").flatMap(unit=>{
  const hall=plan.zones.find(z=>z.kind==="circulation"&&z.floor===unit.floor);
  const variant=internalVariant(plan.id);
  const layout=hall?(variant===null?rentalLayout(unit,hall,plan.brief.rentalBedrooms??1):internalRentalLayout(unit,hall,plan.brief.rentalBedrooms??1,variant)):null;
  return layout?[layout]:[];
 });
}
