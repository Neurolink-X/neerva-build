"use client";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
export async function operationsRequest<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const client=createNeervaBrowserClient();
 if(!client)throw Error("Account service is not configured.");
 const session=await client.auth.getSession();
 if(session.error)throw Error("Account service is temporarily unavailable. Please retry.");
 const current=session.data.session;
 if(!current)throw Error("Sign in using an approved account.");
 const verb=method.toUpperCase();
 const request=(token:string)=>fetch(path,{method:verb,cache:"no-store",signal:AbortSignal.timeout(20000),headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
 let response=await request(current.access_token);
 // Only retry read-only requests after an explicit 401; never replay a financial
 // or order mutation after a lost response or silently switch account identities.
 if(response.status===401&&verb==="GET"){
  const refreshed=await client.auth.refreshSession();
  if(!refreshed.error&&refreshed.data.session?.user.id===current.user.id)response=await request(refreshed.data.session.access_token);
 }
 const d=await response.json().catch(()=>null);
 if(!response.ok)throw Error(typeof d?.error==="string"?d.error:response.status===503?"Service temporarily unavailable. Retry after checking the current state.":"Request failed. Refresh before retrying.");
 if(d===null)throw Error("Response could not be verified. Refresh before retrying.");
 return d as T;
}
