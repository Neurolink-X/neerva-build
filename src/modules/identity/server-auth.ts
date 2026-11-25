import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {authFailureStatus} from "@/modules/identity/auth-failure";
import {activeDealerTenantIds} from "@/modules/identity/dealer-tenant-access";
/** Server-only, user-JWT authenticated access; RLS remains enforced. Never use service-role in these routes. */
export type AuthResult={userId:string;client:SupabaseClient};
const failure=(message:string,status:number)=>Response.json({error:message},{status,headers:{"Cache-Control":"private, no-store"}});
export const unavailable=()=>failure("Neerva account/database service is not configured. No changes were saved.",503);
export const notReady=()=>failure("This operation is not enabled until its protected database workflow has passed review.",503);
export async function requireAuth(request:Request):Promise<AuthResult|Response>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return unavailable();
 const header=request.headers.get("authorization")??"";
 const match=/^Bearer ([A-Za-z0-9._~-]{40,12000})$/.exec(header);
 if(!match)return failure("Please sign in to continue.",401);
 try{
   const client=createClient(url,key,{global:{headers:{Authorization:"Bearer "+match[1]}},auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
   const {data,error}=await client.auth.getUser(match[1]);
   if(error){const status=authFailureStatus(error);return failure(status===401?"Your session is invalid or expired.":"Authentication service is temporarily unavailable. Please retry.",status);}
   if(!data.user)return failure("Your session is invalid or expired.",401);
   const access=await client.rpc("neerva_account_access_allowed");
   if(access.error)return failure("Account access verification unavailable.",503);
   if(access.data!==true)return failure("Account restricted. Contact support.",403);
   return{client,userId:data.user.id};
 }catch{return failure("Authentication service is currently unavailable.",503)}
}
export async function requireAdmin(request:Request):Promise<AuthResult|Response>{
 const auth=await requireAuth(request);
 if(auth instanceof Response)return auth;
 try{
   const {data,error}=await auth.client.rpc("has_platform_role",{p_roles:["admin","super_admin"]});
   if(error)return failure("Permission service is temporarily unavailable.",503);
   if(data!==true)return failure("Administrator access required.",403);
   return auth;
 }catch{return failure("Permission service is temporarily unavailable.",503)}
}
export async function requireDealer(request:Request):Promise<(AuthResult&{tenantIds:string[]})|Response>{
 const auth=await requireAuth(request);
 if(auth instanceof Response)return auth;
 try{
   const {data,error}=await auth.client.from("tenant_memberships").select("tenant_id,active").eq("user_id",auth.userId).eq("active",true);
   if(error)return failure("Dealer permissions could not be checked.",503);
   const memberTenantIds=(data??[]).map(x=>String(x.tenant_id)).filter(Boolean);
   if(!memberTenantIds.length)return failure("Approved dealer membership required.",403);
   // Active membership alone is not merchant approval. Enforce tenant status.
   const approved=await auth.client.from("tenants").select("id").in("id",memberTenantIds).eq("status","active");
   if(approved.error)return failure("Dealer approval status could not be checked.",503);
   const tenantIds=activeDealerTenantIds((data??[]).map(x=>({tenant_id:String(x.tenant_id),active:x.active===true})),(approved.data??[]).map(x=>({id:String(x.id),status:"active"})));
   if(!tenantIds.length)return failure("Dealer approval required before access.",403);
   return {...auth,tenantIds};
 }catch{return failure("Dealer permissions could not be checked.",503)}
}
export function apiData(value:unknown){return Response.json(value,{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}})}
export function apiFailed(){return failure("Data could not be loaded securely. Please retry.",503)}
