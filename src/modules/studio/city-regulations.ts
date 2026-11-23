/**
 * Neerva Studio ONLY. This module deliberately never falls back to the generic
 * NEXT_PUBLIC_SUPABASE_* environment used by another company application.
 */
import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {DESIGN_CITIES} from "./fit.ts";
export function normaliseStudioCity(value:string|null):string|null{
 if(!value)return null;
 const clean=value.trim().toLowerCase();
 return DESIGN_CITIES.find(city=>city.toLowerCase()===clean)?.toLowerCase()??null;
}
export function studioPublicClient(url=process.env.NEERVA_STUDIO_SUPABASE_URL,key=process.env.NEERVA_STUDIO_PUBLISHABLE_KEY):SupabaseClient|null{
 if(!url||!key?.startsWith("sb_publishable_"))return null;
 try{
  const origin=new URL(url);
  if(origin.protocol!=="https:"||!origin.hostname.endsWith(".supabase.co"))return null;
  return createClient(origin.toString(),key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 }catch{return null}
}
