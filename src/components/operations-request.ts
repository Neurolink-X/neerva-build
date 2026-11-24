"use client";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
export async function operationsRequest<T>(path:string,method="GET",body?:unknown,signal?:AbortSignal):Promise<T>{
 const token=(await createNeervaBrowserClient()?.auth.getSession())?.data.session?.access_token;
 if(!token)throw Error("Sign in using an approved account.");
 const response=await fetch(path,{method,signal,cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const d=await response.json();if(!response.ok)throw Error(d.error??"Request failed.");return d as T;
}
