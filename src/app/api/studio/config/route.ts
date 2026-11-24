import {publicDatabase,timedPublicResponse} from "@/modules/supabase/public-server";
import {baseStudioConfig,parseStudioConfig} from "@/modules/studio/studio-config";
import {studioPaymentEnabled} from "@/modules/studio/paid-products";
export const runtime="nodejs";export const dynamic="force-dynamic";
const names=["home_studio","colour_studio"] as const;
async function readPublic(){
 const db=publicDatabase();
 const fallback=names.map(name=>baseStudioConfig(name));
 const headers={"Cache-Control":"no-store, max-age=0","X-Content-Type-Options":"nosniff"};
 if(!db)return Response.json({products:fallback,ready:false,unavailable:true},{headers});
 try{

  const {data,error}=await db.from("studio_feature_settings").select(
   "product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version"
  ).eq("is_published",true);
  if(error)return Response.json({products:fallback,ready:false,unavailable:true},{headers});
  const published=(data??[]).map(parseStudioConfig).filter(x=>x!==null);
  const products=names.map(name=>{
   const p=published.find(c=>c.product===name)??baseStudioConfig(name);
   return {...p,checkoutEnabled:p.checkoutEnabled&&studioPaymentEnabled(process.env)};
  });
  return Response.json({products,ready:true},{headers});
 }catch{return Response.json({products:fallback,ready:false,unavailable:true},{headers})}
}

export async function GET(){const start=performance.now();try{return timedPublicResponse(start,await readPublic())}catch{return timedPublicResponse(start,Response.json({error:"Public data temporarily unavailable",unavailable:true},{status:503}))}}
