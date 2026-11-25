import {stockConfirmationEnabled} from "@/modules/orders/stock-confirmation";
import {requireDealer} from "@/modules/identity/server-auth";
import {dealerOrderStatusInput,ORDER_FIELDS,ORDER_RESPONSE_HEADERS,parseOrderJson,failOrder,safeOrderError,statusForOrderError} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";export const runtime="nodejs";
type DealerAuth=Extract<Awaited<ReturnType<typeof requireDealer>>,{userId:string}>;
async function orderTenantIds(auth:DealerAuth):Promise<string[]|Response>{
 const {data,error}=await auth.client.from("tenant_memberships")
  .select("tenant_id").eq("user_id",auth.userId).eq("active",true)
  .in("tenant_id",auth.tenantIds).in("role",["owner","manager","dispatch"]);
 if(error)return failOrder(503,"Dealer order permissions could not be checked.");
 const tenants=(data??[]).map(row=>String(row.tenant_id));
 return tenants.length?tenants:failOrder(403,"Only approved dealer owners, managers or dispatch staff can access customer order details.");
}
/** RLS + approved membership + explicit order-management roles keep addresses private. */
export async function GET(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 const tenantIds=await orderTenantIds(auth);if(tenantIds instanceof Response)return tenantIds;
 try{
  const {data,error}=await auth.client.from("orders").select(ORDER_FIELDS)
   .in("tenant_id",tenantIds).order("created_at",{ascending:false}).limit(100);
  if(error)return failOrder(503,"Your dealer orders are temporarily unavailable.");
  return Response.json({orders:data??[],source:"approved_dealer_orders"},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Dealer orders could not be loaded.");}
}
export async function PATCH(request:Request){
 const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 const tenantIds=await orderTenantIds(auth);if(tenantIds instanceof Response)return tenantIds;
 const input=dealerOrderStatusInput.safeParse(await parseOrderJson(request,1500));
 if(!input.success)return failOrder(400,"Invalid dealer order action.");
 const {orderId,expectedStatus,status}=input.data;
 if(status==="confirmed"&&stockConfirmationEnabled(process.env))return failOrder(409,"Assigned dealer must use atomic stock confirmation.");
 try{
  // The SQL trigger independently enforces owner/manager/dispatch permissions,
  // verified dealer approval and legal state transitions inside the transaction.
  const {data,error}=await auth.client.from("orders").update({status})
   .eq("id",orderId).in("tenant_id",tenantIds).eq("status",expectedStatus)
   .select(ORDER_FIELDS).maybeSingle();
  if(error)return failOrder(statusForOrderError(error),safeOrderError(error));
  if(!data)return failOrder(409,"Order status changed or this order is not accessible. Refresh.");
  return Response.json({order:data,stored:true,audited:true,paymentTaken:false},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Dealer order status was not saved.");}
}
