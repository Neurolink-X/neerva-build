import {z} from "zod";
import {buildingPurposes,generateBuildingConcepts,buildingLayoutFamily,type BuildingBrief} from "./building-purpose.ts";
import {finishSchemeSchema,validatedFinishScheme} from "./finish-scheme-schema.ts";
import {projectErrors} from "./project-exchange.ts";
export const commercialBriefSchema=z.object({purpose:z.enum(buildingPurposes),widthFt:z.number().finite().min(20).max(500),depthFt:z.number().finite().min(30).max(600),roadSide:z.enum(["N","E","S","W"]),floors:z.number().int().min(1).max(6),unitsPerFloor:z.number().int().min(1).max(24),parkingBays:z.number().int().min(0).max(40),frontFt:z.number().finite().min(0).max(300),rearFt:z.number().finite().min(0).max(300),sideFt:z.number().finite().min(0).max(100),rentalBedrooms:z.number().int().min(1).max(3).optional()}).strict();
export const commercialSaveSchema=z.object({idempotencyKey:z.string().uuid(),title:z.string().trim().min(3).max(120),brief:commercialBriefSchema,planId:z.string().min(1).max(300),signature:z.string().min(1).max(90000),finishes:finishSchemeSchema}).strict();
export function rebuildCommercialSnapshot(input:z.infer<typeof commercialSaveSchema>){
 const brief:BuildingBrief=input.brief;
 const plan=generateBuildingConcepts(brief,24,buildingLayoutFamily(input.planId)).plans.find(p=>p.id===input.planId&&p.signature===input.signature);
 if(!plan||projectErrors({kind:"commercial",plan}).length)return null;
 const finishes=validatedFinishScheme({kind:"commercial",plan},input.finishes);
 return finishes?{schemaVersion:1,kind:"commercial",approval:"CONCEPT_ONLY",plan,finishes}:null;
}
