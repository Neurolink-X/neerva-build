"use client";
import {trustedApiPath,readWithRecovery} from "@/modules/observability/recovery";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
export async function operationsRequest<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const destination=trustedApiPath(path,window.location.origin);
 if(!destination)throw Error("Unsafe request destination.");
 const client=createNeervaBrowserClient();
 if(!client)throw Error("Account service is not configured.");
 const session=await client.auth.getSession();
 if(session.error)throw Error("Account service is temporarily unavailable. Please retry.");
 const current=session.data.session;
 if(!current)throw Error("Sign in using an approved account.");
 const verb=method.toUpperCase();
 const request=(token:string)=>fetch(destination,{method:verb,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(verb==="GET"?12000:20000),headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
 let retried=false;
 let response=await readWithRecovery(verb,()=>request(current.access_token),async()=>{if(navigator.onLine===false||document.visibilityState==="hidden")return false;try{const latest=await client.auth.getSession();const active=latest.data.session;const same=!latest.error&&active?.user.id===current.user.id&&active.access_token===current.access_token;if(same)retried=true;return same}catch{return false}},()=>new Promise(resolve=>setTimeout(resolve,350+Math.random()*350)),r=>{void r.body?.cancel().catch(()=>undefined)});

 // Only retry read-only requests after an explicit 401; never replay a financial
 // or order mutation after a lost response or silently switch account identities.
 if(response.status===401&&verb==="GET"&&!retried){
  const refreshed=await client.auth.refreshSession();
  if(!refreshed.error&&refreshed.data.session?.user.id===current.user.id)response=await request(refreshed.data.session.access_token);
 }
 const d=await response.json().catch(()=>null);
 if(!response.ok)throw Error(typeof d?.error==="string"?d.error:response.status===503?"Service temporarily unavailable. Retry after checking the current state.":"Request failed. Refresh before retrying.");
 if(d===null)throw Error("Response could not be verified. Refresh before retrying.");
 return d as T;
}
