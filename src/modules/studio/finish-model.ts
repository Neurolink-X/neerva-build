import type {ProjectSource} from "./project-exchange.ts";
import {rentalLayouts} from "./rental-layout.ts";
import type {Rect} from "./plan-model.ts";
export type RoomFinish={wall:string;floor:string;ceiling:string};
export type FinishScheme={planId:string;exterior:string;accent:string;glass:string;rooms:Record<string,RoomFinish>};
export type FinishSpace=Rect&{id:string;label:string;floor:number;kind:string};
const open=new Set(["parking","verandah","balcony","terrace","open"]);
export const finishPresets={
 home:{wall:"#e9e0d1",floor:"#bfa68b",ceiling:"#ffffff",exterior:"#e5dac7",accent:"#8c7160",glass:"#94b6c5"},
 rental:{wall:"#eee9df",floor:"#d0c5b5",ceiling:"#ffffff",exterior:"#ddd8cb",accent:"#8c8b7c",glass:"#a7c0cb"},
 school:{wall:"#e1eddc",floor:"#c9c9c2",ceiling:"#ffffff",exterior:"#e5d7b6",accent:"#718d77",glass:"#a5bdc8"},
 restaurant:{wall:"#dcc5ab",floor:"#9c8067",ceiling:"#f0e6d7",exterior:"#c5aa8c",accent:"#795646",glass:"#9baeb9"},
 mall:{wall:"#eee9e0",floor:"#d0d2d0",ceiling:"#ffffff",exterior:"#d6d8d5",accent:"#747c80",glass:"#86aabb"},
 shops:{wall:"#e8e3d9",floor:"#c8c6bf",ceiling:"#ffffff",exterior:"#ddd7c9",accent:"#6b7d73",glass:"#9bbac7"}
} as const;
export const validShade=(s:string)=>/^#[0-9a-f]{6}$/i.test(s);
export function shadeRgb(s:string):[number,number,number]{const hex=validShade(s)?s:"#dddddd";return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as [number,number,number];}
export function finishSpaces(source:ProjectSource):FinishSpace[]{
 if(source.kind==="residential")return source.plan.rooms.filter(r=>!open.has(r.kind));
 const units=rentalLayouts(source.plan),ids=new Set(units.map(u=>u.unitId));
 return [...source.plan.zones.filter(z=>!open.has(z.kind)&&!ids.has(z.id)),...units.flatMap(u=>u.rooms.map(r=>({...r,label:"Unit "+u.unitId+" · "+r.label})))];
}
export function defaultFinishScheme(source:ProjectSource):FinishScheme{
 const p=finishPresets[source.kind==="residential"?"home":source.plan.brief.purpose];
 return {planId:source.plan.id,exterior:source.kind==="residential"?source.plan.facade.main:p.exterior,accent:source.kind==="residential"?source.plan.facade.accent:p.accent,glass:p.glass,rooms:Object.fromEntries(finishSpaces(source).map(r=>[r.id,{wall:p.wall,floor:p.floor,ceiling:p.ceiling}]))};
}
export function applyRoomFinish(source:ProjectSource,scheme:FinishScheme,ids:readonly string[],surface:keyof RoomFinish,shade:string):FinishScheme{
 if(scheme.planId!==source.plan.id||!validShade(shade))return scheme;
 const allowed=new Set(finishSpaces(source).map(r=>r.id)),rooms={...scheme.rooms};
 for(const id of ids)if(allowed.has(id)&&rooms[id])rooms[id]={...rooms[id],[surface]:shade};
 return {...scheme,rooms};
}
export function finishEstimate(source:ProjectSource,ids:readonly string[],coverage:number,coats:number){
 if(!Number.isFinite(coverage)||coverage<=0||coverage>100||!Number.isInteger(coats)||coats<1||coats>5)return null;
 const chosen=new Set(ids),rooms=finishSpaces(source).filter(r=>chosen.has(r.id)),height=source.kind==="residential"?source.plan.walls.heightFt:13;
 let gross=0,net=0,floor=0;
 for(const r of rooms){
  floor+=r.w*r.d;const wall=2*(r.w+r.d)*height;gross+=wall;
  const openings=source.kind==="residential"?source.plan.openings.filter(o=>o.roomId===r.id).reduce((n,o)=>n+o.widthFt*o.heightFt,0):0;
  net+=Math.max(0,wall-openings);
 }
 return {floorSqFt:floor,ceilingSqFt:floor,wallSqFt:net,paintLitres:net*.09290304*coats/coverage,grossWallSqFt:gross,openingsDeducted:source.kind==="residential",roomCount:rooms.length};
}
