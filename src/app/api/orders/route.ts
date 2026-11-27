import {isSameOfferReplay} from "@/modules/orders/replay-identity";
import {requireAuth} from "@/modules/identity/server-auth";
import {acceptOfferInput,customerOrderStatusInput,ORDER_FIELDS,ORDER_RESPONSE_HEADERS,parseOrderJson,failOrder,safeOrderError,statusForOrderError} from "@/modules/orders/order-contract";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Customer order API is first-party Next.js TypeScript + signed-in Supabase RLS.
 * No Spring dependency, service-role key, invented order, automatic settlement
 * or price supplied by a browser. Database trigger locks real offer and RFQ. */
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 try{
  const {data,error}=await auth.client.from("orders").select(ORDER_FIELDS)
   .eq("customer_id",auth.userId).order("created_at",{ascending:false}).limit(50);
  if(error)return failOrder(503,"Private order storage is not ready. Your existing quotations are unchanged.");
  return Response.json({orders:data??[],source:"verified_order_database"},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Could not load private orders.")}
}
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")
  return failOrder(415,"JSON body required.");
 const input=acceptOfferInput.safeParse(await parseOrderJson(request,4096));
 if(!input.success)return failOrder(400,"Select an actual dealer offer, provide full delivery address and accept the price.");
 const {offerId,idempotencyKey,deliveryAddress}=input.data;
 try{
  // RLS column privilege exposes only three inputs. A DB trigger atomically
  // checks user ownership, approved dealer, service PIN, latest unexpired offer
  // and computes the immutable INR amount and seller/address snapshot.
  const {data:saved,error}=await auth.client.from("orders").insert({
   quote_offer_id:offerId,idempotency_key:idempotencyKey,delivery_address:deliveryAddress
  }).select(ORDER_FIELDS).single();
  if(error){
   // A retry with exactly the same idempotency key is safe even if the first
   // response was lost. A different offer with the same key is rejected.
   if(error.code==="23505"){
    const lookup=await auth.client.from("orders").select(ORDER_FIELDS)
     .eq("customer_id",auth.userId).eq("idempotency_key",idempotencyKey).maybeSingle();
    if(!lookup.error&&isSameOfferReplay(lookup.data,offerId,deliveryAddress))
     return Response.json({order:lookup.data,duplicate:true,paymentTaken:false},{headers:ORDER_RESPONSE_HEADERS});
   }
   if(statusForOrderError(error)===503)console.error("[orders.accept] database error",/^[A-Z0-9]{5,8}$/.test(error.code??"")?error.code:"UNKNOWN");
   return failOrder(statusForOrderError(error),safeOrderError(error));
  }
  if(!saved)return failOrder(503,"Could not confirm that your order request was saved.");
  return Response.json({order:saved,stored:true,paymentTaken:false,
   message:"Offer accepted and request recorded. Seller must confirm stock and delivery. No payment has been taken."},
   {status:201,headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Order service could not verify your request. Check My Orders before retrying.");}
}
export async function PATCH(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const parsed=customerOrderStatusInput.safeParse(await parseOrderJson(request,1500));
 if(!parsed.success)return failOrder(400,"Invalid customer order action.");
 const {orderId,expectedStatus,status}=parsed.data;
 try{
  const {data,error}=await auth.client.from("orders").update({status})
   .eq("id",orderId).eq("customer_id",auth.userId).eq("status",expectedStatus)
   .select(ORDER_FIELDS).maybeSingle();
  if(error)return failOrder(statusForOrderError(error),safeOrderError(error));
  if(!data)return failOrder(409,"Order status changed or order is not accessible. Refresh before retrying.");
  return Response.json({order:data,stored:true,paymentTaken:false},{headers:ORDER_RESPONSE_HEADERS});
 }catch{return failOrder(503,"Order status was not updated. Refresh and retry.");}
}
