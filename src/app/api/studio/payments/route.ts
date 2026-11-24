import {z} from "zod";
import {requireAuth,apiFailed} from "@/modules/identity/server-auth";
import {studioPaymentEnabled,isStudioProduct,studioPayee} from "@/modules/studio/paid-products";
import {parseStudioConfig} from "@/modules/studio/studio-config";
export const dynamic="force-dynamic";export const runtime="nodejs";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const invalid=(status:number,error:string)=>Response.json({error},{status,headers:hdr});
async function limitedBody(req:Request){
 if(!req.headers.get("content-type")?.includes("application/json")||
 Number(req.headers.get("content-length")||0)>1500)return null;
 try{const body=await req.text();return body.length<=1500?JSON.parse(body) as unknown:null}
 catch{return null}
}
const schema=z.object({product:z.enum(["home_studio","colour_studio"])}).strict();
const cancelSchema=z.object({orderId:z.string().uuid()}).strict();
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const url=new URL(request.url),product=url.searchParams.get("product");
 if(!isStudioProduct(product))return invalid(400,"Select Home Studio or Colour Studio.");
 const [configResult,access,orders]=await Promise.all([
  auth.client.from("studio_feature_settings").select("product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version").eq("product_code",product).maybeSingle(),
  auth.client.from("studio_paid_access").select("order_id,granted_at").eq("user_id",auth.userId).eq("product_code",product).is("revoked_at",null).maybeSingle(),
  auth.client.from("studio_paid_orders").select("id,status,created_at,amount_paise").eq("user_id",auth.userId).eq("product_code",product).order("created_at",{ascending:false}).limit(5)
 ]);
 if(configResult.error||access.error||orders.error)return apiFailed();
 const config=parseStudioConfig(configResult.data);
 if(!config||!config.published)return invalid(503,"Studio settings are not available; checkout is paused.");
 const ids=(orders.data??[]).map(o=>o.id);
 const claims=ids.length?await auth.client.from("studio_payment_claims").select("order_id").eq("user_id",auth.userId).in("order_id",ids):{data:[],error:null};
 if(claims.error)return apiFailed();
 const enabled=config.mode==="paid"&&config.checkoutEnabled&&studioPaymentEnabled(process.env);
 return Response.json({product,mode:config.mode,enabled,paid:!!access.data,canUseReport:config.mode==="free"||!!access.data,
  orders:orders.data??[],claimedOrderIds:(claims.data??[]).map(c=>c.order_id),pricePaise:config.pricePaise,
  version:config.version},{headers:hdr});
}
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(!studioPaymentEnabled(process.env))return invalid(503,"Paid checkout is paused pending payment/legal verification. Samples remain free.");
 const parsed=schema.safeParse(await limitedBody(request));
 if(!parsed.success)return invalid(400,"Choose a valid studio product.");
 const product=parsed.data.product;
 const [settings,access]=await Promise.all([
  auth.client.from("studio_feature_settings").select("product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version").eq("product_code",product).maybeSingle(),
  auth.client.from("studio_paid_access").select("order_id").eq("user_id",auth.userId).eq("product_code",product).is("revoked_at",null).maybeSingle()
 ]);
 if(settings.error||access.error)return apiFailed();
 const config=parseStudioConfig(settings.data);
 if(!config||!config.published||config.mode!=="paid"||!config.checkoutEnabled)return invalid(409,"This Studio is free or checkout was disabled by admin.");
 if(access.data)return Response.json({paid:true,orderId:access.data.order_id},{headers:hdr});
 const {data,error}=await auth.client.rpc("neerva_begin_studio_checkout",{p_product:product});
 if(error||!data)return invalid(409,"Checkout settings or pending order changed. Refresh and retry.");
 const orderId=data.orderId,pricePaise=data.pricePaise;
 if(typeof orderId!=="string"||!Number.isSafeInteger(pricePaise))return apiFailed();
 return Response.json({orderId,status:"requested",pricePaise,payee:studioPayee},{headers:hdr});
}
export async function DELETE(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const parsed=cancelSchema.safeParse(await limitedBody(request));
 if(!parsed.success)return invalid(400,"Choose a valid pending payment order.");
 const {data,error}=await auth.client.rpc("neerva_cancel_studio_checkout",{p_order:parsed.data.orderId});
 if(error)return apiFailed();
 if(data!==true)return invalid(409,"This order cannot be cancelled: payment may already be under review.");
 return Response.json({cancelled:true},{headers:hdr});
}
