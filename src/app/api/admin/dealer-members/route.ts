import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const tenant=z.string().uuid().safeParse(new URL(request.url).searchParams.get("tenant"));if(!tenant.success)return Response.json({error:"Select a dealer."},{status:400});
 try{const r=await auth.client.from("tenant_memberships").select("tenant_id,user_id,role,active").eq("tenant_id",tenant.data).order("created_at").limit(200);return r.error?apiFailed():apiData({members:r.data??[]})}catch{return apiFailed()}
}
const input=z.object({tenantId:z.string().uuid(),userId:z.string().uuid(),role:z.enum(["manager","sales","inventory","dispatch","accounts"]),active:z.boolean(),reason:z.string().trim().min(10).max(500)}).strict();
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const raw=await request.text();const v=input.safeParse(raw.length<=3000?JSON.parse(raw):null);if(!v.success)return Response.json({error:"Invalid membership command."},{status:400});
 const d=v.data,r=await auth.client.rpc("neerva_admin_manage_dealer_member",{p_tenant:d.tenantId,p_user:d.userId,p_role:d.role,p_active:d.active,p_reason:d.reason});if(r.error)return Response.json({error:r.error.code==="42501"?"Only super-admin may change eligible dealer staff.":r.error.code==="22023"?r.error.message:"Membership update failed."},{status:r.error.code==="42501"?403:r.error.code==="22023"?400:503});return apiData({changed:r.data===true});
 }catch{return apiFailed()}
}
