import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const [r,g,s,a]=await Promise.all([auth.client.from("profiles").select("id,display_name,preferred_locale,created_at").limit(100),
 auth.client.from("platform_role_grants").select("user_id,role,granted_at").limit(150),auth.client.rpc("has_platform_role",{p_roles:["super_admin"]}),auth.client.from("account_access_restrictions").select("user_id,suspended,updated_at")]);return r.error||g.error||s.error||a.error?apiFailed():apiData({users:r.data??[],roles:g.data??[],canManageRoles:s.data===true,currentUserId:auth.userId,restrictions:a.data??[]})}catch{return apiFailed()}}
const command=z.object({userId:z.string().uuid(),role:z.enum(["support","finance","admin"]),action:z.enum(["grant","revoke"]),reason:z.string().trim().min(10).max(500)}).strict();
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const role=await auth.client.rpc("has_platform_role",{p_roles:["super_admin"]});
 if(role.error)return apiFailed();if(role.data!==true)return Response.json({error:"Super administrator required."},{status:403});
 try{const raw=await request.text();const input=command.safeParse(raw.length<=3000?JSON.parse(raw):null);if(!input.success)return Response.json({error:"Invalid role action."},{status:400});
 const d=input.data;const {data,error}=await auth.client.rpc("neerva_admin_manage_staff_role",{p_user:d.userId,p_role:d.role,p_action:d.action,p_reason:d.reason});
 if(error)return Response.json({error:error.code==="42501"?"Role action forbidden.":error.code==="22023"?error.message:"Role action could not be saved."},{status:error.code==="42501"?403:error.code==="22023"?400:503});
 return apiData({changed:data===true,stored:true});
 }catch{return apiFailed()}
}
const accessCommand=z.object({userId:z.string().uuid(),suspended:z.boolean(),reason:z.string().trim().min(10).max(500)}).strict();
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const raw=await request.text();const input=accessCommand.safeParse(raw.length<=3000?JSON.parse(raw):null);if(!input.success)return Response.json({error:"Invalid access request."},{status:400});
 const d=input.data;const {data,error}=await auth.client.rpc("neerva_admin_set_account_access",{p_user:d.userId,p_suspended:d.suspended,p_reason:d.reason});
 if(error)return Response.json({error:error.code==="42501"?"Action forbidden for this account or role.":error.code==="22023"?error.message:"Access update failed."},{status:error.code==="42501"?403:error.code==="22023"?400:503});
 return apiData({changed:data===true,stored:true});
 }catch{return apiFailed()}
}

