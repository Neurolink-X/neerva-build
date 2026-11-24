import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
import {operationsInput} from "@/modules/orders/operations-contract";
import {parseOrderJson,failOrder} from "@/modules/orders/order-contract";
import {z} from "zod";
export const dynamic="force-dynamic";
const fields="id,kind,amount_paise,evidence_ref,note,created_at";
export async function GET(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const p=z.string().uuid().safeParse(new URL(r.url).searchParams.get("orderId"));if(!p.success)return failOrder(400,"Invalid order.");const q=await a.client.from("direct_order_operations").select(fields).eq("order_id",p.data).order("id",{ascending:false}).limit(501);return q.error?apiFailed():q.data?.length===501?failOrder(409,"More than 500 records; reconcile using the administrative ledger export before posting."):apiData({rows:q.data??[]});}
export async function POST(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const p=operationsInput.safeParse(await parseOrderJson(r,4096));if(!p.success)return failOrder(400,"Invalid evidence or amount.");const v=p.data;const q=await a.client.from("direct_order_operations").insert({order_id:v.orderId,kind:v.kind,amount_paise:v.amountPaise,evidence_ref:v.evidenceRef,note:v.note}).select(fields).single();return q.error?failOrder(409,"Record rejected. Check duplicate evidence, order status and amount limits."):apiData({row:q.data});}
