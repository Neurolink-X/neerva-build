import {generateRoadPlans} from "./road-generator.ts";
import {validatePlan,type PlanModel,type FacadeKit,type MassingType,type PlanBrief} from "./plan-model.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {structuralSignature,assessPublication} from "./design-publication.ts";
export const facadeKits=[
 {id:"simple-parapet",en:"Simple parapet",hi:"सादा पैरापेट"},
 {id:"stepped-band",en:"Stepped band",hi:"स्टेप्ड बैंड"},
 {id:"jali-screen",en:"Jali screen",hi:"जाली स्क्रीन"},
 {id:"cantilever",en:"Balcony overhang",hi:"बालकनी छज्जा"},
 {id:"pergola",en:"Pergola beams",hi:"परगोला"},
 {id:"cladding-band",en:"Cladding band",hi:"क्लैडिंग बैंड"}
] as const satisfies readonly {id:FacadeKit;en:string;hi:string}[];
export const massingOptions=[
 {id:"box",en:"Full box mass",hi:"सादा ब्लॉक"},
 {id:"stepped",en:"Stepped facade mass",hi:"स्टेप्ड फ्रंट"}
] as const satisfies readonly {id:MassingType;en:string;hi:string}[];
export type FacadeDraft={id:string;plan:PlanModel;signature:string;status:"draft";reasons:string[]};
/** Structural facade variations of checked geometry; not permitted plans.
 * Exactly 2 mirrored plan footprints × 6 real facade kits × 2 mass forms = 24
 * distinct *composite* designs. Never claim these are 24 distinct floorplans.
 */
export function generateFacadeDrafts(brief:PlanBrief):FacadeDraft[]{
 const {plans}=generateRoadPlans(brief),out:FacadeDraft[]=[],seen=new Set<string>();
 for(const p of plans)for(const kit of facadeKits)for(const massing of massingOptions){
  const model:PlanModel={...p,id:p.id+"-"+kit.id+"-"+massing.id,
   facade:{...p.facade,kit:kit.id,massing:massing.id}};
  const errors=validatePlan(model);
  if(errors.length)continue;
  const design=studioDesignFromPlan(model),signature=structuralSignature(design);
  if(seen.has(signature))throw new Error("Duplicate composite design fingerprint");
  seen.add(signature);
  const approval=assessPublication(design,{plan:model});
  out.push({id:model.id,plan:model,signature,status:"draft",
   reasons:approval.reasons.length?approval.reasons:["Licensed architect approval pending"]});
 }
 return out;
}
