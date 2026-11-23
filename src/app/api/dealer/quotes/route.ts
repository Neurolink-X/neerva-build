import {apiData,apiFailed,requireDealer} from "@/modules/identity/server-auth";
import {offerWrite,calculateOffer,errorFields} from "@/modules/marketplace/write-contract";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
const err=(status:number,error:string,fields?:unknown)=>Response.json({error,...(fields?{fields}:{})},{status,headers});
export async function GET(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 try{const [a,b]=await Promise.all([
  auth.client.from("quote_invites").select("quote_request_id,tenant_id,status,invited_at,request:quote_requests(id,category_slug,material_description,quantity,unit,city,pincode,status,created_at)").in("tenant_id",auth.tenantIds).limit(100),
  auth.client.from("quote_offers").select("id,quote_request_id,tenant_id,revision,line_items,subtotal_paise,tax_paise,freight_paise,unloading_paise,total_paise,valid_until,terms").in("tenant_id",auth.tenantIds).limit(100)
 ]);return a.error||b.error?apiFailed():apiData({invites:a.data??[],offers:b.data??[]})}catch{return apiFailed()}
}
export async function POST(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json"))return err(415,"JSON required.");
 let raw:unknown;
 try{const s=await request.text();if(s.length>14000)return err(413,"Offer exceeds size limit.");raw=JSON.parse(s)}catch{return err(400,"Invalid JSON.");}
 const parsed=offerWrite.safeParse(raw);
 if(!parsed.success)return err(400,"Check itemized offer fields.",errorFields(parsed.error));
 const offer=parsed.data;
 if(!auth.tenantIds.includes(offer.tenantId))return err(403,"This dealer tenant is not approved for this account.");
 try{
  const [invite,role,previous]=await Promise.all([
   auth.client.from("quote_invites").select("status,request:quote_requests(status)").eq("quote_request_id",offer.quoteRequestId).eq("tenant_id",offer.tenantId).maybeSingle(),
   auth.client.from("tenant_memberships").select("role,active").eq("tenant_id",offer.tenantId).eq("user_id",auth.userId).maybeSingle(),
   auth.client.from("quote_offers").select("revision").eq("quote_request_id",offer.quoteRequestId).eq("tenant_id",offer.tenantId).order("revision",{ascending:false}).limit(1)
  ]);
  if(invite.error||role.error||previous.error)return apiFailed();
  if(!role.data?.active||!["owner","manager","sales"].includes(role.data.role))return err(403,"Sales permission required to submit an offer.");
  const linked=Array.isArray(invite.data?.request)?invite.data?.request[0]:invite.data?.request;
  if(!invite.data||!["invited","viewed"].includes(invite.data.status)||linked?.status!=="open")return err(409,"No open customer request is assigned to your dealer.");
  const amounts=calculateOffer(offer);
  const revision=Number(previous.data?.[0]?.revision??0)+1;
  const {data:saved,error}=await auth.client.from("quote_offers").insert({
   quote_request_id:offer.quoteRequestId,tenant_id:offer.tenantId,created_by:auth.userId,
   revision,line_items:offer.lines,subtotal_paise:amounts.subtotalPaise,
   tax_paise:offer.taxPaise,freight_paise:offer.freightPaise,unloading_paise:offer.unloadingPaise,
   total_paise:amounts.totalPaise,terms:offer.terms,valid_until:offer.validUntil,currency:"INR"
  }).select("id,quote_request_id,tenant_id,revision,total_paise,valid_until").single();
  if(error)return err(error.code==="23505"?409:503,error.code==="23505"?"An offer revision was submitted concurrently. Refresh and retry.":"Offer was not saved.");
  return Response.json({offer:saved,stored:true,note:"Offer submitted for customer consideration; no order or payment created."},{status:201,headers});
 }catch{return apiFailed()}
}
