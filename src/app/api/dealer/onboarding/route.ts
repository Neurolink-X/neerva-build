import {z} from "zod";
import {requireAuth,apiData,apiFailed} from "@/modules/identity/server-auth";
import {dealerApplicationSchema} from "@/modules/dealers/onboarding";
export const runtime="nodejs";export const dynamic="force-dynamic";
const fail=(status:number,error:string)=>Response.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
const input=z.discriminatedUnion("action",[
 dealerApplicationSchema.extend({action:z.literal("save"),shopPincode:z.string().regex(/^[1-9][0-9]{5}$/)}),
 z.object({action:z.literal("submit"),applicationId:z.string().uuid()}).strict()
]);
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 try{
 const [application,categories]=await Promise.all([auth.client.from("dealer_applications").select("id,tenant_id,legal_business_name,gstin,shop_city,status,gstin_verification,decision_reason,submitted_at").eq("owner_id",auth.userId).maybeSingle(),auth.client.from("categories").select("id,name_en").eq("status","published").order("name_en").limit(100)]);
 if(application.error||categories.error)return apiFailed();
 const a=application.data;if(!a)return apiData({application:null,categories:categories.data??[],pins:[],selectedCategories:[],photos:[],shopPincode:""});
 const [pins,selected,photos,branch]=await Promise.all([auth.client.from("dealer_service_pincodes").select("pincode").eq("application_id",a.id),auth.client.from("dealer_categories").select("category_id").eq("application_id",a.id),auth.client.from("dealer_shop_photos").select("id,review_status").eq("application_id",a.id),auth.client.from("merchant_branches").select("pincode").eq("tenant_id",a.tenant_id).order("created_at").limit(1).maybeSingle()]);
 if(pins.error||selected.error||photos.error||branch.error)return apiFailed();
 return apiData({application:a,categories:categories.data??[],pins:(pins.data??[]).map(x=>x.pincode),selectedCategories:(selected.data??[]).map(x=>x.category_id),photos:photos.data??[],shopPincode:branch.data?.pincode??""});
 }catch{return apiFailed()}
}
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json")||Number(request.headers.get("content-length")||0)>8192)return fail(415,"Valid JSON required.");
 try{
 const raw=await request.text();const p=input.safeParse(raw.length<=8192?JSON.parse(raw):null);
 if(!p.success)return fail(400,"Check GSTIN, business details, service PINs and material categories.");
 const d=p.data;
 if(d.action==="save"&&!d.servicePincodes.includes(d.shopPincode))return fail(400,"Include the shop PIN in your service PIN list.");
 const r=d.action==="save"?await auth.client.rpc("neerva_save_dealer_application",{p_name:d.legalBusinessName,p_gstin:d.gstin,p_city:d.shopCity,p_shop_pin:d.shopPincode,p_pins:d.servicePincodes,p_categories:d.categoryIds}):await auth.client.rpc("neerva_submit_dealer_application",{p_id:d.applicationId});
 if(r.error)return fail(r.error.code==="42501"?403:r.error.code==="23505"||r.error.code==="40001"?409:r.error.code==="22023"?400:503,r.error.code==="23505"?"Business registration already exists. Contact support.":r.error.code==="42501"?"Verified email and eligible account required.":r.error.code==="22023"?"Check your details and upload a shop photo before submission.":r.error.code==="40001"?"Application status changed. Refresh before editing.":"Application could not be confirmed. Refresh and retry.");
 return apiData(d.action==="save"?{applicationId:r.data,stored:true}:{status:r.data,stored:true});
 }catch{return apiFailed()}
}
