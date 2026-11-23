import {studioPublicClient,normaliseStudioCity} from "@/modules/studio/city-regulations";
export const dynamic="force-dynamic";
const json=(body:unknown,status:number)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function GET(request:Request){
 const city=normaliseStudioCity(new URL(request.url).searchParams.get("city"));
 if(!city)return json({error:"Choose a supported city: Kanpur, Ranchi, Lucknow, Jhansi or Mumbai."},400);
 const client=studioPublicClient();
 if(!client)return json({error:"Dedicated Neerva city-rule database is not configured. Do not assume a construction permission."},503);
 try{
  const {data,error}=await client.from("studio_city_rules")
   .select("city_slug,version,authority_name,source_url,legal_effective_on,verified_on,front_setback_ft,rear_setback_ft,left_setback_ft,right_setback_ft,habitable_min_sqft,kitchen_min_sqft,bath_min_sqft,max_far")
   .eq("city_slug",city).eq("status","verified").limit(1).maybeSingle();
  if(error)return json({error:"Verified city rules are temporarily unavailable."},503);
  if(!data)return json({city,status:"unverified",message:"No reviewed municipal constraints are published for this city."},200);
  return json({city,status:"verified",rules:data,notice:"Verify the latest authority notification and have the site-specific plan reviewed by a licensed architect/engineer."},200);
 }catch{return json({error:"Verified city rules are temporarily unavailable."},503)}
}
