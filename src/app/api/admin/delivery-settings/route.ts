import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
import {deliveryReview,DELIVERY_FIELDS} from "@/modules/pricing/delivery-policy";
import {parseOrderJson,failOrder} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";
export async function GET(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const q=await a.client.from("dealer_delivery_versions").select(DELIVERY_FIELDS).order("id",{ascending:false}).limit(100);return q.error?apiFailed():apiData({rows:q.data??[]});}
export async function PATCH(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const p=deliveryReview.safeParse(await parseOrderJson(r,2048));if(!p.success)return failOrder(400,"Invalid review.");const q=await a.client.from("dealer_delivery_versions").update({status:p.data.status}).eq("id",p.data.id).eq("status","pending").select(DELIVERY_FIELDS).maybeSingle();return q.error?apiFailed():q.data?apiData({row:q.data}):failOrder(409,"Already reviewed.");}
