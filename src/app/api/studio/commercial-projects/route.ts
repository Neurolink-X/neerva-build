import {createHash} from "node:crypto";
import {requireAuth,notReady} from "@/modules/identity/server-auth";
import {commercialSaveSchema,rebuildCommercialSnapshot} from "@/modules/studio/commercial-save";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
async function body(request:Request){
 if(!request.body||!request.headers.get("content-type")?.toLowerCase().includes("application/json"))return null;
 const limit=250000,length=Number(request.headers.get("content-length")??0);
 if(!Number.isFinite(length)||length<0||length>limit)return null;
 const reader=request.body.getReader(),decoder=new TextDecoder();let total=0,raw="";
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();return null;}raw+=decoder.decode(value,{stream:true});}return JSON.parse(raw+decoder.decode()) as unknown;}catch{return null;}finally{reader.releaseLock();}
}
export async function GET(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(process.env.COMMERCIAL_PROJECT_STORAGE_ENABLED!=="true")return reply({enabled:false,projects:[],reason:"storage_not_enabled"});
 try{
 const id=new URL(request.url).searchParams.get("id");
 if(id!==null){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply({error:"Invalid project identifier."},400);
  const {data,error}=await auth.client.from("studio_commercial_snapshots").select("id,title,idempotency_key,snapshot,snapshot_sha256").eq("owner_id",auth.userId).eq("id",id).maybeSingle();
  if(error)return reply({error:"Private design unavailable."},503);
  if(!data)return reply({error:"Private design not found."},404);
  // Stored JSON is untrusted, including rows inserted through the authenticated data API.
  const stored=data.snapshot;
  const parsed=commercialSaveSchema.safeParse({idempotencyKey:data.idempotency_key,title:data.title,brief:stored?.plan?.brief,planId:stored?.plan?.id,signature:stored?.plan?.signature,finishes:stored?.finishes});
  const rebuilt=parsed.success?rebuildCommercialSnapshot(parsed.data):null;
  if(!rebuilt||createHash("sha256").update(JSON.stringify(rebuilt)).digest("hex")!==data.snapshot_sha256)return reply({error:"This design revision cannot be restored safely."},422);
  return reply({project:{id:data.id,title:data.title,snapshot:rebuilt}});
 }
 const {data,error}=await auth.client.from("studio_commercial_snapshots").select("id,title,purpose,created_at").eq("owner_id",auth.userId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(30);
 return error?reply({error:"Private designs unavailable."},503):reply({enabled:true,projects:data??[]});}catch{return reply({error:"Private designs unavailable."},503);}
}
export async function POST(request:Request){
 const auth=await requireAuth(request);if(auth instanceof Response)return auth;
 if(process.env.COMMERCIAL_PROJECT_STORAGE_ENABLED!=="true")return notReady();
 const parsed=commercialSaveSchema.safeParse(await body(request));if(!parsed.success)return reply({error:"Invalid building or finish inputs."},400);
 const input=parsed.data,snapshot=rebuildCommercialSnapshot(input);if(!snapshot)return reply({error:"Selected design or finishes changed. Generate again before saving."},422);
 const serialized=JSON.stringify(snapshot);if(Buffer.byteLength(serialized)>360000)return reply({error:"Design exceeds snapshot size limit."},413);
 const sha=createHash("sha256").update(serialized).digest("hex");
 try{
 const {data,error}=await auth.client.from("studio_commercial_snapshots").insert({owner_id:auth.userId,idempotency_key:input.idempotencyKey,title:input.title,purpose:input.brief.purpose,snapshot,snapshot_sha256:sha}).select("id,title,purpose,created_at").single();
 if(error?.code==="23505"){
  const prior=await auth.client.from("studio_commercial_snapshots").select("id,title,purpose,created_at,snapshot_sha256").eq("owner_id",auth.userId).eq("idempotency_key",input.idempotencyKey).maybeSingle();
  if(prior.error||!prior.data||prior.data.snapshot_sha256!==sha||prior.data.title!==input.title)return reply({error:"Save request conflicts with an earlier version."},409);
  const {id,title,purpose,created_at}=prior.data;return reply({project:{id,title,purpose,created_at},duplicate:true});
 }
 if(error||!data)return reply({error:"Private design was not saved."},503);
 return reply({project:data,conceptOnly:true},201);
 }catch{return reply({error:"Private design was not saved."},503);}
}
