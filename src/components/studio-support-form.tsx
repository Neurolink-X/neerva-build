"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {operationsRequest} from "./operations-request";
type Ticket={id:string;order_id:string|null;issue:string;message:string;status:string;admin_reply:string|null;created_at:string};
type Order={id:string;product_code:string;status:string;created_at:string;amount_paise:number};
const reasons={payment_not_verified:"Payment not verified",duplicate_payment:"Duplicate payment",refund_request:"Refund request",studio_access:"Studio access issue",other:"Other issue"} as const;
export function StudioSupportForm(){
 const [account,setAccount]=useState<string|null>(null),[ready,setReady]=useState(false),[accountError,setAccountError]=useState(""),[tickets,setTickets]=useState<Ticket[]>([]),[orders,setOrders]=useState<Order[]>([]),[ordersUnavailable,setOrdersUnavailable]=useState(false),[manualOrder,setManualOrder]=useState(false);
 const [orderId,setOrderId]=useState(""),[issue,setIssue]=useState<keyof typeof reasons>("other"),[message,setMessage]=useState("");
 const [notice,setNotice]=useState<{kind:"success"|"error";text:string;id?:string}|null>(null),[historyError,setHistoryError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const lock=useRef(false),historyVersion=useRef(0),identity=useRef<string|null>(null),requestKey=useRef<{fingerprint:string;id:string}|null>(null),feedback=useRef<HTMLDivElement>(null);
 async function load(userId:string){
  const version=++historyVersion.current;setLoading(true);setHistoryError("");
  try{const data=await operationsRequest<{tickets:Ticket[];orders?:Order[];ordersUnavailable?:boolean}>("/api/studio/support","GET",undefined,userId);
   if(identity.current===userId&&version===historyVersion.current){setTickets(data.tickets??[]);setOrders(data.orders??[]);setOrdersUnavailable(data.ordersUnavailable===true);}
  }catch(e){if(identity.current===userId&&version===historyVersion.current)setHistoryError(e instanceof Error?e.message:"Unable to refresh tickets.")}
  finally{if(identity.current===userId&&version===historyVersion.current)setLoading(false);}
 }
 useEffect(()=>{
  const client=createNeervaBrowserClient();let active=true;
  if(!client){queueMicrotask(()=>{if(active){setAccountError("Account service is unavailable. Please try again later.");setReady(true)}});return()=>{active=false}}
  function apply(id:string|null){if(!active)return;setReady(true);if(identity.current===id)return;identity.current=id;historyVersion.current++;setAccount(id);setTickets([]);setOrders([]);setOrdersUnavailable(false);setManualOrder(false);setNotice(null);setHistoryError("");setLoading(false);setMessage("");setOrderId("");requestKey.current=null;if(id)void load(id)}
  const {data:listener}=client.auth.onAuthStateChange((_event,session)=>{if(active)queueMicrotask(()=>apply(session?.user.id??null))});
  void client.auth.getSession().then(s=>{if(active&&s.error)setAccountError("Unable to verify your session. Sign in again.");apply(s.data.session?.user.id??null)}).catch(()=>{if(active)setAccountError("Unable to verify your session. Sign in again.");apply(null)});
  return()=>{active=false;identity.current=null;historyVersion.current++;listener.subscription.unsubscribe()};
 },[]);
 useEffect(()=>{if(notice)feedback.current?.focus()},[notice]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const userId=identity.current;if(!userId||lock.current)return;
  const payload={orderId:orderId.trim()||null,issue,message:message.trim()};
  const fingerprint=JSON.stringify([userId,payload]);if(requestKey.current?.fingerprint!==fingerprint)requestKey.current={fingerprint,id:crypto.randomUUID()};
  lock.current=true;setBusy(true);setNotice(null);
  try{const data=await operationsRequest<{ticket:{id:string;status:string}}>("/api/studio/support","POST",{...payload,requestId:requestKey.current.id},userId);
   if(identity.current!==userId)return;
   if(!data.ticket?.id)throw Error("Ticket receipt not confirmed. Retry with the same details.");
   setNotice({kind:"success",text:"Your support request was received. Track its status and replies below.",id:data.ticket.id});setMessage("");setOrderId("");setManualOrder(false);requestKey.current=null;
   void load(userId);
  }catch(e){if(identity.current===userId)setNotice({kind:"error",text:(e instanceof Error?e.message:"Support request not confirmed.")+" Your message is retained; retry with the same details."})}
  finally{lock.current=false;setBusy(false)}
 }
 return <section className="studio-support-form">
  <span className="nb-support-kicker">HELP CENTRE · PRIVATE ACCOUNT</span><h2>How can we help?</h2><p>Get help with Studio, payments or other platform issues. Never share passwords, OTPs, UPI PINs, full bank statements or card details.</p>
  {accountError&&<p role="alert">{accountError}</p>}
  {!ready?<p role="status">Checking your secure session…</p>:!account?<Link href="/account">Sign in to create a support ticket →</Link>:<>
  <form onSubmit={submit}>
   <label>What do you need help with?<select value={issue} disabled={busy} onChange={e=>setIssue(e.target.value as keyof typeof reasons)}>{Object.entries(reasons).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label>Related Studio order (optional){manualOrder?<input type="text" maxLength={36} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" disabled={busy} value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="Your Studio order UUID"/>:<select value={orderId} disabled={busy} onChange={e=>setOrderId(e.target.value)}><option value="">No Studio order / not applicable</option>{orders.map(o=><option key={o.id} value={o.id}>{o.product_code.replaceAll("_"," ")} · {new Date(o.created_at).toLocaleDateString("en-IN")} · ₹{o.amount_paise/100} · {o.status} · {o.id.slice(0,8)}</option>)}</select>}<small>Only orders belonging to your account appear here. For material orders, include the reference in your description.</small></label>
   <button type="button" className="nb-support-secondary" disabled={busy} onClick={()=>{setManualOrder(v=>!v);setOrderId("")}}>{manualOrder?"Choose from my orders":"Enter a Studio order ID manually"}</button>
   {ordersUnavailable&&<p role="status">Order list is temporarily unavailable. You can enter your Studio order ID manually or submit without one.</p>}
   <label>Describe your issue<textarea rows={4} minLength={15} maxLength={1000} required disabled={busy} value={message} onChange={e=>setMessage(e.target.value)} placeholder={issue==="payment_not_verified"||issue==="duplicate_payment"||issue==="refund_request"?"Payment date, UPI transaction reference (UTR), what happened, and expected action. Never share PINs.":"What happened, when, and what help do you need?"}/><small>{message.length}/1000 characters · minimum 15</small></label>
   <button type="submit" disabled={busy}>{busy?"Sending request…":"Send support request"}</button>
   {notice&&<div ref={feedback} tabIndex={-1} className={"nb-support-notice "+notice.kind} role={notice.kind==="error"?"alert":"status"}><strong>{notice.kind==="success"?"Request received":"Request not confirmed"}</strong><p>{notice.text}</p>{notice.id&&<small>Ticket ID: {notice.id}</small>}</div>}
  </form>
  <div className="nb-support-history-heading"><h3>My support requests</h3><button type="button" disabled={loading} onClick={()=>void load(account)}>{loading?"Refreshing…":"Refresh"}</button></div>
  <small>Your ticket history is private to your account and authorised support staff.</small>
  {historyError&&<p role="alert">{historyError}</p>}
  {tickets.length?tickets.map(t=><article key={t.id}><div className="nb-support-history-heading"><strong>{reasons[t.issue as keyof typeof reasons]??t.issue.replaceAll("_"," ")}</strong><span className="nb-support-state">{t.status.replaceAll("_"," ")}</span></div><p>{t.message}</p><small>{new Date(t.created_at).toLocaleString("en-IN")} · Ticket {t.id}</small>{t.order_id&&<p><small>Studio order: {t.order_id}</small></p>}{t.admin_reply?<blockquote><strong>Support reply</strong><p>{t.admin_reply}</p></blockquote>:<p><small>Awaiting support response.</small></p>}</article>):<p>{loading?"Loading your requests…":historyError?"History could not be loaded.":"No support tickets recorded."}</p>}
  </>}
 </section>;
}
