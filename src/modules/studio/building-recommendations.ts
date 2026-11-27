import {generateBuildingConcepts,buildingLayoutFamily,type BuildingBrief,type BuildingConcept,type BuildingLayoutFamily} from "./building-purpose.ts";
export const layoutFamilies=["internal","purpose-led","classic","side-gallery"] as const;
export type BuildingRecommendation={id:string;family:BuildingLayoutFamily;index:number;label:string;primaryAreaShare:number;accessAreaShare:number;coreSeparationFt:number};
function summarize(plan:BuildingConcept,index:number):BuildingRecommendation{
 const zones=plan.zones.filter(z=>z.floor===0&&!["open","parking"].includes(z.kind)),total=zones.reduce((s,z)=>s+z.w*z.d,0);
 const fraction=(kind:string)=>zones.filter(z=>z.kind===kind).reduce((s,z)=>s+z.w*z.d,0)/Math.max(1,total);
 const cores=zones.filter(z=>z.kind==="core"),[a,b]=cores;
 return {id:plan.id,family:buildingLayoutFamily(plan.id),index,label:plan.layout,primaryAreaShare:fraction("primary"),accessAreaShare:fraction("circulation"),coreSeparationFt:a&&b?Math.hypot(a.x+a.w/2-b.x-b.w/2,a.y+a.d/2-b.y-b.d/2):0};
}
/** On-demand comparison only. Return compact summaries, never 72 full models.
 * Primary-area share is an indicator, not compliance, occupancy or quality certification.
 * Round-robin across families ensures the shortlist is not one repeated topology. */
export function recommendBuildingConcepts(brief:BuildingBrief,limit=24){
 const seen=new Set<string>(),groups:BuildingRecommendation[][]=[],counts:Record<BuildingLayoutFamily,number>={"purpose-led":0,classic:0,"side-gallery":0,internal:0};
 for(const family of layoutFamilies){
  const {plans}=generateBuildingConcepts(brief,24,family);counts[family]=plans.length;
  const group:BuildingRecommendation[]=[];
  plans.forEach((p,i)=>{if(seen.has(p.signature))return;seen.add(p.signature);group.push(summarize(p,i));});
  group.sort((a,b)=>b.primaryAreaShare-a.primaryAreaShare||b.coreSeparationFt-a.coreSeparationFt||a.index-b.index);groups.push(group);
 }
 const max=Number.isFinite(limit)?Math.max(0,Math.min(24,Math.floor(limit))):24,options:BuildingRecommendation[]=[];
 for(let i=0;i<24&&options.length<max;i++)for(const group of groups){if(group[i]&&options.length<max)options.push(group[i]);}
 return {counts,distinct:seen.size,options};
}
