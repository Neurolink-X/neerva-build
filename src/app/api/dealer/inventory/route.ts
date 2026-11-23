import {apiData,apiFailed,notReady,requireDealer} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireDealer(request);if(auth instanceof Response)return auth;
 try{const [a,b,c]=await Promise.all([
   auth.client.from("tenant_memberships").select("tenant_id,role,tenants(business_name,status)").in("tenant_id",auth.tenantIds).eq("user_id",auth.userId),
   auth.client.from("merchant_branches").select("id,tenant_id,name,city,pincode,approved").in("tenant_id",auth.tenantIds).eq("approved",true),
   auth.client.from("product_variants").select("id,sku,unit,product:products(id,slug,name,status,category:categories(slug,name_en,pricing_mode),brand:brands(name))").eq("status","published").limit(100)
 ]);return a.error||b.error||c.error?apiFailed():apiData({memberships:a.data??[],branches:b.data??[],variants:c.data??[]})}catch{return apiFailed()}}
export async function POST(request:Request){const auth=await requireDealer(request);return auth instanceof Response?auth:notReady()}
