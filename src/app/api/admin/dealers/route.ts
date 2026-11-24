import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const [dealers,branches]=await Promise.all([
 auth.client.from("tenants").select("id,business_name,status,created_at").order("created_at",{ascending:false}).limit(100),
 auth.client.from("merchant_branches").select("id,tenant_id,name,city,pincode,approved,created_at").order("created_at",{ascending:false}).limit(100)
 ]);
 if(dealers.error||branches.error)return apiFailed();
 return apiData({dealers:dealers.data??[],branches:branches.data??[],scope:"RLS-visible records; administrative read policy required for complete coverage"});
 }catch{return apiFailed()}
}
