"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Ticket={id:string;order_id:string|null;issue:string;message:string;status:string;admin_reply:string|null;created_at:string};
export function StudioSupportForm(){
 const [jwt,setJwt]=useState(""),[tickets,setTickets]=useState<Ticket[]>([]);
 const [orderId,setOrderId]=useState(""),[issue,setIssue]=useState("payment_not_verified"),[message,setMessage]=useState("");
 const [status,setStatus]=useState("Sign in to open your private support request."),[busy,setBusy]=useState(false);
 async function load(token:string){
  const r=await fetch("/api/studio/support",{cache:"no-store",headers:{Authorization:"Bearer "+token}});
  if(!r.ok){setStatus("Ticket service is temporarily unavailable.");return;}
  const data=await r.json();setTickets(data.tickets??[]);setStatus("Your ticket history is private to your account.");
 }
 useEffect(()=>{
  let gone=false;const client=createNeervaBrowserClient();
  if(!client)return;
  void client.auth.getSession().then(async s=>{
   if(gone)return;
   const bearer=s.data.session?.access_token;
   if(!bearer)return;setJwt(bearer);await load(bearer);
  });
  return ()=>{gone=true};
 },[]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!jwt||busy)return;
  setBusy(true);
  try{
   const r=await fetch("/api/studio/support",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+jwt},
    body:JSON.stringify({orderId:orderId.trim()||null,issue,message})});
   const x=await r.json();
   setStatus(r.ok?"Support ticket created; keep your order/UPI reference and check this page for replies.":String(x.error??"Support request not saved."));
   if(r.ok){setMessage("");await load(jwt);}
  }catch{setStatus("Network error. Ticket was not confirmed saved.")}
  finally{setBusy(false)}
 }
 return <section className="studio-support-form">
  <h2>Private customer support</h2><p>Report a mistaken or duplicate UPI transfer, delayed verification, or access problem. Do not upload passwords, OTPs, full bank statements or card details.</p>
  <p role="status">{status}</p>
  {!jwt?<Link href="/account">Sign in to create a support ticket →</Link>:<>
  <form onSubmit={submit}>
   <label>What happened?<select value={issue} onChange={e=>setIssue(e.target.value)}>
    <option value="payment_not_verified">₹149 paid but not verified</option>
    <option value="duplicate_payment">Duplicate payment</option>
    <option value="refund_request">Refund request</option>
    <option value="studio_access">Paid Studio access issue</option>
    <option value="other">Other issue</option>
   </select></label>
   <label>Order ID (optional if no order was generated)<input type="text" value={orderId} onChange={e=>setOrderId(e.target.value)} maxLength={36} placeholder="Your order reference"/></label>
   <label>Describe the issue<textarea rows={5} minLength={15} maxLength={1000} required value={message} onChange={e=>setMessage(e.target.value)} placeholder="Date, UPI reference (UTR), what happened, expected action. Do not share passwords or PINs."/></label>
   <button type="submit" disabled={busy}>Create support request</button>
  </form>
  <h3>My support history</h3>
  {tickets.length? tickets.map(t=><article key={t.id}><strong>{t.issue.replaceAll("_"," ")} · {t.status.replaceAll("_"," ")}</strong><p>{t.message}</p><small>{new Date(t.created_at).toLocaleString("en-IN")} · Ticket {t.id}</small>{t.admin_reply&&<blockquote>{t.admin_reply}</blockquote>}</article>):<p>No support tickets recorded.</p>}
  </>}
 </section>;
}
