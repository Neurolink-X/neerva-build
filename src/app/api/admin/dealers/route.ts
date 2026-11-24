import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {z} from "zod";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{const [dealers,branches,applications]=await Promise.all([
 auth.client.from("tenants").select("id,business_name,status,created_at").order("created_at",{ascending:false}).limit(100),
 auth.client.from("merchant_branches").select("id,tenant_id,name,city,pincode,approved,created_at").order("created_at",{ascending:false}).limit(100),
 auth.client.from("dealer_applications").select("id,tenant_id,legal_business_name,shop_city,status,gstin_verification,submitted_at,reviewed_at,decision_reason").order("created_at",{ascending:false}).limit(100)
 ]);
 if(dealers.error||branches.error||applications.error)return apiFailed();
 return apiData({dealers:dealers.data??[],branches:branches.data??[],applications:applications.data??[],scope:"RLS-visible records; administrative read policy required for complete coverage"});
 }catch{return apiFailed()}
}

const review=z.object({id:z.string().uuid(),expected:z.enum(["submitted","approved","suspended"]),action:z.enum(["verify_gstin","verify_photo","approve","reject","request_changes","suspend","reactivate"]),reason:z.string().trim().min(10).max(500)}).strict();
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{
 const raw=await request.text();const v=review.safeParse(raw.length<=3000?JSON.parse(raw):null);
 if(!v.success)return Response.json({error:"Invalid review request."},{status:400});
 const d=v.data;
 const {data,error}=await auth.client.rpc("neerva_admin_review_dealer",{p_id:d.id,p_expected:d.expected,p_action:d.action,p_reason:d.reason});
 if(error)return Response.json({error:error.code==="42501"?"Review not permitted.":error.code==="40001"?"Application changed. Refresh.":error.code==="22023"?error.message:"Review could not be saved."},{status:error.code==="42501"?403:error.code==="40001"?409:error.code==="22023"?400:503});
 return apiData({status:data,stored:true});
 }catch{return apiFailed()}
}
