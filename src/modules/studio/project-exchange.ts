import {area,planGeometryDigest,planMetrics,validatePlan,type PlanModel,type Rect} from "./plan-model.ts";
import {validateBuildingConcept,type BuildingConcept} from "./building-purpose.ts";
import {validMaterialQuantity,type MaterialCategory,type MaterialQuantityUnit} from "../catalog/category-units.ts";
export type ProjectSource={kind:"residential";plan:PlanModel}|{kind:"commercial";plan:BuildingConcept};
export type Space=Rect&{id:string;floor:number;kind:string;label:string;covered:boolean};
export type QuantityLine={id:string;label:string;quantity:number;unit:"square_foot"|"litre";category:MaterialCategory|null;basis:string;sourceIds:string[]};
const excluded=new Set(["parking","verandah","balcony","terrace","open"]);
export function projectSpaces(source:ProjectSource):Space[]{
 const rows=source.kind==="residential"?source.plan.rooms:source.plan.zones;
 return rows.map(r=>({id:r.id,floor:r.floor,kind:r.kind,label:r.label,x:r.x,y:r.y,w:r.w,d:r.d,covered:!excluded.has(r.kind)}));
}
export function conceptTakeoff(source:ProjectSource):QuantityLine[]{
 if(projectErrors(source).length)return [];
 const spaces=projectSpaces(source),covered=spaces.filter(s=>s.covered),out:QuantityLine[]=[];
 for(const floor of [...new Set(covered.map(s=>s.floor))].sort((a,b)=>a-b)){
  const rows=covered.filter(s=>s.floor===floor);
  out.push({id:"floor-"+floor,label:"Level "+(floor+1)+" covered rectangle area",quantity:rows.reduce((n,s)=>n+area(s),0),unit:"square_foot",category:null,basis:"Gross conceptual space rectangles, not net finish or order quantity.",sourceIds:rows.map(s=>s.id)});
 }
 if(source.kind==="residential"){
  const metrics=planMetrics(source.plan);
  out.push({id:"paint",label:"Illustrative interior wall paint",quantity:metrics.paintLitres,unit:"litre",category:"paint",basis:"Two coats, assumed 10 m²/L per coat. Verify wall finishes, manufacturer coverage, preparation and wastage.",sourceIds:covered.map(s=>s.id)});
 }
 return out;
}
export function projectErrors(s:ProjectSource){return s.kind==="residential"?validatePlan(s.plan):validateBuildingConcept(s.plan);}
export async function createProjectExchange(source:ProjectSource){
 const errors=projectErrors(source);if(errors.length)throw new Error("Concept geometry failed validation.");
 const p=source.plan,spaces=projectSpaces(source);
 const digest=source.kind==="residential"?await planGeometryDigest(source.plan):Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify([source.plan.brief,spaces.map(s=>[s.id,s.floor,s.kind,s.x,s.y,s.w,s.d]).sort()])))),x=>x.toString(16).padStart(2,"0")).join("");
 return {schema:"neerva.spatial-concept",schemaVersion:1,units:"ft",coordinateSystem:"site-local x along frontage; y away from road; north orientation stored separately",approval:"CONCEPT_ONLY",planId:p.id,geometryDigest:digest,source,spaces,quantities:conceptTakeoff(source),unsupported:["Certified IFC exchange","Structural and MEP quantities","Statutory compliance","Approved construction BOQ"]};
}
/** Only explicitly reviewed quantities enter the existing request form.
 * This link never creates orders, reserves stock or guarantees current pricing. */
export function reviewedQuoteHref(category:MaterialCategory,unit:MaterialQuantityUnit,quantity:number,material:string){
 const label=material.trim();if(label.length<3||label.length>240||!validMaterialQuantity(category,unit,quantity))return null;
 return "/quotes?"+new URLSearchParams({category,unit,quantity:String(quantity),material:label});
}
