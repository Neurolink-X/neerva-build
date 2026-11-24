"use client";
import {useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Ticket={id:string;user_id:string;order_id:string|null;issue:string;message:string;status:string;admin_reply:string|null;created_at:string};
export function StudioSupportReview(){
 const [token,setToken]=useState(""),[tickets,setTickets]=useState<Ticket[]>([]),[message,setMessage]=useState("");
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false);
 async function load(jwt:string){
  const r=await fetch("/api/admin/studio-support",{cache:"no-store",headers:{Authorization:"Bearer "+jwt}});
  if(!r.ok)return;
  const x=await r.json();setTickets(x.tickets??[]);
 }
 useEffect(()=>{
  let canceled=false;
  void createNeervaBrowserClient()?.auth.getSession().then(async r=>{
   if(canceled||!r.data.session?.access_token)return;
   const jwt=r.data.session.access_token;setToken(jwt);await load(jwt);
  });
  return ()=>{canceled=true};
 },[]);
 async function review(id:string,status:"in_review"|"resolved"){
  if(busy||!token||!drafts[id]?.trim())return;setBusy(true);
  try{
   const r=await fetch("/api/admin/studio-support",{method:"PATCH",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({ticketId:id,status,reply:drafts[id]})});
   const x=await r.json();
   setMessage(r.ok?"Support response saved. Customer can see it in their account.":String(x.error??"Update failed."));
   if(r.ok)await load(token);
  }catch{setMessage("Could not confirm support response saved.")}
  finally{setBusy(false)}
 }
 return <section className="nb-studio-review"><h2>Refund and access support inbox</h2>
  <p role="status">{message}</p>
  {tickets.map(t=><article key={t.id}><strong>{t.issue.replaceAll("_"," ")} · {t.status}</strong>
   <small>Customer {t.user_id} · {new Date(t.created_at).toLocaleString("en-IN")}</small>
   <p>{t.message}</p>
   {t.admin_reply&&<blockquote>Previous reply: {t.admin_reply}</blockquote>}
   <label>Customer-visible response <textarea rows={3} maxLength={1000} value={drafts[t.id]??t.admin_reply??""} onChange={e=>setDrafts(v=>({...v,[t.id]:e.target.value}))}/></label>
   <div><button type="button" disabled={busy||!(drafts[t.id]??"").trim()} onClick={()=>void review(t.id,"in_review")}>Send review update</button>{" "}
   <button type="button" disabled={busy||!(drafts[t.id]??"").trim()} onClick={()=>void review(t.id,"resolved")}>Resolve ticket</button></div>
  </article>)}
  {!tickets.length&&<p>No support tickets in the queue.</p>}
 </section>;
}
