import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {z} from "zod";
export const dynamic="force-dynamic";
const input=z.object({userId:z.string().uuid(),reason:z.string().trim().min(10).max(500)}).strict();
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const raw=await request.text();const v=input.safeParse(raw.length<=3000?JSON.parse(raw):null);if(!v.success)return Response.json({error:"Valid account ID and support reason required."},{status:400});
 const r=await auth.client.rpc("neerva_admin_account_diagnostic",{p_user:v.data.userId,p_note:v.data.reason});if(r.error)return Response.json({error:r.error.code==="42501"?"Access forbidden.":r.error.code==="22023"?r.error.message:"Account diagnostic unavailable."},{status:r.error.code==="42501"?403:r.error.code==="22023"?400:503});
 return apiData(r.data);
 }catch{return apiFailed()}
}
