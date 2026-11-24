import {z} from "zod";
import {requireAdmin,apiFailed,apiData} from "@/modules/identity/server-auth";
import {parseStudioConfig} from "@/modules/studio/studio-config";
import {studioPaymentEnabled} from "@/modules/studio/paid-products";
export const dynamic="force-dynamic";export const runtime="nodejs";
const fail=(status:number,error:string)=>Response.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 const [rows,audit]=await Promise.all([
  auth.client.from("studio_feature_settings").select("product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version,updated_at,updated_by").order("product_code"),
  auth.client.from("studio_feature_settings_audit").select("id,product_code,actor_id,changed_at,previous,current").order("changed_at",{ascending:false}).limit(30)
 ]);
 if(rows.error||audit.error)return apiFailed();
 return apiData({products:(rows.data??[]).map(parseStudioConfig).filter(Boolean),
  audit:audit.data??[],paymentInfrastructureEnabled:studioPaymentEnabled(process.env)});
}
const schema=z.object({
 product:z.enum(["home_studio","colour_studio"]),
 mode:z.enum(["free","paid"]),pricePaise:z.number().int().min(1000).max(2000000),
 freePreviewCount:z.number().int().min(1).max(24),
 checkoutEnabled:z.boolean(),published:z.boolean(),expectedVersion:z.number().int().min(1)
}).strict();
export async function PATCH(request:Request){
 const auth=await requireAdmin(request);if(auth instanceof Response)return auth;
 if(!request.headers.get("content-type")?.includes("application/json")||
    Number(request.headers.get("content-length")||0)>2500)return fail(415,"Valid JSON required.");
 let input:unknown;
 try{const body=await request.text();input=body.length<=2500?JSON.parse(body):null}
 catch{return fail(400,"Malformed settings request.");}
 const parsed=schema.safeParse(input);if(!parsed.success)return fail(400,"Invalid pricing, release flag or preview configuration.");
 const v=parsed.data;
 if(v.mode==="free"&&v.checkoutEnabled)return fail(400,"Free Studio cannot accept a paid checkout.");
 const changes={
  access_mode:v.mode,price_paise:v.pricePaise,free_preview_count:v.freePreviewCount,
  checkout_enabled:v.checkoutEnabled,is_published:v.published
 };
 const {data,error}=await auth.client.from("studio_feature_settings").update(changes)
  .eq("product_code",v.product).eq("version",v.expectedVersion)
  .select("product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version")
  .maybeSingle();
 if(error)return apiFailed();
 if(!data)return fail(409,"Settings changed since you opened the page. Refresh before publishing.");
 const config=parseStudioConfig(data);
 if(!config)return apiFailed();
 return apiData({config,checkoutActuallyEnabled:config.checkoutEnabled&&studioPaymentEnabled(process.env),
  notice:config.mode==="free"?"Premium reports are now free for signed-in users.":
   config.checkoutEnabled&&!studioPaymentEnabled(process.env)?"Checkout stays paused until payment/legal production gates are explicitly enabled.":
   "Published price applies to new orders only; pending orders keep their original amount."});
}
