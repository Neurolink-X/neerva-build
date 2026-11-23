import type {PlanModel} from "./plan-model.ts";
export type City="Kanpur"|"Ranchi";
export type PlanningRegulation={
 city:City;
 authority:string;
 referenceUrl:string;
 lastReviewed:string|null;
 status:"draft"|"verified";
 setbacksFt:{frontFt:number;rearFt:number;leftFt:number;rightFt:number};
 minimums:{bedroomSqFt:number;livingSqFt:number;kitchenSqFt:number;stairClearWidthFt:number;parkingWidthFt:number;parkingDepthFt:number};
 maximumFar:number|null;
 verifiedBy:string|null;
};
/** References are official research starting points, NOT approved values for any plot. */
export const draftRegulations:Record<City,PlanningRegulation>={
 Kanpur:{city:"Kanpur",authority:"Kanpur Development Authority / applicable local authority",
  referenceUrl:"https://www.upavp.in/site/writereaddata/siteContent/202508211643097834UP%20Model%20Building%20Bylaws%202025%20English.pdf",
  lastReviewed:null,status:"draft",setbacksFt:{frontFt:0,rearFt:0,leftFt:0,rightFt:0},
  minimums:{bedroomSqFt:95,livingSqFt:95,kitchenSqFt:48,stairClearWidthFt:3.25,parkingWidthFt:8,parkingDepthFt:16},
  maximumFar:null,verifiedBy:null},
 Ranchi:{city:"Ranchi",authority:"Ranchi Municipal Corporation / applicable Jharkhand authority",
  referenceUrl:"",lastReviewed:null,status:"draft",setbacksFt:{frontFt:0,rearFt:0,leftFt:0,rightFt:0},
  minimums:{bedroomSqFt:95,livingSqFt:95,kitchenSqFt:48,stairClearWidthFt:3.25,parkingWidthFt:8,parkingDepthFt:16},
  maximumFar:null,verifiedBy:null}
};
export function regulationEvidenceErrors(rule:PlanningRegulation):string[]{
 const fail:string[]=[];
 if(rule.status!=="verified")fail.push("Local setback/FAR/stair rules not approved");
 if(!rule.verifiedBy?.trim())fail.push("Licensed reviewer missing");
 if(!rule.lastReviewed||!Number.isFinite(Date.parse(rule.lastReviewed)))fail.push("Review date missing");
 if(!/^https:\/\//.test(rule.referenceUrl))fail.push("Authority source missing");
 if(rule.maximumFar===null||!Number.isFinite(rule.maximumFar)||rule.maximumFar<=0)fail.push("Verified FAR missing");
 const vals=[...Object.values(rule.setbacksFt),...Object.values(rule.minimums)];
 if(vals.some(x=>!Number.isFinite(x)||x<0))fail.push("Invalid verified dimensions");
 return fail;
}
export function canPublishPlan(p:PlanModel,rule:PlanningRegulation):boolean{
 if(regulationEvidenceErrors(rule).length||p.setbacks.verified!==true)return false;
 if(p.plot.widthFt<=0||p.plot.depthFt<=0)return false;
 const a=p.setbacks,b=rule.setbacksFt;
 return a.frontFt>=b.frontFt&&a.rearFt>=b.rearFt&&a.leftFt>=b.leftFt&&a.rightFt>=b.rightFt;
}
