import {z} from "zod";
import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {validProductQuantity,validUnitQuantity} from "@/modules/catalog/category-units";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=z.string().uuid();
const create=z.object({
 variantId:uuid,tenantId:uuid.optional(),branchId:uuid.optional(),
 city:z.string().trim().min(2).max(80),pincodePrefix:z.string().regex(/^[1-9][0-9]{0,5}$/).optional(),
 minimumQuantity:z.number().finite().positive().max(1_000_000),unit:z.string().min(2).max(32),
 amountPaise:z.number().int().min(0).max(5_000_000_000),visibility:z.enum(["public","quote_only"]),
 validFrom:z.string().datetime({offset:true}),validTo:z.string().datetime({offset:true}).optional()
}).strict().superRefine((v,ctx)=>{
 if(!validUnitQuantity(v.unit,v.minimumQuantity))ctx.addIssue({code:"custom",path:["minimumQuantity"],message:"Quantity must match the selected unit."});
 if(v.branchId&&!v.tenantId)ctx.addIssue({code:"custom",path:["tenantId"],message:"Branch requires a tenant."});
 if(v.validTo&&Date.parse(v.validTo)<=Date.parse(v.validFrom))ctx.addIssue({code:"custom",path:["validTo"],message:"End must be after start."});
});
const update=z.object({id:uuid,amountPaise:z.number().int().min(0).max(5_000_000_000).optional(),
 status:z.enum(["draft","pending_approval","published","expired","rejected"]).optional(),
 validTo:z.string().datetime({offset:true}).nullable().optional()}).strict().refine(v=>v.amountPaise!==undefined||v.status!==undefined||v.validTo!==undefined);
