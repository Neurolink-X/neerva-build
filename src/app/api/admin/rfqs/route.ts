import {apiData,apiFailed,notReady,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const r=await auth.client.from("quote_requests").select("id,category_slug,material_description,quantity,unit,city,pincode,status,created_at").order("created_at",{ascending:false}).limit(100);return r.error?apiFailed():apiData({requests:r.data??[]})}catch{return apiFailed()}}
export async function POST(request:Request){const auth=await requireAdmin(request);return auth instanceof Response?auth:notReady()}
export const PATCH=POST;
