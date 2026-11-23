import {apiData,apiFailed,notReady,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const r=await auth.client.from("pricing_rules").select("id,tenant_id,branch_id,variant_id,city,amount_paise,visibility,status,valid_from,valid_to,version").order("created_at",{ascending:false}).limit(100);return r.error?apiFailed():apiData({prices:r.data??[]})}catch{return apiFailed()}}
export async function POST(request:Request){const auth=await requireAdmin(request);return auth instanceof Response?auth:notReady()}
export const PATCH=POST;
