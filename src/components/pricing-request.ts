"use client";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
export async function pricingRequest(path:string,method="GET",body?:unknown){const token=(await createNeervaBrowserClient()?.auth.getSession())?.data.session?.access_token;if(!token)throw Error("Sign in to continue.");const r=await fetch(path,{method,cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error(d.error??"Pricing service unavailable.");return d;}
