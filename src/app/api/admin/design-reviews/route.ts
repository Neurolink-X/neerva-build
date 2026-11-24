import {z} from "zod";
import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {legacyPublication} from "@/modules/studio/design-publication";
export const dynamic="force-dynamic";
const input=z.object({slug:z.string().min(2).max(160),status:z.enum(["in_review","changes_requested","ready_for_professional_review","archived"]),note:z.string().trim().min(10).max(1000),version:z.number().int().nonnegative()}).strict();
const fail=(error:string,status:number)=>Response.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const r=await auth.client.from("studio_design_reviews").select("design_slug,status,note,version,updated_at").order("updated_at",{ascending:false}).limit(500);if(r.error)return apiFailed();return apiData({reviews:r.data??[],designs:legacyPublication.map(x=>({slug:x.design.slug,title:x.design.title,publication:x.status,reasons:x.reasons}))})}catch{return apiFailed()}
}
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const raw=await request.text();const v=input.safeParse(raw.length<=4000?JSON.parse(raw):null);if(!v.success)return fail("Invalid review details.",400);const d=v.data;
 if(!legacyPublication.some(x=>x.design.slug===d.slug))return fail("Design not found.",404);
 const r=await auth.client.rpc("neerva_save_design_review",{p_slug:d.slug,p_status:d.status,p_note:d.note,p_version:d.version});
 if(r.error)return fail(r.error.code==="40001"?"Review changed. Refresh before saving.":"Review could not be saved.",r.error.code==="40001"?409:r.error.code==="42501"?403:503);
 return apiData({review:r.data});
 }catch{return apiFailed()}
}
