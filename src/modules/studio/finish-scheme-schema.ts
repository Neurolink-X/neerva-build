import {z} from "zod";
import {finishSpaces,finishMaterials,type FinishScheme} from "./finish-model.ts";
import type {ProjectSource} from "./project-exchange.ts";
const shade=z.string().regex(/^#[0-9a-f]{6}$/i);
const material=z.enum(finishMaterials);
const room=z.object({wall:shade,floor:shade,ceiling:shade,
 wallSides:z.object({front:shade.optional(),rear:shade.optional(),left:shade.optional(),right:shade.optional()}).strict().optional(),
 materials:z.object({wall:material.optional(),floor:material.optional(),ceiling:material.optional()}).strict().optional()
}).strict();
export const finishSchemeSchema=z.object({planId:z.string().min(1).max(300),exterior:shade,accent:shade,glass:shade,cladding:material.optional(),rooms:z.record(z.string().min(1).max(200),room)}).strict();
export function validatedFinishScheme(source:ProjectSource,input:unknown):FinishScheme|null{
 const result=finishSchemeSchema.safeParse(input);if(!result.success)return null;
 const scheme=result.data,ids=finishSpaces(source).map(r=>r.id).sort(),given=Object.keys(scheme.rooms).sort();
 if(scheme.planId!==source.plan.id||ids.length!==given.length||ids.some((id,i)=>id!==given[i]))return null;
 if(source.kind==="residential"&&(scheme.exterior.toLowerCase()!==source.plan.facade.main.toLowerCase()||scheme.accent.toLowerCase()!==source.plan.facade.accent.toLowerCase()))return null;
 return {...scheme,rooms:Object.fromEntries(ids.map(id=>[id,scheme.rooms[id]]))};
}
