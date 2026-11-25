import {createClient} from "@supabase/supabase-js";
import {baseStudioConfig,parseStudioConfig} from "@/modules/studio/studio-config";
import {studioPaymentEnabled} from "@/modules/studio/paid-products";
export const runtime="nodejs";export const dynamic="force-dynamic";
const names=["home_studio","colour_studio"] as const;
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const fallback=names.map(name=>baseStudioConfig(name));
 const headers={"Cache-Control":"no-store, max-age=0","X-Content-Type-Options":"nosniff"};
 const unavailable=()=>{console.error("[neerva.studio] live configuration unavailable; check database and settings");return Response.json({products:fallback,ready:false,unavailable:true,note:"Free previews may remain available; live access and payment settings could not be verified."},{headers:{...headers,"X-Neerva-Service-State":"degraded"}})};
 if(!url||!key)return unavailable();
 try{
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await db.from("studio_feature_settings").select(
   "product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version"
  ).eq("is_published",true);
  if(error)return unavailable();
  const published=(data??[]).map(parseStudioConfig).filter(x=>x!==null);
  const products=names.map(name=>{
   const p=published.find(c=>c.product===name)??baseStudioConfig(name);
   return {...p,checkoutEnabled:p.checkoutEnabled&&studioPaymentEnabled(process.env)};
  });
  return Response.json({products,ready:true},{headers});
 }catch{return unavailable()}
}
