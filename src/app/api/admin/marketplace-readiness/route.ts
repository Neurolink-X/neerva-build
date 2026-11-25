import {apiData,requireAdmin} from "@/modules/identity/server-auth";
import {assessReadiness,readinessTables,type ReadinessCounts} from "@/modules/observability/readiness";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 // Only counts; no personal records, service key or database mutations.
 // On-demand only. A timeout is unknown, never a fabricated zero.
 const deadline=AbortSignal.timeout(5000);
 const entries=await Promise.all(Object.entries(readinessTables).map(async ([key,table])=>{
  try{const {count,error}=await auth.client.from(table).select(key==="inventory"?"branch_id":"id",{count:"exact",head:true}).abortSignal(deadline);
   return [key,error?null:count] as const;
  }catch{return [key,null] as const;}
 }));
 return apiData({findings:assessReadiness(Object.fromEntries(entries) as ReadinessCounts),scope:"Administrator RLS-visible counts; not proof of published stock, completed orders or security",checkedAt:new Date().toISOString()});
}
