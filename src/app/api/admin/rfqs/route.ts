import {apiData,apiFailed,notReady,requireAdmin} from "@/modules/identity/server-auth";
import {attachSourcingStatus,type RfqRow,type InviteRow,type OfferRow} from "@/modules/orders/sourcing";
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
export async function POST(request:Request){
 const auth=await requireAdmin(request);
 return auth instanceof Response?auth:notReady();
}
export const PATCH=POST;
