import {generateBuildingConcepts,buildingLayoutFamily,type BuildingBrief,type BuildingConcept,type BuildingLayoutFamily} from "./building-purpose.ts";
import {commercialInternalSpaces} from "./commercial-internal.ts";
import {rentalLayouts} from "./rental-layout.ts";
import {commercialPortals} from "./commercial-detail.ts";
const round=(n:number)=>Math.round(n*1000)/1000;
/** Compare actual displayed room and opening geometry, not family IDs, labels or colours.
 * A left/right reflection alone does not count as an additional interior option.
 * Keep persisted plan signatures unchanged for backward-compatible restoration. */
export function visibleInteriorSignature(plan:BuildingConcept){
 const detailed=commercialInternalSpaces(plan),rooms=detailed.length?detailed:rentalLayouts(plan).flatMap(u=>u.rooms.map(r=>({...r,parentId:u.unitId})));
 const parents=new Set(rooms.map(r=>r.parentId)),spaces=[...plan.zones.filter(z=>!parents.has(z.id)),...rooms];
 const portals=commercialPortals(plan),width=plan.brief.widthFt;
 const signature=(mirror:boolean)=>JSON.stringify([
  spaces.map(r=>JSON.stringify([r.floor,r.kind,round(mirror?width-r.x-r.w:r.x),round(r.y),round(r.w),round(r.d)])).sort(),
  portals.map(p=>JSON.stringify([p.floor,p.kind,p.axis,round(mirror?width-p.x-(p.axis==="x"?p.length:0):p.x),round(p.y),round(p.length)])).sort()
 ]);
 const a=signature(false),b=signature(true);return a<b?a:b;
}
export const layoutFamilies=["internal","purpose-led","classic","side-gallery"] as const;
export type BuildingRecommendation={id:string;family:BuildingLayoutFamily;index:number;label:string;primaryAreaShare:number;accessAreaShare:number;coreSeparationFt:number;interiorRoomCount:number;detailed:boolean};
function summarize(plan:BuildingConcept,index:number):BuildingRecommendation{
 const zones=plan.zones.filter(z=>z.floor===0&&!["open","parking"].includes(z.kind)),total=zones.reduce((s,z)=>s+z.w*z.d,0);
 const fraction=(kind:string)=>zones.filter(z=>z.kind===kind).reduce((s,z)=>s+z.w*z.d,0)/Math.max(1,total);
 const cores=zones.filter(z=>z.kind==="core"),[a,b]=cores;
 const rooms=commercialInternalSpaces(plan);
 return {interiorRoomCount:rooms.length,detailed:rooms.length>0,id:plan.id,family:buildingLayoutFamily(plan.id),index,label:plan.layout,primaryAreaShare:fraction("primary"),accessAreaShare:fraction("circulation"),coreSeparationFt:a&&b?Math.hypot(a.x+a.w/2-b.x-b.w/2,a.y+a.d/2-b.y-b.d/2):0};
}
/** On-demand comparison only. Return compact summaries, never 72 full models.
 * Primary-area share is an indicator, not compliance, occupancy or quality certification.
 * Round-robin across families ensures the shortlist is not one repeated topology. */
export function recommendBuildingConcepts(brief:BuildingBrief,limit=24){
 const seen=new Set<string>(),groups:BuildingRecommendation[][]=[],counts:Record<BuildingLayoutFamily,number>={"purpose-led":0,classic:0,"side-gallery":0,internal:0};
 for(const family of layoutFamilies){
  const {plans}=generateBuildingConcepts(brief,24,family);counts[family]=plans.length;
  const group:BuildingRecommendation[]=[];
  plans.forEach((p,i)=>{const key=visibleInteriorSignature(p);if(seen.has(key))return;seen.add(key);group.push(summarize(p,i));});
  group.sort((a,b)=>Number(b.detailed)-Number(a.detailed)||b.interiorRoomCount-a.interiorRoomCount||b.primaryAreaShare-a.primaryAreaShare||b.coreSeparationFt-a.coreSeparationFt||a.index-b.index);groups.push(group);
 }
 const max=Number.isFinite(limit)?Math.max(0,Math.min(24,Math.floor(limit))):24,options:BuildingRecommendation[]=[];
 // Prioritize validated detailed interiors; use zoning only to fill genuine gaps.
 for(const detailed of [true,false]){
  const eligible=groups.map(g=>g.filter(o=>o.detailed===detailed));
  for(let i=0;i<24&&options.length<max;i++)for(const group of eligible){if(group[i]&&options.length<max)options.push(group[i]);}
 }
 return {counts,distinct:seen.size,options,detailedCount:options.filter(o=>o.detailed).length};
}
