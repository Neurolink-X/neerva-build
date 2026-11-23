import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {attachSourcingStatus,type RfqRow,type InviteRow,type OfferRow} from "@/modules/orders/sourcing";
import {inviteWrite,errorFields} from "@/modules/marketplace/write-contract";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{
  // All records are real database requests. No demo procurement cases.
  const r=await auth.client.from("quote_requests")
   .select("id,category_slug,material_description,quantity,unit,city,pincode,status,created_at")
   .order("created_at",{ascending:false}).limit(100);
  if(r.error)return apiFailed();
  const requests=(r.data??[]) as RfqRow[];
  if(!requests.length)return apiData({requests:[],queue:{adminSourcing:0,awaitingDealers:0,offersReceived:0},note:"No customer material requests recorded. No dealer or admin fulfilment is implied."});
  const ids=requests.map(q=>q.id);
  const [invite,offer]=await Promise.all([
   auth.client.from("quote_invites").select("quote_request_id,status").in("quote_request_id",ids),
   auth.client.from("quote_offers").select("quote_request_id").in("quote_request_id",ids)
  ]);
  if(invite.error||offer.error)return apiFailed();
  const mapped=attachSourcingStatus(requests,(invite.data??[]) as InviteRow[],(offer.data??[]) as OfferRow[]);
  return apiData({requests:mapped,queue:{
   adminSourcing:mapped.filter(q=>q.sourcing_status==="admin_sourcing_needed").length,
   awaitingDealers:mapped.filter(q=>q.sourcing_status==="dealer_reply_pending").length,
   offersReceived:mapped.filter(q=>q.sourcing_status==="offers_received").length
  },note:"Sourcing is pending review. A request is not a paid order, allocated dealer or confirmed delivery."});
 }catch{return apiFailed();}
}
/** An invitation is procurement outreach, never a delivery promise or accepted order. */
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json"))return Response.json({error:"JSON required"},{status:415});
 let body:unknown;try{const s=await request.text();if(s.length>2500)return Response.json({error:"Request too large"},{status:413});body=JSON.parse(s)}catch{return Response.json({error:"Invalid JSON"},{status:400})}
 const check=inviteWrite.safeParse(body);
 if(!check.success)return Response.json({error:"Invalid invitation.",fields:errorFields(check.error)},{status:400});
 const {requestId,tenantId}=check.data;
 try{
  const [rfq,tenant,applications,branches]=await Promise.all([
   auth.client.from("quote_requests").select("id,status,city,pincode").eq("id",requestId).maybeSingle(),
   auth.client.from("tenants").select("id,status").eq("id",tenantId).maybeSingle(),
   auth.client.from("dealer_applications").select("id,status").eq("tenant_id",tenantId).eq("status","approved").limit(1),
   auth.client.from("merchant_branches").select("id,city,pincode,approved").eq("tenant_id",tenantId).eq("approved",true).limit(10)
  ]);
  if(rfq.error||tenant.error||applications.error||branches.error)return apiFailed();
  if(!rfq.data||rfq.data.status!=="open")return Response.json({error:"Only open, real customer requests can be assigned."},{status:409});
  if(tenant.data?.status!=="active"||!applications.data?.length||!branches.data?.length)
   return Response.json({error:"Dealer requires approved KYC, active tenancy and approved branch."},{status:409});
  const match=branches.data.some(b=>b.pincode===rfq.data.pincode);
  const {data:saved,error}=await auth.client.from("quote_invites")
   .insert({quote_request_id:requestId,tenant_id:tenantId,invited_by:auth.userId,status:"invited"})
   .select("quote_request_id,tenant_id,status,invited_at").single();
  if(error?.code==="23505")return Response.json({error:"Dealer already invited to this request."},{status:409});
  if(error)return apiFailed();
  return Response.json({invite:saved,stored:true,coverage:match?"same_branch_pin":"requires_explicit_dealer_confirmation",
   note:"Dealer invitation saved. No stock, delivery, price or acceptance is confirmed."},
   {status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch{return apiFailed()}
}
