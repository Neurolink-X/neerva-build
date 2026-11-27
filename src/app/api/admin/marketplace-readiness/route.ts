import {apiData,requireAdmin} from "@/modules/identity/server-auth";
import {assessReadiness,readinessTables,type ReadinessCounts} from "@/modules/observability/readiness";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 // Only counts; no personal records, service key or database mutations.
 // On-demand only. A timeout is unknown, never a fabricated zero.
 const deadline=AbortSignal.timeout(5000);
 const now=new Date().toISOString();
 const entries=await Promise.all(Object.entries(readinessTables).map(async ([key,table])=>{
  // Inventory RLS is tenant-scoped, even for an admin; never report its partial count as global.
  if(key==="inventory")return [key,null] as const;
  try{let query=auth.client.from(table).select("id",{count:"exact",head:true});
   if(key==="products"||key==="variants")query=query.eq("status","published");
   if(key==="media")query=query.eq("published",true);
   if(key==="prices")query=query.eq("status","published").eq("currency","INR").gt("amount_paise",0).lte("valid_from",now).or("valid_to.is.null,valid_to.gt."+now);
   if(key==="dealers")query=query.eq("status","active");
   const {count,error}=await query.abortSignal(deadline);
   return [key,error?null:count] as const;
  }catch{return [key,null] as const;}
 }));
 return apiData({findings:assessReadiness(Object.fromEntries(entries) as ReadinessCounts),scope:"Administrator RLS-visible counts: published products, variants and media; currently valid positive INR price rules; active dealers. Counts do not prove matched SKU pricing, local stock, order fulfilment or security. Global inventory is unavailable under tenant-only policy.",checkedAt:new Date().toISOString()});
}
