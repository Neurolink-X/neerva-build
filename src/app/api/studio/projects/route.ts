import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAuth} from "@/modules/identity/server-auth";
import {validatePlan,type PlanModel} from "@/modules/studio/plan-model";
import {generateSpatialPortfolio} from "@/modules/studio/road-generator";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const error=(status:number,message:string)=>NextResponse.json({error:message},{status,headers});
const brief=z.object({
 widthFt:z.number().finite().min(10).max(200),depthFt:z.number().finite().min(15).max(250),
 roadSide:z.enum(["N","E","S","W"]),floors:z.union([z.literal(1),z.literal(2),z.literal(3)]),
 bedrooms:z.number().int().min(1).max(3),parking:z.boolean(),
 siteShape:z.discriminatedUnion("kind",[
  z.object({kind:z.literal("rectangle")}).strict(),
  z.object({kind:z.literal("rear-left-notch"),notchWidthFt:z.number().finite().min(1).max(90),notchDepthFt:z.number().finite().min(1).max(90)}).strict(),
  z.object({kind:z.literal("rear-right-notch"),notchWidthFt:z.number().finite().min(1).max(90),notchDepthFt:z.number().finite().min(1).max(90)}).strict()
 ]).optional(),
 setbacks:z.object({frontFt:z.number().finite().min(0).max(30),rearFt:z.number().finite().min(0).max(30),
  leftFt:z.number().finite().min(0).max(30),rightFt:z.number().finite().min(0).max(30)}).strict()
}).strict();
const create=z.object({idempotencyKey:z.string().uuid(),title:z.string().trim().min(3).max(120),
 brief,finish:z.object({kit:z.enum(["simple-parapet","jali-screen","pergola"]),main:z.string().regex(/^#[0-9a-f]{6}$/i),accent:z.string().regex(/^#[0-9a-f]{6}$/i)}).strict().optional(),variant:z.enum(["parking-left","parking-right"]),planId:z.string().min(5).max(200)}).strict();
async function parseBounded(request:Request){if(!request.headers.get("content-type")?.includes("application/json"))return null;
 const size=Number(request.headers.get("content-length")??0);if(size>12000)return null;
 try{const text=await request.text();return text.length<=12000?JSON.parse(text) as unknown:null}catch{return null}}
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 try{const {data,error:failure}=await auth.client.from("studio_customer_projects")
 .select("id,title,plot_width_ft,plot_depth_ft,road_side,floors,bedrooms,parking,status,plan_sha256,updated_at")
 .eq("owner_id",auth.userId).order("updated_at",{ascending:false}).limit(30);
 if(failure)return error(503,"Saved projects are temporarily unavailable.");
 return NextResponse.json({projects:data??[],source:"owner_approved_rls"},{headers});
 }catch{return error(503,"Saved projects are temporarily unavailable.")}
}
/** Server recomputes authoritative geometry from selected parameters.
 * No arbitrary user-provided room JSON can bypass the plan validator or impersonate another owner.
 */
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 const check=create.safeParse(await parseBounded(request));
 if(!check.success)return error(400,"Invalid plot, room or project inputs.");
 const input=check.data;
 const result=generateSpatialPortfolio(input.brief,24);
 const plan=result.plans.find(p=>p.id===input.planId&&p.variant===input.variant);
 if(!plan)return NextResponse.json({error:"No safe draft fits this plot and room request.",blockers:result.blockers.slice(0,6)},{status:422,headers});
 if(validatePlan(plan).length)return error(422,"Draft failed circulation or dimension checks.");
 if(input.finish)plan.facade={...plan.facade,...input.finish};
 const geometry=JSON.stringify(plan);
 const sha=createHash("sha256").update(geometry).digest("hex");
 try{
  const {data:saved,error:failure}=await auth.client.from("studio_customer_projects").insert({
   owner_id:auth.userId,idempotency_key:input.idempotencyKey,title:input.title,
   plot_width_ft:input.brief.widthFt,plot_depth_ft:input.brief.depthFt,road_side:input.brief.roadSide,
   floors:input.brief.floors,bedrooms:input.brief.bedrooms,parking:input.brief.parking,
   plan_json:plan as PlanModel,plan_sha256:sha,status:"draft"
  }).select("id,title,plan_sha256,status,created_at").single();
  if(failure?.code==="23505"){
   const {data:previous,error:readError}=await auth.client.from("studio_customer_projects")
   .select("id,title,plan_sha256,status,created_at").eq("owner_id",auth.userId)
   .eq("idempotency_key",input.idempotencyKey).maybeSingle();
   if(readError||!previous)return error(409,"The draft could not be confirmed; retry with a new request key.");
   return NextResponse.json({project:previous,duplicate:true},{headers});
  }
  if(failure||!saved)return error(503,"Project was not saved. No customer-facing confirmation was issued.");
  return NextResponse.json({project:saved,stored:true,conceptOnly:true,note:"Saved as private concept; city permissions and architect sign-off are still required."},{status:201,headers});
 }catch{return error(503,"Private project storage is temporarily unavailable.")}
}

