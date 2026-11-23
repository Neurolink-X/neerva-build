import {apiData,apiFailed,requireAuth} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 try{const r=await auth.client.from("quote_requests").select("id,category_slug,material_description,quantity,unit,city,pincode,status,created_at,offers:quote_offers(id,tenant_id,subtotal_paise,tax_paise,freight_paise,unloading_paise,total_paise,valid_until,terms)").eq("requester_id",auth.userId).order("created_at",{ascending:false}).limit(50);return r.error?apiFailed():apiData({requests:r.data??[]})}catch{return apiFailed()}}
