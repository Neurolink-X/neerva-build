import {validateStudioDesign,studioDesigns,type StudioDesign} from "./library.ts";
import {validatePlan,type PlanModel} from "./plan-model.ts";
import {canPublishPlan,type PlanningRegulation} from "./city-rules.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
export type PublicationDecision={status:"draft"|"published";reasons:string[];structuralSignature:string};
/** No colors, swatch names, illustration URLs or prices in identity. */
export function structuralSignature(d:StudioDesign):string{
 const plan=d.layout.rooms.map(r=>[r.floorIndex,r.kind,r.xFt,r.yFt,r.wFt,r.dFt,
  r.openings.map(o=>[o.kind,o.wall,o.offsetFt,o.widthFt,o.sillFt,o.heightFt].join(":")).sort().join(",")].join(":")).sort().join("|");
 return plan+"#"+d.elevation.mass+"#"+d.roof+"#"+d.layout.wallThicknessFt;
}
function sameGeneratedGeometry(d:StudioDesign,p:PlanModel):boolean{
 const derived=studioDesignFromPlan(p);
 const sorted=(rooms:StudioDesign["layout"]["rooms"])=>rooms.map(r=>[r.id,r.floorIndex,r.xFt,r.yFt,r.wFt,r.dFt,
  r.openings.map(o=>[o.kind,o.wall,o.offsetFt,o.widthFt,o.sillFt,o.heightFt].join("/")).sort().join(",")].join("|")).sort().join(";");
 return sorted(d.layout.rooms)===sorted(derived.layout.rooms)&&
  d.plot.widthFt===p.plot.widthFt&&d.plot.depthFt===p.plot.depthFt&&d.floors===p.floors;
}
export function assessPublication(d:StudioDesign,
 {plan,regulation,reviewer,alreadyPublished=new Set<string>()}:{plan?:PlanModel;regulation?:PlanningRegulation;reviewer?:string;alreadyPublished?:ReadonlySet<string>}={}
):PublicationDecision{
 const reasons:string[]=[];
 for(const r of validateStudioDesign(d))reasons.push(r);
 if(d.costRangePerSqFt.status!=="verified")reasons.push("Material and cost disclosure is not admin-verified");
 if(d.parking){
  const validBay=d.layout.rooms.some(r=>r.floorIndex===0&&r.kind==="parking"&&
   ((r.wFt>=8&&r.dFt>=16)||(r.wFt>=16&&r.dFt>=8)));
  if(!validBay)reasons.push("Car bay lacks a clear 8 × 16 ft rectangle");
 }
 if(d.model.format!=="neerva-plan-model-v1-adapter"||!plan)reasons.push("Not derived from a reviewed PlanModel");
 else{
  for(const e of validatePlan(plan))reasons.push("PlanModel: "+e);
  if(!sameGeneratedGeometry(d,plan))reasons.push("2D/3D room and opening data differ from PlanModel");
  if(!regulation||!canPublishPlan(plan,regulation))reasons.push("City rule approval and signed setbacks missing");
 }
 if(!reviewer?.trim())reasons.push("Licensed architect / engineer publication sign-off missing");
 const signature=structuralSignature(d);
 if(alreadyPublished.has(signature))reasons.push("Duplicate plan + facade + massing fingerprint");
 return {status:reasons.length?"draft":"published",reasons:[...new Set(reasons)],structuralSignature:signature};
}
/** Drafts remain browsable only as inspirational references, not published plans. */
export const legacyPublication=studioDesigns.map(design=>({design,...assessPublication(design)}));
export const publishedDesigns=legacyPublication.filter(x=>x.status==="published").map(x=>x.design);
export const draftDesigns=legacyPublication.filter(x=>x.status==="draft").map(x=>x.design);