const fail=(status:number,error:string)=>Response.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
async function read(request:Request){if(!request.headers.get("content-type")?.includes("application/json"))return null;try{const text=await request.text();return text.length<=5000?JSON.parse(text) as unknown:null}catch{return null}}
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const r=await auth.client.from("pricing_rules")
 .select("id,tenant_id,branch_id,variant_id,city,pincode_prefix,minimum_quantity,unit,amount_paise,visibility,status,valid_from,valid_to,version")
 .order("created_at",{ascending:false}).limit(150);
 return r.error?apiFailed():apiData({prices:r.data??[],currency:"INR",source:"real_database"});}catch{return apiFailed()}
}
async function validateVariant(client:Awaited<ReturnType<typeof requireAdmin>>,id:string,unit:string,minimumQuantity:number){
 if(client instanceof Response)return false;
 const {data:v,error}=await client.client.from("product_variants").select("id,sku,attributes,unit,status,product:products(slug,status,category:categories(slug,status,pricing_mode))").eq("id",id).maybeSingle();
 if(error||!v||v.unit!==unit||v.status!=="published"||/^NEERVA-REF-/i.test(v.sku)||v.attributes?.reference_only===true)return false;
 const p=Array.isArray(v.product)?v.product[0]:v.product;
 const c=p?(Array.isArray(p.category)?p.category[0]:p.category):null;
 return p?.status==="published"&&c?.status==="published"&&validProductQuantity(String(c.slug),String(p.slug),unit,minimumQuantity);
}
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const p=create.safeParse(await read(request));if(!p.success)return fail(400,"Invalid pricing inputs.");
 const v=p.data;
 try{
  if(!await validateVariant(auth,v.variantId,v.unit,v.minimumQuantity))return fail(409,"Publish the real catalog product and variant first; match its unit.");
  if(v.tenantId){const {data:t}=await auth.client.from("tenants").select("id,status").eq("id",v.tenantId).maybeSingle();if(t?.status!=="active")return fail(409,"Dealer is not approved or active.");}
  if(v.branchId){const {data:b}=await auth.client.from("merchant_branches").select("tenant_id,approved").eq("id",v.branchId).maybeSingle();if(!b?.approved||b.tenant_id!==v.tenantId)return fail(409,"Branch must be approved and belong to the dealer.");}
  const {data:saved,error}=await auth.client.from("pricing_rules").insert({
   tenant_id:v.tenantId??null,branch_id:v.branchId??null,variant_id:v.variantId,city:v.city,pincode_prefix:v.pincodePrefix??null,
   minimum_quantity:v.minimumQuantity,unit:v.unit,amount_paise:v.amountPaise,currency:"INR",
   visibility:v.visibility,status:"draft",valid_from:v.validFrom,valid_to:v.validTo??null,created_by:auth.userId
  }).select("id,variant_id,amount_paise,unit,version,status").single();
  if(error||!saved)return apiFailed();return Response.json({rule:saved,stored:true,approval:"draft"},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch{return apiFailed()}
}
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const p=update.safeParse(await read(request));if(!p.success)return fail(400,"Invalid pricing update.");
 const {data:old,error:lookup}=await auth.client.from("pricing_rules").select("id,status,variant_id,unit,minimum_quantity,tenant_id,branch_id,visibility,valid_from,valid_to,amount_paise,version").eq("id",p.data.id).maybeSingle();
 if(lookup)return apiFailed();if(!old)return fail(404,"Pricing rule not found.");
 const nextAmount=p.data.amountPaise??Number(old.amount_paise),nextEnd=p.data.validTo===undefined?old.valid_to:p.data.validTo;
 const nextStatus=p.data.status??old.status;
 if(nextEnd&&Date.parse(nextEnd)<=Date.parse(old.valid_from))return fail(400,"End must be after start.");
 if(nextStatus==="published"&&old.visibility==="public"&&(!Number.isSafeInteger(nextAmount)||nextAmount<=0))return fail(409,"A public price must be positive.");
 if(old.status==="published"&&(p.data.amountPaise!==undefined||p.data.validTo!==undefined))return fail(409,"Create a new reviewed pricing rule; published amounts and validity cannot be edited in place.");
 if(p.data.status==="published"&&nextEnd&&Date.parse(nextEnd)<=Date.now())return fail(409,"Cannot publish an expired price.");
 if(p.data.status==="published"){
  if(!await validateVariant(auth,old.variant_id,old.unit,Number(old.minimum_quantity)))return fail(409,"Publish a valid parent product and variant before price.");
  if(old.tenant_id){
   const {data:dealer}=await auth.client.from("tenants").select("status").eq("id",old.tenant_id).maybeSingle();
   if(dealer?.status!=="active")return fail(409,"Dealer is not approved.");
  }
  if(old.branch_id){
   const {data:branch}=await auth.client.from("merchant_branches").select("approved,tenant_id").eq("id",old.branch_id).maybeSingle();
   if(!branch?.approved||branch.tenant_id!==old.tenant_id)return fail(409,"Branch is not approved.");
  }
  if(new Date(old.valid_from).getTime()>Date.now()+30*86400_000)return fail(409,"Publication start too far ahead.");
 }
 if(p.data.status==="published"&&!["draft","pending_approval"].includes(old.status))return fail(409,"Already-published rules require a new approval cycle.");
 const values:Record<string,unknown>={};
 if(p.data.amountPaise!==undefined)values.amount_paise=p.data.amountPaise;
 if(p.data.status!==undefined)values.status=p.data.status;
 if(p.data.validTo!==undefined)values.valid_to=p.data.validTo;
 try{const {data:saved,error}=await auth.client.from("pricing_rules").update(values).eq("id",p.data.id).eq("version",old.version).eq("status",old.status)
 .select("id,amount_paise,unit,status,version,valid_from,valid_to").maybeSingle();
 if(error)return apiFailed();if(!saved)return fail(409,"Pricing rule changed during review. Reload before retrying.");
 return apiData({rule:saved,stored:true,historyRecorded:true});}catch{return apiFailed()}
}
