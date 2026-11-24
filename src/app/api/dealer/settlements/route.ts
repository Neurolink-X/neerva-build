import {requireDealer,apiData,apiFailed} from "@/modules/identity/server-auth";
import {SETTLEMENT_FIELDS} from "@/modules/orders/dealer-settlement";
import {directOrderPage} from "@/modules/orders/direct-contract";
export const dynamic="force-dynamic";
export async function GET(r:Request){const a=await requireDealer(r);if(a instanceof Response)return a;const p=directOrderPage(r);const q=await a.client.from("dealer_order_settlements").select(SETTLEMENT_FIELDS,{count:"exact"}).in("tenant_id",a.tenantIds).order("created_at",{ascending:false}).order("order_id",{ascending:false}).range(p.from,p.to);return q.error?apiFailed():apiData({rows:q.data??[],total:q.count??0,page:p.page});}
