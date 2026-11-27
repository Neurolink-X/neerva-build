"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import type {BuildingConcept} from "@/modules/studio/building-purpose";
import type {FinishScheme} from "@/modules/studio/finish-model";
export function CommercialProjectSave({plan,scheme}:{plan:BuildingConcept;scheme:FinishScheme}){
 const lock=useRef(false),retry=useRef<{fingerprint:string;key:string}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[savedFingerprint,setSavedFingerprint]=useState("");
 const fingerprint=JSON.stringify([plan.id,plan.signature,scheme]);
 async function save(){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice("");
  try{
   const {createNeervaBrowserClient}=await import("@/modules/supabase/browser");
   const client=createNeervaBrowserClient();if(!client){setNotice("Account service unavailable.");return;}
   const {data}=await client.auth.getSession(),token=data.session?.access_token;
   if(!token){setNotice("Sign in to save your design.");return;}
   const key=JSON.stringify([data.session.user.id,fingerprint]);
   if(retry.current?.fingerprint!==key)retry.current={fingerprint:key,key:crypto.randomUUID()};
   const response=await fetch("/api/studio/commercial-projects",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({idempotencyKey:retry.current.key,title:plan.brief.purpose+" · "+plan.brief.widthFt+" × "+plan.brief.depthFt+" ft",brief:plan.brief,planId:plan.id,signature:plan.signature,finishes:scheme}),cache:"no-store",signal:AbortSignal.timeout(20000)});
   const result=await response.json() as {project?:{id?:string};error?:string};
   if(response.ok&&result.project?.id){setSavedFingerprint(fingerprint);setNotice("");}else setNotice(result.error??"Design was not saved.");
  }catch{setNotice("Save could not be confirmed. Retry safely.");}finally{lock.current=false;setBusy(false);}
 }
 return <div><button className="button button-outline" type="button" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save private design"}</button>{savedFingerprint===fingerprint&&<p role="status">Private design saved.</p>}{notice&&<p role="status">{notice} {notice.startsWith("Sign in")&&<Link href="/account">Sign in →</Link>}</p>}</div>
}
