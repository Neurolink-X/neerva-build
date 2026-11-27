import {area} from "./plan-model.ts";
import {validateBuildingConcept,type BuildingConcept,type BuildingZone} from "./building-purpose.ts";

export const jurisdictionSources={
 "Kanpur":{authority:"Kanpur Development Authority",url:"https://www.kdaindia.co.in/",state:"Uttar Pradesh"},
 "Lucknow":{authority:"Lucknow Development Authority",url:"https://www.ldalucknow.in/building-bylaws/",state:"Uttar Pradesh"},
 "Ghaziabad":{authority:"Ghaziabad Development Authority",url:"https://gdaghaziabad.in/acts-bye-laws/",state:"Uttar Pradesh"},
 "Other":{authority:"Confirm the competent local planning authority",url:null,state:null}
} as const;
export type Jurisdiction=keyof typeof jurisdictionSources;
export const engineeringReferences=[
 {label:"BIS National Building Code (parts 3, 4, 6, 8 and 9)",url:"https://www.bis.gov.in/standards/national-building-code/?lang=en"},
 {label:"Government fire and life safety reference",url:"https://www.dgfscdhg.gov.in/national-building-code-india-fire-and-life-safety"},
 {label:"Universal accessibility guidelines",url:"https://depwd.gov.in/en/document/harmonised-guidelines-and-space-standard-for-universal-accessibility-in-india-2021/"},
 {label:"UP government orders, amendments and clarifications",url:"https://www.awasbandhu.in/en/pages/order-list"}
] as const;

export type RouteProxy={zoneId:string;label:string;nearestFt:number|null;oneCoreUnavailableFt:number|null};
export type FloorReview={floor:number;coveredSqFt:number;primarySqFt:number;coreReserveSqFt:number;toiletReserveSqFt:number;spineWidthFt:number|null;routes:RouteProxy[];worstNormalFt:number|null;worstSingleCoreFt:number|null};
const inside=(v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v));
/** Manhattan centerline distance to the two core reserve centers, not a fire
 * travel-distance calculation: actual doors, barriers, stairs and discharge
 * are not present in the concept. A blocked core is a sensitivity scenario. */
function proxy(z:BuildingZone,core:BuildingZone,hall:BuildingZone){
 const mid=hall.x+hall.w/2;
 const y=inside(z.y+z.d/2,hall.y,hall.y+hall.d);
 const cy=inside(core.y+core.d/2,hall.y,hall.y+hall.d);
 return Math.abs(z.x+z.w/2-mid)+Math.abs(y-cy)+Math.abs(core.x+core.w/2-mid);
}
const covered=(z:BuildingZone)=>z.kind!=="open"&&z.kind!=="parking";
export function engineeringPreflight(plan:BuildingConcept){
 const blockers=validateBuildingConcept(plan);
 const floors:FloorReview[]=[];
 if(!blockers.length)for(let f=0;f<plan.brief.floors;f++){
  const zs=plan.zones.filter(z=>z.floor===f),cores=zs.filter(z=>z.kind==="core"),hall=zs.find(z=>z.kind==="circulation");
  const routes=zs.filter(z=>z.kind==="primary"||z.kind==="support").map(z=>{
   const ds=hall?cores.map(c=>proxy(z,c,hall)).sort((a,b)=>a-b):[];
   return {zoneId:z.id,label:z.label,nearestFt:ds[0]??null,oneCoreUnavailableFt:ds.length>=2?ds[ds.length-1]:null};
  });
  const worst=(key:"nearestFt"|"oneCoreUnavailableFt")=>routes.length&&routes.every(r=>r[key]!==null)?Math.max(...routes.map(r=>r[key]!)):null;
  floors.push({floor:f,coveredSqFt:zs.filter(covered).reduce((n,z)=>n+area(z),0),primarySqFt:zs.filter(z=>z.kind==="primary").reduce((n,z)=>n+area(z),0),coreReserveSqFt:cores.reduce((n,z)=>n+area(z),0),toiletReserveSqFt:zs.filter(z=>z.kind==="toilet").reduce((n,z)=>n+area(z),0),spineWidthFt:hall?.w??null,routes,worstNormalFt:worst("nearestFt"),worstSingleCoreFt:worst("oneCoreUnavailableFt")});
 }
 const gross=floors.reduce((n,f)=>n+f.coveredSqFt,0),site=plan.brief.widthFt*plan.brief.depthFt;
 return {planId:plan.id,blockers,floors,grossSqFt:gross,conceptAreaRatio:site>0?gross/site:null,approval:"NOT_ENGINEERED" as const,
  requirements:[
   {id:"fire",title:"Fire and life safety",required:["Occupancy classification and occupant load","Actual door and exit widths, separation, travel distance, protected stairs and discharge","Fire service access, detection, suppression and fire NOC"]},
   {id:"vertical",title:"Lift and escalator",required:["Lift traffic demand, accessibility and evacuation strategy","Manufacturer shaft/pit/headroom and machine requirements","Escalator rise, landing, guarding and structural interfaces"]},
   {id:"evacuation",title:"Evacuation",required:["Actual route network, door capacity and population distribution","Mobility needs, smoke conditions and independent exits","Professional simulation and emergency procedure"]},
   {id:"structure",title:"Structural design",required:["Geotechnical report, structural grid and material grades","Dead/live loads, wind, seismic and load combinations","Engineer analysis, foundation design and signed drawings"]},
   {id:"mep",title:"Electrical, plumbing and HVAC",required:["Equipment schedule, demand, earthing, protection and emergency power","Water supply, drainage, fixtures, fire water and shafts","Heat-load calculation, fresh air, exhaust, plant and maintenance access"]},
   {id:"bylaws",title:"Authority and accessibility",required:["Verified land use, road width, local setbacks, FAR/coverage and height","Applicable amendments, parking standards and authority approvals","Accessibility and purpose-specific licences"]},
  ]};
}
