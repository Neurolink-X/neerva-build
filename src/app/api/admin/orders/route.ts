import {requireAdmin} from "@/modules/identity/server-auth";
import {adminOrderStatusInput,ORDER_FIELDS,ORDER_RESPONSE_HEADERS,parseOrderJson,failOrder,safeOrderError,statusForOrderError} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";export const runtime="nodejs";
/** Admin sees only actual PostgreSQL accepted offers, never RFQs as fake orders. */
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{
  const {data,error}=await auth.client.from("orders").select(ORDER_FIELDS)
   .order("created_at",{ascending:false}).limit(100);
  if(error)return failOrder(503,"Admin order database is not ready.");
  return Response.json({orders:data??[],source:"verified_order_database"},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Admin orders could not be loaded.");}
}
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const input=adminOrderStatusInput.safeParse(await parseOrderJson(request,1500));
 if(!input.success)return failOrder(400,"Invalid admin order status transition.");
 const {orderId,expectedStatus,status}=input.data;
 try{
  const {data,error}=await auth.client.from("orders").update({status})
   .eq("id",orderId).eq("status",expectedStatus).select(ORDER_FIELDS).maybeSingle();
  if(error)return failOrder(statusForOrderError(error),safeOrderError(error));
  if(!data)return failOrder(409,"Order has moved or is no longer accessible. Refresh.");
  return Response.json({order:data,stored:true,audited:true,paymentTaken:false},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Order status change was not saved.");}
}
