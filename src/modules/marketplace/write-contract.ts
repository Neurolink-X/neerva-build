import {z} from "zod";
import {allMaterialUnits} from "../catalog/category-units.ts";
const uuid=z.string().uuid();
const slug=z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(90);
const text=(max:number)=>z.string().trim().min(2).max(max);
const attributeValues=z.record(z.string().trim().min(1).max(48),z.union([z.string().max(200),z.number().finite(),z.boolean()])).refine(v=>Object.keys(v).length<=30,"Up to 30 specifications allowed");
const attributes=attributeValues.default({});
const state=z.enum(["draft","published","archived"]);
const addBase=z.object({action:z.literal("create"),status:z.never().optional()});
export const catalogCommand=z.discriminatedUnion("kind",[
 addBase.extend({kind:z.literal("category"),slug,nameEn:text(120),nameHi:text(120),pricingMode:z.enum(["public","quote_only"])}).strict(),
 addBase.extend({kind:z.literal("brand"),slug,name:text(120),authorizedSource:z.string().url().max(500).optional()}).strict(),
 addBase.extend({kind:z.literal("product"),slug,categoryId:uuid,brandId:uuid.optional(),name:text(180),description:z.string().trim().max(2000),attributes}).strict(),
 addBase.extend({kind:z.literal("variant"),productId:uuid,sku:text(100),unit:z.enum(allMaterialUnits as [string,...string[]]),attributes}).strict()
]);
export const catalogUpdate=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("category"),id:uuid,status:state,nameEn:text(120).optional(),nameHi:text(120).optional(),pricingMode:z.enum(["public","quote_only"]).optional()}).strict(),
 z.object({kind:z.literal("brand"),id:uuid,status:state,name:text(120).optional(),authorizedSource:z.string().url().max(500).optional()}).strict(),
 z.object({kind:z.literal("product"),id:uuid,status:state,name:text(180).optional(),description:z.string().trim().max(2000).optional(),attributes:attributeValues.optional()}).strict(),
 z.object({kind:z.literal("variant"),id:uuid,status:state,attributes:attributeValues.optional()}).strict()
]);
export const inventoryWrite=z.object({
 branchId:uuid,variantId:uuid,quantity:z.number().finite().min(0).max(1_000_000),unit:z.enum(allMaterialUnits as [string,...string[]])
}).strict();
const cost=z.number().int().min(0).max(5_000_000_000);
export const offerWrite=z.object({
 quoteRequestId:uuid,tenantId:uuid,
 lines:z.array(z.object({
  description:text(180),quantity:z.number().finite().positive().max(1_000_000),
  unit:z.enum(allMaterialUnits as [string,...string[]]),unitPricePaise:cost
 }).strict()).min(1).max(30),
 taxPaise:cost,freightPaise:cost,unloadingPaise:cost,terms:z.string().trim().min(10).max(2000),
 validUntil:z.string().datetime({offset:true})
}).strict().superRefine((v,ctx)=>{
 const future=Date.parse(v.validUntil)-Date.now();
 if(!Number.isFinite(future)||future<60_000||future>30*86400_000)ctx.addIssue({code:"custom",path:["validUntil"],message:"Validity must be 1 minute to 30 days from now."});
 const subtotal=v.lines.reduce((sum,line)=>sum+Math.round(line.unitPricePaise*line.quantity),0);
 if(!Number.isSafeInteger(subtotal)||subtotal>5_000_000_000)ctx.addIssue({code:"custom",path:["lines"],message:"Amount outside safe quotation range."});
});
export function calculateOffer(value:z.infer<typeof offerWrite>){
 const subtotalPaise=value.lines.reduce((sum,line)=>sum+Math.round(line.unitPricePaise*line.quantity),0);
 const totalPaise=subtotalPaise+value.taxPaise+value.freightPaise+value.unloadingPaise;
 if(!Number.isSafeInteger(totalPaise)||totalPaise>20_000_000_000)throw Error("Offer total invalid");
 return {subtotalPaise,totalPaise};
}
export const inviteWrite=z.object({requestId:uuid,tenantId:uuid}).strict();
export function errorFields(error:z.ZodError){return error.issues.map(issue=>({field:issue.path.join("."),message:issue.message})).slice(0,12)}
