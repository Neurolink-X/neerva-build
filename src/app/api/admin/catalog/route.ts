import {apiData,apiFailed,notReady,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const [a,b,c]=await Promise.all([
  auth.client.from("categories").select("id,slug,name_en,pricing_mode,status").order("name_en"),
  auth.client.from("brands").select("id,name,status").order("name"),
  auth.client.from("products").select("id,slug,name,description,status,category:categories(slug,name_en,pricing_mode),brand:brands(name),variants:product_variants(id,sku,unit,status)").order("created_at",{ascending:false}).limit(100)
 ]);if(a.error||b.error||c.error)return apiFailed();return apiData({categories:a.data??[],brands:b.data??[],products:c.data??[]});}catch{return apiFailed()}}
export async function POST(request:Request){const auth=await requireAdmin(request);return auth instanceof Response?auth:notReady()}
export const PATCH=POST;
