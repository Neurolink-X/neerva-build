import {apiData,apiFailed,notReady,requireDealer} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 try{const [a,b]=await Promise.all([
  auth.client.from("quote_invites").select("quote_request_id,tenant_id,status,invited_at,request:quote_requests(id,category_slug,material_description,quantity,unit,city,pincode,status,created_at)").in("tenant_id",auth.tenantIds).limit(100),
  auth.client.from("quote_offers").select("id,quote_request_id,tenant_id,revision,subtotal_paise,tax_paise,freight_paise,unloading_paise,total_paise,valid_until,terms").in("tenant_id",auth.tenantIds).limit(100)
 ]);return a.error||b.error?apiFailed():apiData({invites:a.data??[],offers:b.data??[]})}catch{return apiFailed()}}
export async function POST(request:Request){const auth=await requireDealer(request);return auth instanceof Response?auth:notReady()}
