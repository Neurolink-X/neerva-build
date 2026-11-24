import {z} from "zod";
import {requireAuth,apiFailed} from "@/modules/identity/server-auth";
import {generateSpatialPortfolio} from "@/modules/studio/road-generator";
import {planMetrics} from "@/modules/studio/plan-model";
import {parseStudioConfig,permittedStudioReport} from "@/modules/studio/studio-config";
export const runtime="nodejs";export const dynamic="force-dynamic";
const hdr={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(code:number,error:string)=>Response.json({error},{status:code,headers:hdr});
const brief=z.object({widthFt:z.number().finite().min(10).max(200),depthFt:z.number().finite().min(15).max(250),
 roadSide:z.enum(["N","E","S","W"]),floors:z.union([z.literal(1),z.literal(2),z.literal(3)]),
 bedrooms:z.number().int().min(1).max(3),parking:z.boolean(),
 setbacks:z.object({frontFt:z.number().min(0).max(30),rearFt:z.number().min(0).max(30),
  leftFt:z.number().min(0).max(30),rightFt:z.number().min(0).max(30)}).strict()}).strict();
const home=z.object({product:z.literal("home_studio"),brief,option:z.number().int().min(0).max(23)}).strict();
const colour=z.object({product:z.literal("colour_studio"),
 base:z.string().regex(/^#[0-9a-fA-F]{6}$/),accent:z.string().regex(/^#[0-9a-fA-F]{6}$/),
 room:z.string().trim().min(3).max(60)}).strict();
const request=z.discriminatedUnion("product",[home,colour]);
function palette(base:string,accent:string){
 const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const muted=rgb(base).map(x=>Math.min(255,Math.round(x*.72+255*.28)));
 const highlight=rgb(base).map(x=>Math.min(255,Math.round(x*.38+255*.62)));
 const toHex=(v:number[])=>"#"+v.map(n=>n.toString(16).padStart(2,"0")).join("");
 return [{label:"Main wall",colour:base},{label:"Feature wall",colour:accent},
  {label:"Soft supporting wall",colour:toHex(muted)},{label:"Light trim",colour:toHex(highlight)}];
}
export async function POST(req:Request){
 const auth=await requireAuth(req);if(auth instanceof Response)return auth;
 if(!req.headers.get("content-type")?.includes("application/json")||Number(req.headers.get("content-length")||0)>3500)return fail(415,"Valid JSON required.");
 let raw:unknown;try{const x=await req.text();raw=x.length<=3500?JSON.parse(x):null}catch{return fail(400,"Invalid request.");}
 const parsed=request.safeParse(raw);if(!parsed.success)return fail(400,"Invalid room plan or colour specification.");
 const p=parsed.data;
 const [settings,access]=await Promise.all([
  auth.client.from("studio_feature_settings").select(
   "product_code,access_mode,price_paise,checkout_enabled,is_published,free_preview_count,version"
  ).eq("product_code",p.product).maybeSingle(),
  auth.client.from("studio_paid_access").select("order_id").eq("user_id",auth.userId)
   .eq("product_code",p.product).is("revoked_at",null).maybeSingle()
 ]);
 if(settings.error||access.error)return apiFailed();
 const config=parseStudioConfig(settings.data);
 if(!config||!config.published)return fail(503,"Studio access settings are temporarily unavailable.");
 if(!permittedStudioReport(config,!!access.data))
  return fail(403,"This report requires a bank-verified purchase. Free 2D/3D and colour previews remain available.");
 if(p.product==="colour_studio"){
  return Response.json({product:p.product,room:p.room,swatches:palette(p.base,p.accent),
   disclaimer:"Digital shades are approximate. Compare real manufacturer shade cards and lighting before purchase."},{headers:hdr});
 }
 const plans=generateSpatialPortfolio(p.brief,24).plans;
 const plan=plans[p.option];if(!plan)return fail(409,"The selected plan no longer fits this plot. Select a valid configuration.");
 const metrics=planMetrics(plan);
 return Response.json({product:p.product,planId:plan.id,plot:plan.plot,floors:plan.floors,variant:plan.variant,
  rooms:plan.rooms.map(r=>({floor:r.floor,room:r.label,kind:r.kind,xFt:r.x,yFt:r.y,widthFt:r.w,depthFt:r.d})),
  openings:plan.openings.map(o=>({room:o.roomId,kind:o.kind,side:o.side,widthFt:o.widthFt})),
  measurements:metrics,
  disclaimer:"Illustrative concept measurements. Not a structural design, construction permit, CAD/BIM drawing, or priced bill of quantities."},{headers:hdr});
}
