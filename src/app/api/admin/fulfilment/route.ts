import {apiData,apiFailed,requireAdmin} from "@/modules/identity/server-auth";
import {joinSourcingQueue,validSourcingChange,type AdminRFQ,type SourcingCase} from "@/modules/rfq/admin-sourcing";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 try{
  const [quotes,cases,invites]=await Promise.all([
   auth.client.from("quote_requests").select("id,category_slug,material_description,quantity,unit,city,pincode,status,created_at").order("created_at",{ascending:false}).limit(100),
   auth.client.from("admin_sourcing_cases").select("id,quote_request_id,status,scope,note,updated_at").order("updated_at",{ascending:false}).limit(100),
   auth.client.from("quote_invites").select("quote_request_id").limit(500)
  ]);
  if(quotes.error||cases.error||invites.error)return apiFailed();
  const counts=new Map<string,number>();
  for(const inv of invites.data??[])counts.set(String(inv.quote_request_id),(counts.get(String(inv.quote_request_id))??0)+1);
  const rows=joinSourcingQueue((quotes.data??[]) as AdminRFQ[],(cases.data??[]) as SourcingCase[],counts);
  return apiData({cases:rows,orderServiceStatus:process.env.ORDER_SERVICE_URL?"configured_but_unverified":"not_configured",
   note:"These are genuine quotation sourcing cases, NOT accepted or paid orders. Only a verified backend may accept, deliver or invoice an order."});
 }catch{return apiFailed()}
}
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json"))return Response.json({error:"JSON required"},{status:415});
 const length=Number(request.headers.get("content-length")??0);
 if(length>2500)return Response.json({error:"Request too large"},{status:413});
 let raw:unknown;
 try{const text=await request.text();if(text.length>2500)return Response.json({error:"Request too large"},{status:413});raw=JSON.parse(text)}catch{return Response.json({error:"Invalid request"},{status:400})}
 const value=validSourcingChange(raw);
 if(!value)return Response.json({error:"Invalid sourcing case state"},{status:400});
 const {data,error}=await auth.client.from("admin_sourcing_cases")
  .update({status:value.status,scope:value.scope,note:value.note}).eq("id",value.caseId)
  .select("id,status,scope,updated_at").maybeSingle();
 if(error)return apiFailed();
 if(!data)return Response.json({error:"No accessible sourcing case found"},{status:404});
 return apiData({case:data,note:"Saved for admin review only; no order or delivery confirmed."});
}
