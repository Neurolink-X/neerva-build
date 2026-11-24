import {requireDealer} from "@/modules/identity/server-auth";
import {dealerOrderStatusInput,ORDER_FIELDS,ORDER_RESPONSE_HEADERS,parseOrderJson,failOrder,safeOrderError,statusForOrderError} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";export const runtime="nodejs";
/** RLS + approved membership + active tenant keep addresses private. */
export async function GET(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 try{
  const {data,error}=await auth.client.from("orders").select(ORDER_FIELDS)
   .in("tenant_id",auth.tenantIds).order("created_at",{ascending:false}).limit(100);
  if(error)return failOrder(503,"Your dealer orders are temporarily unavailable.");
  return Response.json({orders:data??[],source:"approved_dealer_orders"},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Dealer orders could not be loaded.");}
}
export async function PATCH(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 const input=dealerOrderStatusInput.safeParse(await parseOrderJson(request,1500));
 if(!input.success)return failOrder(400,"Invalid dealer order action.");
 const {orderId,expectedStatus,status}=input.data;
 try{
  // The SQL trigger independently enforces owner/manager/dispatch permissions,
  // verified dealer approval and legal state transitions inside the transaction.
  const {data,error}=await auth.client.from("orders").update({status})
   .eq("id",orderId).in("tenant_id",auth.tenantIds).eq("status",expectedStatus)
   .select(ORDER_FIELDS).maybeSingle();
  if(error)return failOrder(statusForOrderError(error),safeOrderError(error));
  if(!data)return failOrder(409,"Order status changed or this order is not accessible. Refresh.");
  return Response.json({order:data,stored:true,audited:true,paymentTaken:false},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Dealer order status was not saved.");}
}
