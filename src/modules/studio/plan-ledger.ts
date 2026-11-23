import type {PlanModel} from "./plan-model.ts";
import {area,overlapArea} from "./plan-model.ts";
export type FloorLedger={floor:number;usableSqFt:number;enclosedSqFt:number;parkingSqFt:number;otherOpenSqFt:number;unallocatedSqFt:number;overlapSqFt:number;reconciles:boolean};
export function planAreaLedger(p:PlanModel):FloorLedger[]{
 const usable=(p.plot.widthFt-p.setbacks.leftFt-p.setbacks.rightFt)*(p.plot.depthFt-p.setbacks.frontFt-p.setbacks.rearFt);
 return Array.from({length:p.floors},(_,floor)=>{
  const rooms=p.rooms.filter(r=>r.floor===floor);
  const sum=(f:(r:typeof rooms[number])=>boolean)=>rooms.filter(f).reduce((n,r)=>n+area(r),0);
  const enclosed=sum(r=>!["parking","verandah","balcony","terrace"].includes(r.kind));
  const parking=sum(r=>r.kind==="parking");
  const open=sum(r=>["verandah","balcony","terrace"].includes(r.kind));
  const overlaps=rooms.reduce((n,r,i)=>n+rooms.slice(i+1).reduce((m,s)=>m+overlapArea(r,s),0),0);
  const unallocated=usable-enclosed-parking-open+overlaps;
  const reconciles=Number.isFinite(unallocated)&&unallocated>=-0.01&&Math.abs((enclosed+parking+open-overlaps+unallocated)-usable)<=.01;
  return {floor,usableSqFt:usable,enclosedSqFt:enclosed,parkingSqFt:parking,otherOpenSqFt:open,unallocatedSqFt:unallocated,overlapSqFt:overlaps,reconciles};
 });
}
/** Quantities backed by the model; structural steel/cement omitted pending an engineer's specifications. */
export function preliminaryMaterialQuantities(p:PlanModel,{coats=2,coverageSqMPerL=10,wastePercent=10}:{coats?:number;coverageSqMPerL?:number;wastePercent?:number}={}){
 if(![coats,coverageSqMPerL,wastePercent].every(Number.isFinite)||coats<=0||coverageSqMPerL<=0||wastePercent<0||wastePercent>50)throw new RangeError("Invalid paint coverage or wastage");
 const enclosed=p.rooms.filter(r=>!["parking","verandah","balcony","terrace"].includes(r.kind));
 const floorSqFt=enclosed.reduce((n,r)=>n+area(r),0);
 const wallFaceSqFt=enclosed.reduce((n,r)=>n+2*(r.w+r.d)*p.walls.heightFt,0);
 const openingsSqFt=p.openings.filter(o=>enclosed.some(r=>r.id===o.roomId)).reduce((n,o)=>n+o.widthFt*o.heightFt,0);
 const wallSqM=Math.max(0,wallFaceSqFt-openingsSqFt)*.09290304;
 const litres=Math.ceil(wallSqM*coats/coverageSqMPerL*(1+wastePercent/100));
 return {floorSqM:floorSqFt*.09290304,wallSqM,paintLitres:litres,
  distinctDoorOpenings:new Set(p.openings.filter(o=>o.kind==="door").map(o=>{
    const pair=[o.roomId,o.connectsTo??"outside"].sort().join("|");return pair;
  })).size,
  windows:p.openings.filter(o=>o.kind==="window").length,
  status:"preliminary" as const,materialPricesVerified:false,structuralItemsAvailable:false,
  disclaimer:"Uncertified concept quantities only. Confirm finished floor scope, openings, surface prep, product spread rate, wastage and structural BOQ with licensed professionals."};
}
