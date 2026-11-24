import {z} from "zod";
import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const url=new URL(request.url),status=url.searchParams.get("status")??"all",severity=url.searchParams.get("severity")??"all",page=Number(url.searchParams.get("page")??0);
 if(!["all","open","investigating","resolved","ignored"].includes(status)||!["all","info","warning","error","critical"].includes(severity)||!Number.isSafeInteger(page)||page<0||page>1000)return Response.json({error:"Invalid incident filters."},{status:400});
 try{
 let q=auth.client.from("system_incidents").select("id,module,severity,error_code,route,safe_summary,impact,occurrence_count,first_seen_at,last_seen_at,last_trace_id,status,resolved_at",{count:"exact"});
 if(status!=="all")q=q.eq("status",status);if(severity!=="all")q=q.eq("severity",severity);
 const r=await q.order("last_seen_at",{ascending:false}).order("id").range(page*25,page*25+24);
 if(r.error)return apiFailed();
 return apiData({incidents:r.data??[],total:r.count??0,page,checkedAt:new Date().toISOString()});
 }catch{return apiFailed()}
}
const review=z.object({id:z.string().uuid(),expected:z.enum(["open","investigating","resolved","ignored"]),status:z.enum(["open","investigating","resolved","ignored"]),reason:z.string().trim().min(10).max(500)}).strict();
export async function PATCH(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;try{const raw=await request.text();const v=review.safeParse(raw.length<=3000?JSON.parse(raw):null);if(!v.success)return Response.json({error:"Invalid incident decision."},{status:400});const d=v.data;const r=await auth.client.rpc("neerva_admin_review_incident",{p_id:d.id,p_expected:d.expected,p_status:d.status,p_note:d.reason});if(r.error)return Response.json({error:r.error.code==="40001"?"Incident changed; refresh.":"Incident review failed."},{status:r.error.code==="40001"?409:r.error.code==="42501"?403:503});return apiData({changed:r.data===true})}catch{return apiFailed()}}
