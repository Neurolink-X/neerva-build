import {apiData,apiFailed,notReady,requireAdmin} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const [r,g]=await Promise.all([auth.client.from("profiles").select("id,display_name,preferred_locale,created_at").limit(100),
 auth.client.from("platform_role_grants").select("user_id,role,granted_at").limit(150)]);return r.error||g.error?apiFailed():apiData({users:r.data??[],roles:g.data??[]})}catch{return apiFailed()}}
export async function POST(request:Request){const auth=await requireAdmin(request);return auth instanceof Response?auth:notReady()}
export const PATCH=POST;
