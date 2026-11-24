import {z} from "zod";
import {requireAdmin,apiFailed} from "@/modules/identity/server-auth";
export const runtime="nodejs";export const dynamic="force-dynamic";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,error:string)=>Response.json({error},{status,headers:hdr});
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const [orders,claims]=await Promise.all([
  auth.client.from("studio_paid_orders").select("id,user_id,product_code,amount_paise,currency,status,created_at,reviewed_at").order("created_at",{ascending:false}).limit(100),
  auth.client.from("studio_payment_claims").select("id,order_id,utr,reported_paid_at,created_at").order("created_at",{ascending:false}).limit(100)
 ]);
 if(orders.error||claims.error)return apiFailed();
 return Response.json({orders:orders.data??[],claims:claims.data??[]},{headers:hdr});
}
const schema=z.object({orderId:z.string().uuid(),action:z.enum(["verified","rejected","refunded"]),
 bankReconciled:z.literal(true),confirmation:z.literal("I independently confirmed this transaction in the bank statement")}).strict();
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json"))return fail(415,"JSON required.");
 let raw:unknown;try{const t=await request.text();raw=t.length<=1500?JSON.parse(t):null}catch{return fail(400,"Invalid JSON.");}
 const parsed=schema.safeParse(raw);if(!parsed.success)return fail(400,"Explicit bank reconciliation acknowledgement required.");
 const {orderId,action}=parsed.data;
 const {data,error}=await auth.client.rpc("neerva_review_studio_payment",{p_order_id:orderId,p_action:action});
 if(error)return fail(409,"Could not safely complete review. Check order state, submitted UTR and bank settlement independently.");
 return Response.json({orderId,status:data,auditRecorded:true},{headers:hdr});
}
