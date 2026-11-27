import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {planBriefSchema as brief} from "@/modules/studio/plan-brief-schema";
import {requireAuth} from "@/modules/identity/server-auth";
import {validatePlan,planGeometryDigest} from "@/modules/studio/plan-model";
import {finishSchemeSchema,validatedFinishScheme} from "@/modules/studio/finish-scheme-schema";
import {portfolioForPlanId} from "@/modules/studio/road-generator";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const error=(status:number,message:string)=>NextResponse.json({error:message},{status,headers});
const create=z.object({idempotencyKey:z.string().uuid(),title:z.string().trim().min(3).max(120),
 brief,finishScheme:finishSchemeSchema.optional(),finish:z.object({kit:z.enum(["simple-parapet","stepped-band","jali-screen","pergola","cantilever","cladding-band"]),main:z.string().regex(/^#[0-9a-f]{6}$/i),accent:z.string().regex(/^#[0-9a-f]{6}$/i)}).strict().optional(),variant:z.enum(["parking-left","parking-right"]),planId:z.string().min(5).max(200),geometryDigest:z.string().regex(/^[a-f0-9]{64}$/).optional()}).strict();
async function parseBounded(request:Request){if(!request.headers.get("content-type")?.toLowerCase().includes("application/json")||!request.body)return null;
 const size=Number(request.headers.get("content-length")??0);if(!Number.isFinite(size)||size<0||size>12000)return null;
 const reader=request.body.getReader(),decoder=new TextDecoder();let total=0,text="";
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>12000){await reader.cancel();return null}text+=decoder.decode(value,{stream:true})}
  text+=decoder.decode();return JSON.parse(text) as unknown;
 }catch{return null}finally{reader.releaseLock()}}
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
 const result=portfolioForPlanId(input.brief,input.planId);
 const plan=result.plans.find(p=>p.id===input.planId&&p.variant===input.variant);
 if(!plan)return NextResponse.json({error:"No safe draft fits this plot and room request.",blockers:result.blockers.slice(0,6)},{status:422,headers});
 if(validatePlan(plan).length)return error(422,"Draft failed circulation or dimension checks.");
 if(input.geometryDigest&&input.geometryDigest!==await planGeometryDigest(plan))return error(409,"The selected geometry has changed. Reopen the plan before saving.");
 if(input.finish)plan.facade={...plan.facade,...input.finish};
 const scheme=input.finishScheme?validatedFinishScheme({kind:"residential",plan},input.finishScheme):null;
 if(input.finishScheme&&!scheme)return error(422,"Finish selection does not match this plan.");
 const savedPlan=scheme?{...plan,finishScheme:scheme}:plan;
 const geometry=JSON.stringify(savedPlan);
 const sha=createHash("sha256").update(geometry).digest("hex");
 try{
  const {data:saved,error:failure}=await auth.client.from("studio_customer_projects").insert({
   owner_id:auth.userId,idempotency_key:input.idempotencyKey,title:input.title,
   plot_width_ft:input.brief.widthFt,plot_depth_ft:input.brief.depthFt,road_side:input.brief.roadSide,
   floors:input.brief.floors,bedrooms:input.brief.bedrooms,parking:input.brief.parking,
   plan_json:savedPlan,plan_sha256:sha,status:"draft"
  }).select("id,title,plan_sha256,status,created_at").single();
  if(failure?.code==="23505"){
   const {data:previous,error:readError}=await auth.client.from("studio_customer_projects")
   .select("id,title,plan_sha256,status,created_at").eq("owner_id",auth.userId)
   .eq("idempotency_key",input.idempotencyKey).maybeSingle();
   if(readError||!previous||previous.plan_sha256!==sha)return error(409,"The draft could not be confirmed; retry with a new request key.");
   return NextResponse.json({project:previous,duplicate:true},{headers});
  }
  if(failure||!saved)return error(503,"Project was not saved. No customer-facing confirmation was issued.");
  return NextResponse.json({project:saved,stored:true,conceptOnly:true,note:"Saved as private concept; city permissions and architect sign-off are still required."},{status:201,headers});
 }catch{return error(503,"Private project storage is temporarily unavailable.")}
}

