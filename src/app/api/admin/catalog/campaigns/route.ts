import {z} from "zod";
import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const uuid=z.string().uuid();
const create=z.object({
 pricingRuleId:uuid,title:z.string().trim().min(8).max(90),terms:z.string().trim().min(12).max(400),
 offerPaise:z.number().int().positive().max(5_000_000_000),
 startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true})
}).strict();
const update=z.object({id:uuid,status:z.enum(["published","expired"])}).strict();
const headers={"Cache-Control":"private, no-store"};
const fail=(code:number,error:string)=>Response.json({error},{status:code,headers});
async function body(request:Request){
 if(!request.headers.get("content-type")?.includes("application/json")||
    Number(request.headers.get("content-length")||0)>6000)return null;
 try{const text=await request.text();return text.length<=6000?JSON.parse(text) as unknown:null}catch{return null;}
}
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const {data,error}=await auth.client.from("catalog_campaigns")
  .select("id,pricing_rule_id,title,terms,base_amount_paise,offer_amount_paise,starts_at,ends_at,status,created_at")
  .order("created_at",{ascending:false}).limit(100);
 return error?apiFailed():apiData({campaigns:data??[]});
}
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const parsed=create.safeParse(await body(request));if(!parsed.success)return fail(400,"Provide a real pricing rule, offer amount and validity terms.");
 const v=parsed.data;
 if(Date.parse(v.endsAt)<=Date.parse(v.startsAt)||Date.parse(v.endsAt)<=Date.now())return fail(400,"Offer must end after its start and in the future.");
 const {data:price,error:pError}=await auth.client.from("pricing_rules")
  .select("id,status,visibility,valid_from,valid_to,amount_paise,unit")
  .eq("id",v.pricingRuleId).maybeSingle();
 if(pError)return apiFailed();
 if(!price||price.status!=="published"||price.visibility!=="public"||
    price.amount_paise<=0)return fail(409,"Publish a genuine public price before setting an offer.");
 if(v.offerPaise>=price.amount_paise)return fail(409,"Offer must be lower than the published base rate.");
 if(Date.parse(v.startsAt)<Date.parse(price.valid_from)||
    price.valid_to&&Date.parse(v.endsAt)>Date.parse(price.valid_to))
  return fail(409,"Offer validity must fit within the published price window.");
 const {data:saved,error}=await auth.client.from("catalog_campaigns").insert({
  pricing_rule_id:price.id,title:v.title,terms:v.terms,base_amount_paise:price.amount_paise,
  offer_amount_paise:v.offerPaise,starts_at:v.startsAt,ends_at:v.endsAt,
  created_by:auth.userId,status:"draft"
 }).select("id,status").single();
 return error||!saved?apiFailed():Response.json({campaign:saved,review:"draft"},{status:201,headers});
}
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const parsed=update.safeParse(await body(request));if(!parsed.success)return fail(400,"Invalid campaign action.");
 const v=parsed.data;
 const {data:promo,error}=await auth.client.from("catalog_campaigns")
  .select("id,pricing_rule_id,status,base_amount_paise,offer_amount_paise,starts_at,ends_at")
  .eq("id",v.id).maybeSingle();
 if(error)return apiFailed();if(!promo)return fail(404,"Campaign not found.");
 if(v.status==="published"){
  if(promo.status!=="draft")return fail(409,"Only reviewed drafts can be published.");
  if(Date.parse(promo.ends_at)<=Date.now())return fail(409,"Expired campaigns cannot be published.");
  const {data:price,error:priceErr}=await auth.client.from("pricing_rules")
   .select("amount_paise,visibility,status,valid_from,valid_to")
   .eq("id",promo.pricing_rule_id).maybeSingle();
  if(priceErr)return apiFailed();
  if(!price||price.status!=="published"||price.visibility!=="public"||
     price.amount_paise!==promo.base_amount_paise||
     promo.offer_amount_paise>=price.amount_paise||
     Date.parse(promo.starts_at)<Date.parse(price.valid_from)||
     price.valid_to&&Date.parse(promo.ends_at)>Date.parse(price.valid_to))
   return fail(409,"Base price or validity changed. Create a fresh reviewed promotion.");
 }else if(promo.status!=="published")return fail(409,"Only published campaigns can be expired.");
 const values:Record<string,unknown>={status:v.status};
 if(v.status==="published"){values.published_at=new Date().toISOString();values.published_by=auth.userId;}
 const {data:saved,error:write}=await auth.client.from("catalog_campaigns")
  .update(values).eq("id",v.id).eq("status",promo.status).select("id,status").maybeSingle();
 if(write)return apiFailed();if(!saved)return fail(409,"Campaign changed before review. Refresh and retry.");
 return apiData({campaign:saved});
}
