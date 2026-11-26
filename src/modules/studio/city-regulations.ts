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
/** Only the no-argument runtime call reads environment credentials. Explicit missing credentials must fail closed. */
export function studioPublicClient(...args:[]|[url:string|undefined,key:string|undefined]):SupabaseClient|null{
 const [url,key]=args.length===0?[process.env.NEERVA_STUDIO_SUPABASE_URL,process.env.NEERVA_STUDIO_PUBLISHABLE_KEY]:args;
 const local=process.env.NEERVA_E2E_LOCAL==="yes"&&process.env.NEERVA_E2E_DISPOSABLE==="yes"&&process.env.NEXT_PUBLIC_SUPABASE_URL==="http://127.0.0.1:54321"&&process.env.NEERVA_E2E_SUPABASE_URL==="http://127.0.0.1:54321";
 if(args.length===0&&local&&!url&&!key){const anon=process.env.NEERVA_E2E_SUPABASE_ANON_KEY;if(anon)return createClient("http://127.0.0.1:54321",anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
 if(!url||!key?.startsWith("sb_publishable_"))return null;
 try{
  const origin=new URL(url);
  if(origin.protocol!=="https:"||!origin.hostname.endsWith(".supabase.co"))return null;
  return createClient(origin.toString(),key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 }catch{return null}
}
