import {type StudioDesign,validateStudioDesign} from "./library.ts";

/**
 * Advisory concept matching ONLY. No city rules are assumed to be legal facts.
 * Published city regulations must be separately verified, dated, and approved.
 */
export type Facing="North"|"South"|"East"|"West";
export type PlotUnit="ft"|"m";
export type PlotBrief={
  widthFt:number;depthFt:number;city:string;
  facing:Facing;roadSide:Facing;
  bedrooms:number;floors:number;parking:boolean;
};
export type Setbacks={frontFt:number;rearFt:number;leftFt:number;rightFt:number};
export type VerifiedCityRules={
  city:string;authority:string;sourceUrl:string;verifiedOn:string;status:"verified";
  setbacks:Setbacks;minimumsSqFt:Record<"habitable"|"kitchen"|"bath",number>;
};
export type PlanningGrade="does-not-fit"|"review-required"|"closest-concept";
export type FitResult={
  slug:string;score:number;grade:PlanningGrade;
  meetsRequestedBrief:boolean;plotDimensionsFit:boolean;
  blockers:string[];notes:string[];needsLocalApproval:true;
  areaSqFt:number;plotAreaSqGaj:number;
};
export const ADVISORY_MIN_ROOM_SQFT=Object.freeze({habitable:100,kitchen:48,bath:20});
export const ADVISORY_CAR_CLEARANCE_FT=Object.freeze({short:8,long:16});
export const DESIGN_CITIES=["Kanpur","Ranchi","Lucknow","Jhansi","Mumbai"] as const;
export const designCityStatus="Regulations are not yet verified. Verify setbacks, FAR, access and permits with the appropriate local authority.";
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function toFeet(value:number,unit:PlotUnit){return unit==="m"?value/0.3048:value}
export function sqFtToGaj(areaSqFt:number){return areaSqFt/9}
export function validatePlotBrief(b:PlotBrief):string[]{
 const errors:string[]=[];
 if(!Number.isFinite(b.widthFt)||!Number.isFinite(b.depthFt)||b.widthFt<10||b.depthFt<15||b.widthFt>200||b.depthFt>250)errors.push("Enter a plot from 10–200 ft wide and 15–250 ft deep.");
 if(!Number.isInteger(b.bedrooms)||b.bedrooms<1||b.bedrooms>6)errors.push("Bedrooms must be between one and six.");
 if(!Number.isInteger(b.floors)||b.floors<1||b.floors>3)errors.push("Floors must be between one and three.");
 if(!["North","South","East","West"].includes(b.facing)||!["North","South","East","West"].includes(b.roadSide))errors.push("Select a valid facing and road side.");
 if(!DESIGN_CITIES.some(city=>city.toLowerCase()===b.city.trim().toLowerCase()))errors.push("Select a supported research city.");
 return errors;
}
const fmt=(n:number)=>Number(n.toFixed(1)).toString();
function publishedRules(b:PlotBrief,r:VerifiedCityRules|undefined):r is VerifiedCityRules{
 if(!r||r.status!=="verified"||r.city.toLowerCase()!==b.city.toLowerCase()||!r.authority.trim()||!/^https:\/\//.test(r.sourceUrl)||!Number.isFinite(Date.parse(r.verifiedOn)))return false;
 const v=Object.values(r.setbacks);
 return v.length===4&&v.every(n=>Number.isFinite(n)&&n>=0&&n<50)&&Object.values(r.minimumsSqFt).every(n=>Number.isFinite(n)&&n>0&&n<2000);
}
export function evaluatePlotFit(d:StudioDesign,b:PlotBrief,rules?:VerifiedCityRules):FitResult{
 const blockers:string[]=[],notes:string[]=[];
 const areaSqFt=b.widthFt*b.depthFt;
 if(validatePlotBrief(b).length){return{slug:d.slug,score:0,grade:"does-not-fit",meetsRequestedBrief:false,plotDimensionsFit:false,blockers:validatePlotBrief(b),notes:[],needsLocalApproval:true,areaSqFt,plotAreaSqGaj:sqFtToGaj(areaSqFt)}}
 const fits=b.widthFt+.001>=d.plot.widthFt&&b.depthFt+.001>=d.plot.depthFt;
 let score=94;
 if(!fits){blockers.push("Requires at least "+fmt(d.plot.widthFt)+" × "+fmt(d.plot.depthFt)+" ft in this orientation.");score=15;}
 else{
   const extra=(b.widthFt*b.depthFt-d.plot.areaSqFt)/Math.max(1,b.widthFt*b.depthFt);
   score-=Math.min(12,Math.round(extra*24));
 }
 if(d.bedrooms!==b.bedrooms){
   notes.push(d.bedrooms+" BHK concept; requested "+b.bedrooms+" BHK. Bedroom layout needs redesign.");
   score-=Math.min(25,12*Math.abs(d.bedrooms-b.bedrooms));
 }
 if(d.floors!==b.floors){
   notes.push(d.floors===1?"Ground-floor concept; additional level is not designed.":"This design includes "+d.floors+" levels.");
   score-=15;
 }
 if(d.facing!==b.facing){notes.push("Concept faces "+d.facing+"; requested "+b.facing+". Orientation needs review.");score-=8;}
 if(d.facing!==b.roadSide){notes.push("Road-side access and gate orientation need an architect's review.");score-=5;}
 const rooms=d.layout.rooms;
 if(b.parking&&!d.parking){notes.push("No parking space is included. Do not assume a car fits.");score-=25;}
 if(!b.parking&&d.parking){notes.push("This concept allocates area to parking which you did not request.");score-=3;}
 if(b.parking&&d.parking){
   const spaces=rooms.filter(x=>x.kind==="parking"&&x.floorIndex===0);
   const clearance=spaces.some(x=>
     (x.wFt>=ADVISORY_CAR_CLEARANCE_FT.long&&x.dFt>=ADVISORY_CAR_CLEARANCE_FT.short)||
     (x.dFt>=ADVISORY_CAR_CLEARANCE_FT.long&&x.wFt>=ADVISORY_CAR_CLEARANCE_FT.short)
   );
   if(!clearance){notes.push("Parking space does not contain an advisory 8 × 16 ft clear rectangle; turning and gate access require redesign.");score-=20;}
   else notes.push("Parking dimensions are conceptual. Gate width, vehicle swept path and turning clearance require site verification.");
 }
 const minimums=publishedRules(b,rules)?rules.minimumsSqFt:ADVISORY_MIN_ROOM_SQFT;
 if(!publishedRules(b,rules))notes.push(designCityStatus);
 for(const room of rooms){
   if(room.kind==="open"||room.kind==="parking"||room.kind==="stairs"||room.kind==="utility")continue;
   const min=room.kind==="living"||room.kind==="bedroom"?minimums.habitable:room.kind==="kitchen"?minimums.kitchen:minimums.bath;
   if(room.wFt*room.dFt+0.001<min){
     notes.push(room.label+" measures "+fmt(room.wFt*room.dFt)+" sq ft; below the "+fmt(min)+" sq ft "+(publishedRules(b,rules)?"verified rule":"advisory planning reference")+".");
     score-=10;
   }
 }
 const layoutErrors=validateStudioDesign(d);
 if(layoutErrors.length){blockers.push("Plan geometry has "+layoutErrors.length+" validation issues.");score=0;}
 if(publishedRules(b,rules)){
   const buildableW=b.widthFt-rules.setbacks.leftFt-rules.setbacks.rightFt;
   const buildableD=b.depthFt-rules.setbacks.frontFt-rules.setbacks.rearFt;
   const structural=rooms.filter(x=>x.floorIndex===0&&x.kind!=="open"&&x.kind!=="parking");
   if(structural.length){
     const width=Math.max(...structural.map(x=>x.xFt+x.wFt))-Math.min(...structural.map(x=>x.xFt));
     const depth=Math.max(...structural.map(x=>x.yFt+x.dFt))-Math.min(...structural.map(x=>x.yFt));
     if(width>buildableW+.001||depth>buildableD+.001){blockers.push("Structural footprint exceeds the available building envelope after verified setbacks.");score=0;}
   }
   notes.push("Verified city rules still require project-specific FAR, fire, ventilation and authority checks.");
 }
 const meetsRequestedBrief=fits&&d.bedrooms===b.bedrooms&&d.floors===b.floors&&(!b.parking||d.parking);
 score=clamp(Math.round(score),0,blockers.length?19:94);
 const grade:PlanningGrade=blockers.length?"does-not-fit":meetsRequestedBrief?"closest-concept":"review-required";
 return{slug:d.slug,score,grade,meetsRequestedBrief,plotDimensionsFit:fits,blockers,notes,needsLocalApproval:true,areaSqFt,plotAreaSqGaj:sqFtToGaj(areaSqFt)};
}
export function rankStudioDesigns(designs:readonly StudioDesign[],brief:PlotBrief,rules?:VerifiedCityRules){
 return designs.map(design=>({design,fit:evaluatePlotFit(design,brief,rules)}))
 .sort((a,b)=>Number(b.fit.plotDimensionsFit)-Number(a.fit.plotDimensionsFit)||Number(b.fit.meetsRequestedBrief)-Number(a.fit.meetsRequestedBrief)||b.fit.score-a.fit.score||a.design.slug.localeCompare(b.design.slug));
}
