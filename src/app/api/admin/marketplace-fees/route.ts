import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
import {feePolicyInput} from "@/modules/pricing/marketplace-policy";
import {parseOrderJson,failOrder} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";
export async function GET(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const {data,error}=await a.client.from("marketplace_fee_versions").select("id,fixed_paise,rate_bps,cap_paise,commission_bps,reason,created_at").order("id",{ascending:false}).limit(20);return error?apiFailed():apiData({versions:data??[]});}
export async function POST(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const p=feePolicyInput.safeParse(await parseOrderJson(r,2048));if(!p.success)return failOrder(400,"Invalid fee policy.");const v=p.data;const {data,error}=await a.client.from("marketplace_fee_versions").insert({fixed_paise:v.fixedPaise,rate_bps:v.rateBps,cap_paise:v.capPaise,commission_bps:v.commissionBps,reason:v.reason}).select("id,fixed_paise,rate_bps,cap_paise,commission_bps,reason,created_at").single();return error?apiFailed():apiData({policy:data});}
