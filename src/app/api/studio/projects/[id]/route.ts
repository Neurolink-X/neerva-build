import {requireAuth} from "@/modules/identity/server-auth";
import {validatePlan,type PlanModel} from "@/modules/studio/plan-model";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,error:string)=>Response.json({error},{status,headers});
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const {id}=await params;if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))return fail(404,"Concept not found.");
 try{
  const {data,error}=await auth.client.from("studio_customer_projects").select("id,title,plan_json,updated_at").eq("owner_id",auth.userId).eq("id",id).maybeSingle();
  if(error)return fail(503,"Saved concept unavailable.");if(!data)return fail(404,"Concept not found.");
  const p=data.plan_json as PlanModel;
  if(!p||p.version!==1||p.conceptOnly!==true||!Array.isArray(p.rooms)||!Array.isArray(p.openings)||p.rooms.length>120||p.openings.length>240||validatePlan(p).length)return fail(422,"This saved concept needs a geometry review before display.");
  return Response.json({project:{id:data.id,title:data.title,plan:p,updated_at:data.updated_at}},{headers});
 }catch{return fail(503,"Saved concept unavailable.")}
}
