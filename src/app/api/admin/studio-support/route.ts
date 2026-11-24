import {z} from "zod";
import {requireAdmin,apiFailed} from "@/modules/identity/server-auth";
export const runtime="nodejs";export const dynamic="force-dynamic";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,error:string)=>Response.json({error},{status,headers:hdr});
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const {data,error}=await auth.client.from("studio_support_tickets")
  .select("id,user_id,order_id,issue,message,status,admin_reply,created_at,resolved_at")
  .order("created_at",{ascending:false}).limit(150);
 if(error)return apiFailed();
 return Response.json({tickets:data??[]},{headers:hdr});
}
const schema=z.object({ticketId:z.string().uuid(),status:z.enum(["in_review","resolved"]),
 reply:z.string().trim().min(10).max(1000)}).strict();
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json"))return fail(415,"JSON required.");
 let body:unknown;try{const t=await request.text();body=t.length<=2000?JSON.parse(t):null}catch{return fail(400,"Invalid JSON.");}
 const parsed=schema.safeParse(body);if(!parsed.success)return fail(400,"Valid ticket, status and useful reply required.");
 const p=parsed.data;
 const {data,error}=await auth.client.from("studio_support_tickets")
  .update({status:p.status,admin_reply:p.reply,resolved_at:p.status==="resolved"?new Date().toISOString():null})
  .eq("id",p.ticketId).select("id,status").maybeSingle();
 if(error)return apiFailed();
 if(!data)return fail(404,"Ticket not found.");
 return Response.json({ticket:data},{headers:hdr});
}
