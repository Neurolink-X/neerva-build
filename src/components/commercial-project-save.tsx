"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import type {BuildingConcept} from "@/modules/studio/building-purpose";
import type {FinishScheme} from "@/modules/studio/finish-model";
type SavedProject={id:string;title:string;created_at:string};
type Restored={plan:BuildingConcept;finishes:FinishScheme};
export function CommercialProjectSave({plan,scheme,onRestore}:{plan:BuildingConcept;scheme:FinishScheme;onRestore:(snapshot:Restored)=>boolean}){
 const [projects,setProjects]=useState<SavedProject[]>([]),[listed,setListed]=useState(false);
 async function browse(id?:string){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice("");
  try{
   const {createNeervaBrowserClient}=await import("@/modules/supabase/browser");
   const client=createNeervaBrowserClient();
   if(!client){setNotice("Account service unavailable.");return;}
   const {data}=await client.auth.getSession(),token=data.session?.access_token;
   if(!token){setProjects([]);setListed(false);setNotice("Sign in to view saved designs.");return;}
   const response=await fetch("/api/studio/commercial-projects"+(id?"?id="+encodeURIComponent(id):""),{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:AbortSignal.timeout(20000)});
   const result=await response.json() as {enabled?:boolean;projects?:SavedProject[];project?:{snapshot:Restored};error?:string};
   if(!response.ok){setNotice(result.error??"Private designs unavailable.");return;}
   if(id){if(!result.project?.snapshot||!onRestore(result.project.snapshot))setNotice("This design could not be restored.");else setNotice("Private design restored.");}
   else if(result.enabled===true&&Array.isArray(result.projects)){setProjects(result.projects);setListed(true);}
   else setNotice("Private storage is not enabled.");
  }catch{setNotice("Private designs unavailable. Please retry.");}finally{lock.current=false;setBusy(false);}
 }
 const lock=useRef(false),retry=useRef<{fingerprint:string;key:string}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[savedFingerprint,setSavedFingerprint]=useState("");
 const fingerprint=JSON.stringify([plan.id,plan.signature,scheme]);
 async function save(){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice("");
  try{
   const {createNeervaBrowserClient}=await import("@/modules/supabase/browser");
   const client=createNeervaBrowserClient();if(!client){setNotice("Account service unavailable.");return;}
   const {data}=await client.auth.getSession(),session=data.session,token=session?.access_token;
   if(!session||!token){setNotice("Sign in to save your design.");return;}
   const key=JSON.stringify([session.user.id,fingerprint]);
   if(retry.current?.fingerprint!==key)retry.current={fingerprint:key,key:crypto.randomUUID()};
   const response=await fetch("/api/studio/commercial-projects",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({idempotencyKey:retry.current.key,title:plan.brief.purpose+" · "+plan.brief.widthFt+" × "+plan.brief.depthFt+" ft",brief:plan.brief,planId:plan.id,signature:plan.signature,finishes:scheme}),cache:"no-store",signal:AbortSignal.timeout(20000)});
   const result=await response.json() as {project?:{id?:string};error?:string};
   if(response.ok&&result.project?.id){setSavedFingerprint(fingerprint);setNotice("");setListed(false);setProjects([]);}else setNotice(result.error??"Design was not saved.");
  }catch{setNotice("Save could not be confirmed. Retry safely.");}finally{lock.current=false;setBusy(false);}
 }
 return <div><button className="button button-outline" type="button" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save private design"}</button>{savedFingerprint===fingerprint&&<p role="status">Private design saved.</p>}<button className="button button-outline" type="button" disabled={busy} onClick={()=>void browse()}>View saved private designs</button>{listed&&<div aria-label="Saved private designs">{projects.length===0?<p>No saved designs.</p>:<ul>{projects.map(p=><li key={p.id}><span>{p.title}</span> <button type="button" className="button button-outline" disabled={busy} onClick={()=>void browse(p.id)}>Restore design</button></li>)}</ul>}</div>}{notice&&<p role="status">{notice} {notice.startsWith("Sign in")&&<Link href="/account">Sign in →</Link>}</p>}</div>
}
