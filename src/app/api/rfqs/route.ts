import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {requireAuth} from "@/modules/identity/server-auth";
import {rfqSchema} from "@/modules/rfq/schema";
import {rfqIntakeEnabled} from "@/modules/rfq/intake-status";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const MAX_BODY_BYTES=8192;
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};

export const rfqFieldHelp:Record<string,string>={
 categorySlug:"Choose a valid material category.",
 materialDescription:"Enter product details, size or grade (3–240 characters).",
 quantity:"Enter a positive quantity in a supported unit.",
 unit:"Select a unit suitable for this material.",
 city:"Enter your delivery city.",
 pincode:"Enter a six-digit Indian pincode.",
 requestedDate:"Enter a valid preferred delivery date.",
 contactName:"Enter a name for your request.",
 phone:"Enter a valid Indian 10-digit mobile number.",
 privacyAccepted:"Review and accept the private quotation privacy notice before submitting."
};
function respond(status:number,error:string,code:string,reference:string,other:Record<string,unknown>={}){
 return NextResponse.json({error,code,reference,...other},{status,headers});
}
async function readJsonBounded(request:Request){
 if(!request.headers.get("content-type")?.toLowerCase().includes("application/json"))return null;
 const length=Number(request.headers.get("content-length")??0);
 if(!Number.isFinite(length)||length>MAX_BODY_BYTES)return null;
 if(!request.body)return null;
 const reader=request.body.getReader();const parts:Uint8Array[]=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;
  if(total>MAX_BODY_BYTES){await reader.cancel();return null;}parts.push(value);
 }}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes)) as unknown;}catch{return null;}
}

/** Only verified Supabase users may submit; database trigger enforces the
 * identical ownership, verification, transactional throttle and immutable audit.
 * No service-role key or shared IP-based memory limiter is required.
 */
export async function POST(request:Request){
 const reference=randomUUID();
 if(!rfqIntakeEnabled(process.env))return respond(503,"Quote intake is paused until verified dealers and support are operational. No request was saved.","INTAKE_PAUSED",reference);
 const auth=await requireAuth(request);
 if(auth instanceof Response)return auth;
 const raw=await readJsonBounded(request);
 const checked=rfqSchema.safeParse(raw);
 if(!checked.success){
  const fields=[...new Set(checked.error.issues.map(issue=>String(issue.path[0]??"form")))]
   .map(field=>({field,message:rfqFieldHelp[field]??"Check this value."}));
  return respond(400,"Check the highlighted material request details.","INVALID_REQUEST",reference,{fields});
 }
 const data=checked.data;
 try{
  const {error}=await auth.client.from("quote_requests").insert({
   idempotency_key:data.idempotencyKey,requester_id:auth.userId,
   category_slug:data.categorySlug,material_description:data.materialDescription,
   quantity:data.quantity,unit:data.unit,city:data.city,pincode:data.pincode,
   requested_date:data.requestedDate??null,contact_name:data.contactName,phone:data.phone
  });
  if(error?.code==="23505"){
   const {data:previous,error:readError}=await auth.client.from("quote_requests")
    .select("id").eq("requester_id",auth.userId).eq("idempotency_key",data.idempotencyKey).maybeSingle();
   if(readError||!previous?.id)return respond(409,"This request could not be safely confirmed. Use a new request.","IDEMPOTENCY_CONFLICT",reference);
   return NextResponse.json({requestId:previous.id,status:"received",reference,duplicate:true},{status:200,headers});
  }
  if(error){
   if(error.message.includes("RFQ_RATE_LIMITED"))return respond(429,"Request limit reached. Please try later.","RATE_LIMITED",reference);
   if(error.message.includes("RFQ_EMAIL_VERIFICATION_REQUIRED"))return respond(403,"Verify your email before requesting a quote.","EMAIL_UNVERIFIED",reference);
   return respond(503,"Your request was not saved. Please retry with the same submission.","REQUEST_NOT_SAVED",reference);
  }
  const {data:saved,error:lookupError}=await auth.client.from("quote_requests")
    .select("id").eq("requester_id",auth.userId).eq("idempotency_key",data.idempotencyKey).maybeSingle();
  if(lookupError||!saved?.id)return respond(503,"We could not verify that your request was saved. Retry safely.","REQUEST_NOT_CONFIRMED",reference);
  return NextResponse.json({requestId:saved.id,status:"received",reference,duplicate:false},{status:201,headers});
 }catch{
  return respond(503,"The private request service is temporarily unavailable.","SERVICE_NOT_READY",reference);
 }
}
