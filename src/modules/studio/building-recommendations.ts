import {generateBuildingConcepts,buildingLayoutFamily,type BuildingBrief,type BuildingConcept,type BuildingLayoutFamily} from "./building-purpose.ts";
import {commercialInternalSpaces} from "./commercial-internal.ts";
import {rentalLayouts} from "./rental-layout.ts";
import {commercialPortals} from "./commercial-detail.ts";
import {commercialAirReport} from "./commercial-ventilation.ts";
const round=(n:number)=>Math.round(n*1000)/1000;
/** Compare actual displayed room and opening geometry, not family IDs, labels or colours.
 * A left/right reflection alone does not count as an additional interior option.
 * Keep persisted plan signatures unchanged for backward-compatible restoration. */
export function visibleInteriorSignature(plan:BuildingConcept){return signatureWithPortals(plan,commercialPortals(plan));}
function signatureWithPortals(plan:BuildingConcept,portals:ReturnType<typeof commercialPortals>){
 const detailed=commercialInternalSpaces(plan),rooms=detailed.length?detailed:rentalLayouts(plan).flatMap(u=>u.rooms.map(r=>({...r,parentId:u.unitId})));
 const parents=new Set(rooms.map(r=>r.parentId)),spaces=[...plan.zones.filter(z=>!parents.has(z.id)),...rooms];
 const width=plan.brief.widthFt;
 const signature=(mirror:boolean)=>JSON.stringify([
  spaces.map(r=>JSON.stringify([r.floor,r.kind,round(mirror?width-r.x-r.w:r.x),round(r.y),round(r.w),round(r.d)])).sort(),
  portals.map(p=>JSON.stringify([p.floor,p.kind,p.axis,round(mirror?width-p.x-(p.axis==="x"?p.length:0):p.x),round(p.y),round(p.length)])).sort()
 ]);
 const a=signature(false),b=signature(true);return a<b?a:b;
}
/** Group by functional zoning and circulation orientation, ignoring small room
 * resizing. Exact mirrored geometry is still deduplicated separately. */
export function commercialTopology(p:BuildingConcept){
 const W=p.brief.widthFt,D=p.brief.depthFt;
 const signature=(mirror:boolean)=>JSON.stringify(p.zones.filter(z=>z.kind!=="open"&&z.kind!=="parking").map(z=>[z.floor,z.kind,Math.min(2,Math.floor((mirror?1-(z.x+z.w/2)/W:(z.x+z.w/2)/W)*3)),Math.min(2,Math.floor((z.y+z.d/2)/D*3)),z.kind==="circulation"?(z.w>z.d?"across":"lengthwise"):""].join(":")).sort());
 const a=signature(false),b=signature(true);return a<b?a:b;
}
export const layoutFamilies=["internal","cross-gallery","purpose-led","classic","side-gallery"] as const;
export type BuildingRecommendation={id:string;family:BuildingLayoutFamily;index:number;label:string;primaryAreaShare:number;accessAreaShare:number;coreSeparationFt:number;interiorRoomCount:number;detailed:boolean;screenedSpaceShare:number;wetServiceReviewCount:number;coveredFootprintShare:number};
function summarize(plan:BuildingConcept,index:number,portals:ReturnType<typeof commercialPortals>):BuildingRecommendation{
 const zones=plan.zones.filter(z=>z.floor===0&&!["open","parking"].includes(z.kind)),total=zones.reduce((s,z)=>s+z.w*z.d,0);
 const fraction=(kind:string)=>zones.filter(z=>z.kind===kind).reduce((s,z)=>s+z.w*z.d,0)/Math.max(1,total);
 const cores=zones.filter(z=>z.kind==="core"),[a,b]=cores;
 const rooms=commercialInternalSpaces(plan);
 const air=Array.from({length:plan.brief.floors},(_,floor)=>commercialAirReport(plan,portals,floor)).flat();
 const wet=air.filter(r=>["bath","toilet","kitchen","service-a","service-b","service","support"].includes(r.kind));
 const covered=plan.zones.filter(z=>!["parking","open"].includes(z.kind)).reduce((sum,z)=>sum+z.w*z.d,0);
 const envelope=(plan.brief.widthFt-2*plan.brief.sideFt)*(plan.brief.depthFt-plan.brief.frontFt-plan.brief.rearFt)*plan.brief.floors;
 return {screenedSpaceShare:air.filter(r=>r.exposed>0).length/Math.max(1,air.length),wetServiceReviewCount:wet.filter(r=>!r.exposed).length,coveredFootprintShare:covered/Math.max(1,envelope),interiorRoomCount:rooms.length,detailed:rooms.length>0,id:plan.id,family:buildingLayoutFamily(plan.id),index,label:plan.layout,primaryAreaShare:fraction("primary"),accessAreaShare:fraction("circulation"),coreSeparationFt:a&&b?Math.hypot(a.x+a.w/2-b.x-b.w/2,a.y+a.d/2-b.y-b.d/2):0};
}
/** On-demand comparison only. Return compact summaries, never 72 full models.
 * Primary-area share is an indicator, not compliance, occupancy or quality certification.
 * Round-robin across families ensures the shortlist is not one repeated topology. */
export function recommendBuildingConcepts(brief:BuildingBrief,limit=24){
 const seen=new Set<string>(),topologyById=new Map<string,string>(),groups:BuildingRecommendation[][]=[],counts:Record<BuildingLayoutFamily,number>={"purpose-led":0,classic:0,"side-gallery":0,"cross-gallery":0,internal:0};
 for(const family of layoutFamilies){
  const {plans}=generateBuildingConcepts(brief,24,family);counts[family]=plans.length;
  const group:BuildingRecommendation[]=[];
  plans.forEach((p,i)=>{const portals=commercialPortals(p);const key=signatureWithPortals(p,portals);if(seen.has(key))return;seen.add(key);topologyById.set(p.id,commercialTopology(p));group.push(summarize(p,i,portals));});
  group.sort((a,b)=>Number(b.detailed)-Number(a.detailed)||b.screenedSpaceShare-a.screenedSpaceShare||a.wetServiceReviewCount-b.wetServiceReviewCount||b.interiorRoomCount-a.interiorRoomCount||b.primaryAreaShare-a.primaryAreaShare||b.coreSeparationFt-a.coreSeparationFt||a.index-b.index);groups.push(group);
 }
 const max=Number.isFinite(limit)?Math.max(0,Math.min(24,Math.floor(limit))):24,options:BuildingRecommendation[]=[];
 // Prioritize validated detailed interiors; use zoning only to fill genuine gaps.
 for(const detailed of [true,false]){
  const eligible=groups.map(g=>g.filter(o=>o.detailed===detailed));
  const topologies=new Set(options.map(o=>topologyById.get(o.id)));
  const ordered=Array.from({length:24},(_,i)=>eligible.flatMap(g=>g[i]?[g[i]]:[])).flat();
  for(const distinct of [true,false])for(const option of ordered){
   if(options.length>=max)break;
   if(options.some(o=>o.id===option.id))continue;
   const key=topologyById.get(option.id);if(distinct&&topologies.has(key))continue;
   options.push(option);topologies.add(key);
  }
 }
 return {counts,distinct:seen.size,options,detailedCount:options.filter(o=>o.detailed).length,topologyCount:new Set(options.map(o=>topologyById.get(o.id))).size};
}
