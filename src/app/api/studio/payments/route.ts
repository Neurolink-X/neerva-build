import {z} from "zod";
import {requireAuth,apiFailed} from "@/modules/identity/server-auth";
import {studioPaymentEnabled,isStudioProduct,studioProducts,studioPayee} from "@/modules/studio/paid-products";
export const dynamic="force-dynamic";export const runtime="nodejs";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const invalid=(status:number,error:string)=>Response.json({error},{status,headers:hdr});
async function limitedBody(req:Request){
 if(!req.headers.get("content-type")?.includes("application/json")||Number(req.headers.get("content-length")||0)>1500)return null;
 try{const body=await req.text();return body.length<=1500?JSON.parse(body) as unknown:null}catch{return null}
}
const schema=z.object({product:z.enum(["home_studio","colour_studio"])}).strict();
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const url=new URL(request.url),product=url.searchParams.get("product");
 if(!isStudioProduct(product))return invalid(400,"Select Home Studio or Colour Studio.");
 const [access,orders]=await Promise.all([
  auth.client.from("studio_paid_access").select("order_id,granted_at").eq("user_id",auth.userId).eq("product_code",product).is("revoked_at",null).maybeSingle(),
  auth.client.from("studio_paid_orders").select("id,status,created_at").eq("user_id",auth.userId).eq("product_code",product).order("created_at",{ascending:false}).limit(5)
 ]);
 if(access.error||orders.error)return apiFailed();
 return Response.json({product,enabled:studioPaymentEnabled(process.env),paid:!!access.data,
  orders:orders.data??[],pricePaise:studioProducts[product].pricePaise},{headers:hdr});
}
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(!studioPaymentEnabled(process.env))return invalid(503,"Paid studio checkout is paused until operator, payment and refund verification is complete. Samples remain free.");
 const parsed=schema.safeParse(await limitedBody(request));
 if(!parsed.success)return invalid(400,"Choose a valid studio product.");
 const product=parsed.data.product;
 const access=await auth.client.from("studio_paid_access").select("order_id").eq("user_id",auth.userId).eq("product_code",product).is("revoked_at",null).maybeSingle();
 if(access.error)return apiFailed();
 if(access.data)return Response.json({paid:true,orderId:access.data.order_id},{headers:hdr});
 const pending=await auth.client.from("studio_paid_orders").select("id,status").eq("user_id",auth.userId).eq("product_code",product).eq("status","requested").maybeSingle();
 if(pending.error)return apiFailed();
 if(pending.data)return Response.json({orderId:pending.data.id,status:"requested",
  pricePaise:studioProducts[product].pricePaise,payee:studioPayee},{headers:hdr});
 const {data,error}=await auth.client.from("studio_paid_orders").insert({
  user_id:auth.userId,product_code:product,amount_paise:14900,currency:"INR",
  payment_method:"upi_manual",status:"requested"
 }).select("id").single();
 if(error||!data)return invalid(409,"A pending order may already exist. Refresh your checkout status.");
 return Response.json({orderId:data.id,status:"requested",pricePaise:14900,payee:studioPayee},{status:201,headers:hdr});
}
