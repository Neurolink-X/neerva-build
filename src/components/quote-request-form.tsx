"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";

const supabase=createNeervaBrowserClient();
type Message={kind:"success"|"error";text:string;reference?:string;details?:string[]};
export function QuoteRequestForm({defaultCity,defaultCategory="aggregates",defaultMaterial=""}:{defaultCity:string;defaultCategory?:string;defaultMaterial?:string}){
 const requestKey=useRef<string|null>(null);
 const [verified,setVerified]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState<Message|null>(null);
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  const apply=(user:{email_confirmed_at?:string|null}|null|undefined)=>{if(active){setVerified(Boolean(user?.email_confirmed_at));setReady(true)}};
  void supabase.auth.getSession().then(({data})=>apply(data.session?.user??null)).catch(()=>{if(active)setReady(true)});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>apply(session?.user));
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!supabase||busy||!verified)return;
  const element=event.currentTarget,form=new FormData(element);
  const session=await supabase.auth.getSession();
  const token=session.data.session?.access_token;
  if(!token||!session.data.session?.user.email_confirmed_at){
   setVerified(false);setMessage({kind:"error",text:"Please verify your email and sign in again."});return;
  }
  setBusy(true);setMessage(null);
  requestKey.current??=crypto.randomUUID();
  const requestedDate=String(form.get("requestedDate")??"");
  const privacyAccepted=form.get("privacyAccepted")==="yes";
  const body={
   idempotencyKey:requestKey.current,categorySlug:String(form.get("categorySlug")??""),
   materialDescription:String(form.get("materialDescription")??""),
   quantity:Number(form.get("quantity")),unit:String(form.get("unit")??""),
   city:String(form.get("city")??""),pincode:String(form.get("pincode")??""),
   ...(requestedDate?{requestedDate}:{}),
   contactName:String(form.get("contactName")??""),phone:String(form.get("phone")??""),privacyAccepted
  };
  try{
   const response=await fetch("/api/rfqs",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(body),cache:"no-store"});
   const result=await response.json().catch(()=>null) as {requestId?:string;error?:string;reference?:string;fields?:{message:string}[]}|null;
   if(!response.ok){
    setMessage({kind:"error",text:result?.error??"Request not saved. Retry safely.",reference:result?.reference,details:result?.fields?.map(f=>f.message)});
   }else if(!result?.requestId){
    setMessage({kind:"error",text:"Request status could not be confirmed. Keep the form and retry."});
   }else{
    setMessage({kind:"success",text:"Your material request was securely recorded. No dealer offer or delivery is guaranteed yet.",reference:result.requestId});
    element.reset();requestKey.current=null;
   }
  }catch{setMessage({kind:"error",text:"Network issue. Your details remain in the form; retry with the same request reference."})}
  finally{setBusy(false)}
 }
 return <form className="rfq-form" onSubmit={submit}>
  <div className="rfq-form-title"><span>PRIVATE MATERIAL REQUEST</span><small>Only verified accounts can submit. Dealers are not yet onboarded.</small></div>
  <div className="rfq-form-grid">
   <label>Material category<select name="categorySlug" defaultValue={defaultCategory}><option value="aggregates">Balu, morang or aggregates</option><option value="steel">Steel / TMT</option><option value="cement">Cement</option><option value="bricks-blocks">Bricks / blocks</option><option value="plumbing">Pipes / plumbing</option><option value="electrical">Electrical / hardware</option></select></label>
   <label>Material details<input name="materialDescription" required minLength={3} maxLength={240} defaultValue={defaultMaterial} placeholder="Type, grade, size or exact item"/></label>
   <label>Quantity<input name="quantity" required type="number" min="0.001" step="0.001" max="1000000" placeholder="Quantity"/></label>
   <label>Unit<select name="unit" defaultValue="truck"><option value="truck">Truck</option><option value="tonne">Tonne</option><option value="cubic_metre">Cubic metre</option><option value="bag">Bag</option><option value="piece">Piece</option><option value="bundle">Bundle</option><option value="kg">Kilogram</option><option value="quintal">Quintal</option></select></label>
   <label>Delivery city<input name="city" required minLength={2} maxLength={80} defaultValue={defaultCity}/></label>
   <label>Delivery pincode<input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6}/></label>
   <label>Preferred delivery date (optional)<input name="requestedDate" type="date"/></label>
   <label>Contact name<input name="contactName" required minLength={2} maxLength={100} autoComplete="name"/></label>
   <label>Contact mobile<input name="phone" required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national"/></label>
  </div>
  <label className="rfq-consent"><input type="checkbox" name="privacyAccepted" value="yes" required/> <span>I agree to submit my contact number and request details for private quotation handling. <Link href="/privacy">Read the privacy notice</Link>. No payment is requested.</span></label>
  {!ready?<p role="status">Checking your secure account session…</p>:!verified?<p className="rfq-unavailable" role="status">Sign in with a verified email before submitting. <Link href="/account">Open account access →</Link></p>:<p className="rfq-privacy">Your request is stored privately, with duplicate protection and submission limits. It is not an order or payment confirmation.</p>}
  {message&&<div className={`rfq-status ${message.kind}`} role={message.kind==="error"?"alert":"status"}><p>{message.text}</p>{message.details?.length?<ul>{message.details.map(item=><li key={item}>{item}</li>)}</ul>:null}{message.reference&&<small>Reference: {message.reference}</small>}</div>}
  <button className="button button-dark rfq-submit" type="submit" disabled={!ready||!verified||busy}>{busy?"Sending securely…":"Submit private request →"}</button>
  <small className="rfq-privacy">Do not enter bank/card details. No prices, goods, or availability are guaranteed.</small>
 </form>;
}
