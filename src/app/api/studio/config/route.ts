import {createClient} from "@supabase/supabase-js";
import {baseStudioConfig,parseStudioConfig} from "@/modules/studio/studio-config";
import {studioPaymentEnabled,type StudioProduct} from "@/modules/studio/paid-products";
export const runtime="nodejs";export const dynamic="force-dynamic";
const names=["home_studio","colour_studio"] as const;
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const fallback=names.map(name=>baseStudioConfig(name));
 const headers={"Cache-Control":"public, no-store","X-Content-Type-Options":"nosniff"};
 if(!url||!key)return Response.json({products:fallback,ready:false},{status:503,headers});
 try{
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await db.from("studio_feature_settings").select(
   "product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version"
  ).eq("is_published",true);
  if(error)return Response.json({products:fallback,ready:false},{status:503,headers});
  const published=(data??[]).map(parseStudioConfig).filter(x=>x!==null);
  const products=names.map(name=>{
   const p=published.find(c=>c.product===name)??baseStudioConfig(name);
   return {...p,checkoutEnabled:p.checkoutEnabled&&studioPaymentEnabled(process.env)};
  });
  return Response.json({products,ready:true},{headers});
 }catch{return Response.json({products:fallback,ready:false},{status:503,headers})}
}
