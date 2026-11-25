"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {categoryUnits,defaultCategoryUnit,categoryMaterialHints,quantityUnitLabels,isAllowedCategoryUnit,isMaterialCategory,type MaterialQuantityUnit} from "@/modules/catalog/category-units";

const supabase=createNeervaBrowserClient();
const intakeEnabled=process.env.NEXT_PUBLIC_RFQ_INTAKE_ENABLED==="true";
type Message={kind:"success"|"error";text:string;reference?:string;details?:string[]};
export function QuoteRequestForm({defaultCity,defaultCategory="aggregates",defaultMaterial="",defaultPincode="",defaultQuantity="",defaultUnit=""}:{defaultCity:string;defaultCategory?:string;defaultMaterial?:string;defaultPincode?:string;defaultQuantity?:string;defaultUnit?:string}){
 const requestKeys=useRef(new Map<string,string>()),submissionLock=useRef(false);
 const [verified,setVerified]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState<Message|null>(null);
 const [draftCopied,setDraftCopied]=useState(false);
 const [category,setCategory]=useState(isMaterialCategory(defaultCategory)?defaultCategory:"aggregates");
 const [unit,setUnit]=useState<MaterialQuantityUnit>(isAllowedCategoryUnit(category,defaultUnit)?defaultUnit:defaultCategoryUnit(category));
 const selectedUnits=categoryUnits(category);
 function changeCategory(value:string){if(!isMaterialCategory(value))return;setCategory(value);setUnit(defaultCategoryUnit(value));setMessage(null);}
 async function copyDraft(){
  const element=document.querySelector<HTMLFormElement>("#neerva-quote-form");
  if(!element)return;
  const form=new FormData(element);
  const material=String(form.get("materialDescription")??"").trim(),
   quantity=Number(form.get("quantity")),pincode=String(form.get("pincode")??"").trim(),
   city=String(form.get("city")??"").trim();
  if(material.length<3||!Number.isFinite(quantity)||quantity<.001||quantity>1000000||Math.abs(quantity*1000-Math.round(quantity*1000))>.00001||city.length<2||!/^[1-9][0-9]{5}$/.test(pincode)){
   setMessage({kind:"error",text:"Add material details, a positive quantity, city and a valid 6-digit pincode first."});return;
  }
  const draft=`NEERVA BUILD · Material quote draft (NOT sent)\nMaterial: ${material}\nCategory: ${category}\nQuantity: ${quantity} ${unit}\nCity: ${city}\nPincode: ${pincode}\nPreferred date: ${String(form.get("requestedDate")??"")||"Flexible"}\nGST, delivery, unloading, offer validity and real stock must be confirmed by the dealer.`;
  try{
   if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
   await navigator.clipboard.writeText(draft);
   setDraftCopied(true);setMessage({kind:"success",text:"Material draft copied. No personal contact information, order or payment was submitted."});
  }catch{setMessage({kind:"error",text:"Clipboard permission unavailable. You can still review and copy your material details manually."});}
 }

 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  const apply=(user:{email_confirmed_at?:string|null}|null|undefined)=>{if(active){setVerified(Boolean(user?.email_confirmed_at));setReady(true)}};
  void supabase.auth.getSession().then(({data})=>apply(data.session?.user??null)).catch(()=>{if(active)setReady(true)});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>apply(session?.user));
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(submissionLock.current)return;if(!supabase||!verified||!intakeEnabled){setMessage({kind:"error",text:"Submission is not available yet. Check the notice below."});return;}
  submissionLock.current=true;setBusy(true);setMessage(null);
  const element=event.currentTarget,form=new FormData(element);
  try{
   const session=await supabase.auth.getSession();
   const token=session.data.session?.access_token;
   if(!token||!session.data.session?.user.email_confirmed_at){setVerified(false);setMessage({kind:"error",text:"Please verify your email and sign in again."});return;}
   const requestedDate=String(form.get("requestedDate")??"");
   const payload={
    categorySlug:String(form.get("categorySlug")??""),
    materialDescription:String(form.get("materialDescription")??""),
    quantity:Number(form.get("quantity")),unit:String(form.get("unit")??""),
    city:String(form.get("city")??""),pincode:String(form.get("pincode")??""),
    ...(requestedDate?{requestedDate}:{}),
    contactName:String(form.get("contactName")??""),phone:String(form.get("phone")??""),privacyAccepted:form.get("privacyAccepted")==="yes"
   };
   const fingerprint=JSON.stringify([session.data.session.user.id,payload]);
   const idempotencyKey=requestKeys.current.get(fingerprint)??crypto.randomUUID();
   requestKeys.current.set(fingerprint,idempotencyKey);
   const body={idempotencyKey,...payload};
   const response=await fetch("/api/rfqs",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(body),cache:"no-store"});
   const result=await response.json().catch(()=>null) as {requestId?:string;error?:string;reference?:string;fields?:{message:string}[]}|null;
   if(!response.ok){
    setMessage({kind:"error",text:result?.error??"Request not saved. Retry safely.",reference:result?.reference,details:result?.fields?.map(f=>f.message)});
   }else if(!result?.requestId){
    setMessage({kind:"error",text:"Request status could not be confirmed. Keep the form and retry."});
   }else{
    setMessage({kind:"success",text:"Your material request was securely recorded. No dealer offer or delivery is guaranteed yet.",reference:result.requestId});
    element.reset();requestKeys.current.delete(fingerprint);setCategory(isMaterialCategory(defaultCategory)?defaultCategory:"aggregates");setUnit(isAllowedCategoryUnit(defaultCategory,defaultUnit)?defaultUnit:defaultCategoryUnit(isMaterialCategory(defaultCategory)?defaultCategory:"aggregates"));
   }
  }catch{setMessage({kind:"error",text:"Network issue. Your details remain in the form; retry with the same request reference."})}
  finally{submissionLock.current=false;setBusy(false)}
 }
 return <form id="neerva-quote-form" className="rfq-form" onSubmit={submit}>
  <div className="rfq-form-title"><span>YOUR MATERIAL REQUIREMENT</span><h2>Tell us what you need.</h2><small>Start with your material, quantity and delivery location. Copy a draft now, or submit securely when dealer sourcing opens.</small></div>
  <div className="rfq-form-section-label">01 · Material and delivery</div><div className="rfq-form-grid">
   <label>Material category<select name="categorySlug" value={category} onChange={event=>changeCategory(event.target.value)}><option value="aggregates">Balu, morang or aggregates</option><option value="steel">Steel / TMT</option><option value="cement">Cement</option><option value="bricks-blocks">Bricks / blocks</option><option value="plumbing">Pipes / plumbing</option><option value="electrical">Electrical</option><option value="paint">Paint & coatings</option><option value="tiles">Tiles & flooring</option><option value="hardware">Hardware & adhesive</option></select></label>
   <label>Material details<input name="materialDescription" required minLength={3} maxLength={240} defaultValue={defaultMaterial} placeholder={categoryMaterialHints[category]}/></label>
   <label>Quantity<input name="quantity" required type="number" min="0.001" step="0.001" max="1000000" defaultValue={defaultQuantity} placeholder="Quantity"/></label>
   <label>Unit<select name="unit" value={unit} onChange={event=>setUnit(event.target.value as MaterialQuantityUnit)}>{selectedUnits.map(option=><option value={option} key={option}>{quantityUnitLabels[option]}</option>)}</select><small>Units update automatically with the selected material category.</small></label>
   <label>Delivery city<input name="city" required minLength={2} maxLength={80} defaultValue={defaultCity}/></label>
   <label>Delivery pincode<input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} defaultValue={defaultPincode}/></label>
   <label>Preferred delivery date (optional)<input name="requestedDate" type="date"/></label>
  </div>
  <div className="rfq-form-section-label">02 · Your contact details (for verified enquiries)</div><div className="rfq-form-grid rfq-contact-grid">
   <label>Contact name<input name="contactName" required minLength={2} maxLength={100} autoComplete="name"/></label>
   <label>Contact mobile<input name="phone" required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national"/></label>
  </div>
  <label className="rfq-consent"><input type="checkbox" name="privacyAccepted" value="yes" required/> <span>I agree to submit my contact number and request details for private quotation handling. <Link href="/privacy">Read the privacy notice</Link>. No payment is requested.</span></label>
  {!intakeEnabled&&<p className="rfq-unavailable" role="status">Quote intake is currently paused until verified dealer sourcing, support and privacy readiness are approved. You can prepare details, but clicking Submit cannot save a request yet. No payment is requested.</p>}
  {!supabase?<p role="status">Account service unavailable. You can still copy your material draft.</p>:!ready?<p role="status">Checking your secure account session…</p>:!verified?<p className="rfq-unavailable" role="status">Sign in with a verified email before submitting. <Link href="/account">Open account access →</Link></p>:<p className="rfq-privacy">Your request is stored privately, with duplicate protection and submission limits. It is not an order or payment confirmation.</p>}
  {message&&<div className={`rfq-status ${message.kind}`} role={message.kind==="error"?"alert":"status"}><p>{message.text}</p>{message.details?.length?<ul>{message.details.map(item=><li key={item}>{item}</li>)}</ul>:null}{message.reference&&<small>Reference: {message.reference}</small>}</div>}
  <div className="rfq-actions"><button type="button" className="button rfq-copy" onClick={()=>void copyDraft()}>{draftCopied?"Copy draft again":"Copy material quote draft"}</button><button className="button button-dark rfq-submit" type="submit" disabled={!intakeEnabled||!ready||!verified||busy}>{!intakeEnabled?"Requests not open yet":busy?"Sending securely…":"Submit private request →"}</button></div>
  <small className="rfq-privacy">Copying is local to your device; it does not send an enquiry. Do not enter card details. Any dealer offer must include GST, transport, unloading and valid-until date.</small>
 </form>;
}
