import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
import {proposalReview,PROPOSAL_FIELDS} from "@/modules/catalog/dealer-listings";
import {parseOrderJson,failOrder} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";
export async function GET(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const q=await a.client.from("dealer_product_requests").select(PROPOSAL_FIELDS).order("created_at",{ascending:false}).limit(100);return q.error?apiFailed():apiData({requests:q.data??[]});}
export async function PATCH(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const p=proposalReview.safeParse(await parseOrderJson(r,2048));if(!p.success)return failOrder(400,"Review reason required.");const q=await a.client.from("dealer_product_requests").update({status:p.data.status,review_note:p.data.note}).eq("id",p.data.id).eq("status","pending").select(PROPOSAL_FIELDS).maybeSingle();return q.error?apiFailed():q.data?apiData({request:q.data}):failOrder(409,"Request already reviewed.");}
