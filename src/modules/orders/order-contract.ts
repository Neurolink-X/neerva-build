import {z} from "zod";

/** Never trust order amount, dealer identity, tax or status from the browser. */
const uuid=z.string().uuid();
export const acceptOfferInput=z.object({
 offerId:uuid,
 idempotencyKey:uuid,
 deliveryAddress:z.string().trim().min(12).max(300),
 quoteAccepted:z.literal(true)
}).strict();
export const customerOrderStatusInput=z.object({
 orderId:uuid,expectedStatus:z.enum(["pending_confirmation","out_for_delivery"]),
 status:z.enum(["cancelled","delivered"])
}).strict().refine(value=>
 (value.expectedStatus==="pending_confirmation"&&value.status==="cancelled")||
 (value.expectedStatus==="out_for_delivery"&&value.status==="delivered")
 ,{message:"Customers may cancel pending orders or confirm their own delivery."});
export const dealerOrderStatusInput=z.object({
 orderId:uuid,
 expectedStatus:z.enum(["pending_confirmation","confirmed","preparing"]),
 status:z.enum(["confirmed","declined","preparing","out_for_delivery"])
}).strict().refine(value=>
 (value.expectedStatus==="pending_confirmation"&&["confirmed","declined"].includes(value.status))||
 (value.expectedStatus==="confirmed"&&value.status==="preparing")||
 (value.expectedStatus==="preparing"&&value.status==="out_for_delivery")
 ,{message:"Dealer order status transition is invalid."});
export const adminOrderStatusInput=z.object({
 orderId:uuid,
 expectedStatus:z.enum(["pending_confirmation","confirmed","preparing","out_for_delivery"]),
 status:z.enum(["confirmed","preparing","out_for_delivery","cancelled","declined"])
}).strict().refine(value=>
 (value.expectedStatus==="pending_confirmation"&&["confirmed","cancelled","declined"].includes(value.status))||
 (value.expectedStatus==="confirmed"&&["preparing","cancelled"].includes(value.status))||
 (value.expectedStatus==="preparing"&&["out_for_delivery","cancelled"].includes(value.status))||
 (value.expectedStatus==="out_for_delivery"&&value.status==="cancelled")
 ,{message:"Admin order status transition is invalid."});

export const ORDER_FIELDS="id,code,quote_request_id,quote_offer_id,customer_id,tenant_id,business_name,contact_name,phone,delivery_address,city,pincode,line_items,subtotal_paise,tax_paise,freight_paise,unloading_paise,total_paise,currency,status,invoice_number,created_at,updated_at";
export const ORDER_RESPONSE_HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"} as const;
export function failOrder(status:number,error:string){
 return Response.json({error},{status,headers:ORDER_RESPONSE_HEADERS});
}
export async function parseOrderJson(req:Request,maxBytes=4096):Promise<unknown|null>{
 if(!req.headers.get("content-type")?.toLowerCase().includes("application/json"))return null;
 const length=Number(req.headers.get("content-length")??0);
 if(!Number.isFinite(length)||length>maxBytes)return null;
 try{
  const text=await req.text();
  if(Buffer.byteLength(text,"utf8")>maxBytes)return null;
  return JSON.parse(text) as unknown;
 }catch{return null;}
}
export function statusForOrderError(error:{code?:string;message?:string}|null|undefined):number{
 if(!error)return 503;
 if(error.code==="23505"||error.code==="23514")return 409;
 if(error.code==="42501"||error.code==="PGRST301")return 403;
 if(error.code==="PGRST116")return 404;
 return 503;
}
export function safeOrderError(error:{code?:string;message?:string}|null|undefined):string{
 switch(error?.code){
  case "23505":return "This quotation has already been accepted. Check your existing orders.";
  case "23514":return "Offer expired, revised or dealer coverage is not verified. Request a new quote.";
  case "42501":return "You cannot perform this order action for this account or status.";
  default:return "Order service could not save or verify the change. Retry safely; no payment was taken.";
 }
}
