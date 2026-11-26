import {z} from "zod";
import {requireAuth,apiFailed} from "@/modules/identity/server-auth";
export const runtime="nodejs";export const dynamic="force-dynamic";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(code:number,error:string)=>Response.json({error},{status:code,headers:hdr});
const schema=z.object({orderId:z.string().uuid().nullable(),issue:z.enum(["payment_not_verified","duplicate_payment","refund_request","studio_access","other"]),message:z.string().trim().min(15).max(1000),requestId:z.string().uuid().optional()}).strict();
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const {data,error}=await auth.client.from("studio_support_tickets")
  .select("id,order_id,issue,message,status,admin_reply,created_at,resolved_at")
  .eq("user_id",auth.userId).order("created_at",{ascending:false}).limit(30);
 if(error)return apiFailed();
 const orders=await auth.client.from("studio_paid_orders").select("id,product_code,status,created_at,amount_paise").eq("user_id",auth.userId).order("created_at",{ascending:false}).limit(50);
 return Response.json({tickets:data??[],orders:orders.data??[]},{headers:hdr});
}
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json")||Number(request.headers.get("content-length")||0)>2500)return fail(415,"Valid JSON required.");
 let raw:unknown;try{const s=await request.text();raw=s.length<=2500?JSON.parse(s):null}catch{return fail(400,"Invalid JSON.");}
 const p=schema.safeParse(raw);if(!p.success)return fail(400,"Choose a support reason and write at least 15 characters.");
 if(p.data.orderId){
  const {data:order,error}=await auth.client.from("studio_paid_orders").select("id").eq("id",p.data.orderId).eq("user_id",auth.userId).maybeSingle();
  if(error)return apiFailed();if(!order)return fail(403,"Order reference does not belong to your account.");
 }
 const {data,error}=await auth.client.from("studio_support_tickets").insert({
  ...(p.data.requestId?{id:p.data.requestId}:{}),user_id:auth.userId,order_id:p.data.orderId,issue:p.data.issue,message:p.data.message,status:"open"
 }).select("id,status").single();
 if(error?.code==="23505"&&p.data.requestId){
  const prior=await auth.client.from("studio_support_tickets").select("id,status,order_id,issue,message").eq("id",p.data.requestId).eq("user_id",auth.userId).maybeSingle();
  if(prior.error)return apiFailed();
  if(!prior.data||prior.data.order_id!==p.data.orderId||prior.data.issue!==p.data.issue||prior.data.message!==p.data.message)return fail(409,"Request reference conflicts with another submission.");
  return Response.json({ticket:{id:prior.data.id,status:prior.data.status}},{headers:hdr});
 }
 if(error||!data)return apiFailed();
 return Response.json({ticket:data},{status:201,headers:hdr});
}
