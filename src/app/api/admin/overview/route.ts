import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {studioPaymentEnabled} from "@/modules/studio/paid-products";
export const dynamic="force-dynamic";
export const runtime="nodejs";
// Every count is computed under the caller's RLS policies, never from mock data.
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{
  const tables={orders:"orders",requests:"quote_requests",products:"products",variants:"product_variants",dealers:"tenants",customers:"profiles"} as const;
  const counts=await Promise.all(Object.entries(tables).map(async ([key,table])=>{
   try{const {count,error}=await auth.client.from(table).select("id",{count:"exact",head:true});
    return [key,error||count===null?null:count] as const;
   }catch{return [key,null] as const;}
  }));
  const settings=await auth.client.from("studio_feature_settings").select("product_code,access_mode,checkout_enabled,is_published,price_paise");
  return apiData({counts:Object.fromEntries(counts),studio:settings.error?null:settings.data??[],paymentInfrastructureEnabled:studioPaymentEnabled(process.env),scope:"RLS-visible records",updatedAt:new Date().toISOString()});
 }catch{return apiFailed();}
}
