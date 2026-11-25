import type {PlanBrief,PlanModel} from "./plan-model.ts";
export const shortlistKey="neerva-plan-shortlist-v1",maxSaved=6,maxCompare=3;
export type Shortlist={brief:string;ids:string[]};
export function briefKey(b:PlanBrief){return JSON.stringify([b.widthFt,b.depthFt,b.roadSide,b.floors,b.bedrooms,b.parking,b.setbacks.frontFt,b.setbacks.rearFt,b.setbacks.leftFt,b.setbacks.rightFt,b.siteShape?.kind??"rectangle",b.siteShape&&b.siteShape.kind!=="rectangle"?[b.siteShape.notchWidthFt,b.siteShape.notchDepthFt]:[]])}
export function readShortlist(raw:string|null,key:string,plans:readonly PlanModel[]):Shortlist{try{const v=raw&&raw.length<=4096?JSON.parse(raw):null;return {brief:key,ids:v?.brief===key&&Array.isArray(v.ids)?[...new Set<string>(v.ids.slice(0,64).filter((id:unknown):id is string=>typeof id==="string"&&plans.some(p=>p.id===id)))].slice(0,maxSaved):[]}}catch{return {brief:key,ids:[]}}}
export function toggleShortlist(s:Shortlist,id:string,plans:readonly PlanModel[]):Shortlist{if(!plans.some(p=>p.id===id))return s;if(s.ids.includes(id))return {...s,ids:s.ids.filter(x=>x!==id)};return s.ids.length<maxSaved?{...s,ids:[...s.ids,id]}:s}
