import {z} from "zod";
import {requireAuth,apiFailed} from "@/modules/identity/server-auth";
export const dynamic="force-dynamic";export const runtime="nodejs";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,error:string)=>Response.json({error},{status,headers:hdr});
const schema=z.object({orderId:z.string().uuid(),
 utr:z.string().trim().toUpperCase().regex(/^[A-Z0-9]{10,35}$/),
 paidAt:z.string().datetime({offset:true})}).strict();
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json")||Number(request.headers.get("content-length")||0)>2000)return fail(415,"Valid JSON required.");
 let raw:unknown;try{const t=await request.text();raw=t.length<=2000?JSON.parse(t):null}catch{return fail(400,"Invalid JSON.");}
 const parsed=schema.safeParse(raw);if(!parsed.success)return fail(400,"Provide order ID, UPI reference (UTR) and actual payment time.");
 const {orderId,utr,paidAt}=parsed.data;
 const time=Date.parse(paidAt);
 if(!Number.isFinite(time)||time>Date.now()+300000||time<Date.now()-30*86400000)return fail(400,"Payment time must be within the last 30 days and not in the future.");
 const {data:order,error}=await auth.client.from("studio_paid_orders")
  .select("id,status,created_at,amount_paise").eq("id",orderId).eq("user_id",auth.userId).maybeSingle();
 if(error)return apiFailed();
 if(!order||order.status!=="requested"||!Number.isSafeInteger(order.amount_paise)||order.amount_paise<1000||order.amount_paise>2000000)return fail(409,"No valid pending Studio payment belongs to this account.");
 const {data:claim,error:write}=await auth.client.from("studio_payment_claims").insert({
  order_id:orderId,user_id:auth.userId,utr,reported_paid_at:paidAt
 }).select("id").single();
 if(write)return fail(409,"A UPI reference was already submitted. Contact support if money was deducted.");
 if(!claim)return apiFailed();
 return Response.json({claimId:claim.id,status:"awaiting_manual_bank_verification",
  notice:"UPI receipt is self-reported. Paid features remain locked until a bank-reconciled administrator confirms the transfer."},
  {status:201,headers:hdr});
}
