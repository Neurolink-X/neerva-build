import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
import {skuTaxInput} from "@/modules/pricing/delivery-policy";
import {parseOrderJson,failOrder} from "@/modules/orders/order-contract";
export const dynamic="force-dynamic";
export async function GET(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const q=await a.client.from("sku_tax_versions").select("id,variant_id,hsn,rate_bps,price_includes_tax,reason").order("id",{ascending:false}).limit(100);return q.error?apiFailed():apiData({rows:q.data??[]});}
export async function POST(r:Request){const a=await requireAdmin(r);if(a instanceof Response)return a;const p=skuTaxInput.safeParse(await parseOrderJson(r,2048));if(!p.success)return failOrder(400,"Invalid SKU tax policy.");const v=p.data;const q=await a.client.from("sku_tax_versions").insert({variant_id:v.variantId,hsn:v.hsn,rate_bps:v.rateBps,price_includes_tax:v.priceIncludesTax,reason:v.reason}).select("id").single();return q.error?apiFailed():apiData({row:q.data});}
