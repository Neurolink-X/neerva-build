"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {operationsRequest} from "./operations-request";
type Application={id:string;legal_business_name:string;gstin:string;shop_city:string;status:string;gstin_verification:string;decision_reason:string|null};
type Data={application:Application|null;categories:{id:string;name_en:string}[];pins:string[];selectedCategories:string[];photos:{id:string;review_status:string}[];shopPincode:string};
type Draft={name:string;gstin:string;city:string;shopPin:string;pins:string;categories:string[]};
const empty:Draft={name:"",gstin:"",city:"",shopPin:"",pins:"",categories:[]};
export function DealerOnboarding(){
 const [account,setAccount]=useState<{id:string;verified:boolean}|null>(null),[ready,setReady]=useState(false),[data,setData]=useState<Data|null>(null),[draft,setDraft]=useState<Draft>(empty),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[notice,setNotice]=useState<{kind:"success"|"error";text:string}|null>(null);
 const identity=useRef<string|null>(null),lock=useRef(false),revision=useRef(0),feedback=useRef<HTMLDivElement>(null),photoInput=useRef<HTMLInputElement>(null);
 async function load(id:string,hydrate:boolean){
  const seq=++revision.current;setLoading(true);
  try{const result=await operationsRequest<Data>("/api/dealer/onboarding","GET",undefined,id);
   if(identity.current!==id||seq!==revision.current)return;
   setData(result);
   if(hydrate){const a=result.application;setDraft(a?{name:a.legal_business_name,gstin:a.gstin,city:a.shop_city,shopPin:result.shopPincode,pins:result.pins.join(", "),categories:result.selectedCategories}:empty)}
  }catch(e){if(identity.current===id&&seq===revision.current)setNotice({kind:"error",text:e instanceof Error?e.message:"Unable to load your application."})}
  finally{if(identity.current===id&&seq===revision.current)setLoading(false)}
 }
 useEffect(()=>{
  const client=createNeervaBrowserClient();let active=true,authEventObserved=false;
  if(!client){queueMicrotask(()=>{if(active){setReady(true);setNotice({kind:"error",text:"Account service is unavailable."})}});return()=>{active=false}}
  function invalidate(){revision.current++;}
  function apply(id:string|null,verified:boolean){
   if(!active)return;setReady(true);setAccount(id?{id,verified}:null);
   if(identity.current===id)return;identity.current=id;invalidate();setData(null);setDraft(empty);setFile(null);setLoading(false);setNotice(null);
   if(id)void load(id,true);
  }
  const {data:listener}=client.auth.onAuthStateChange((_event,s)=>{authEventObserved=true;queueMicrotask(()=>apply(s?.user.id??null,Boolean(s?.user.email_confirmed_at)))});
  void client.auth.getSession().then(({data:s})=>{if(!authEventObserved)apply(s.session?.user.id??null,Boolean(s.session?.user.email_confirmed_at))}).catch(()=>{if(!authEventObserved)apply(null,false)});
  return()=>{active=false;identity.current=null;invalidate();listener.subscription.unsubscribe()}
 },[]);
 useEffect(()=>{if(notice)feedback.current?.focus()},[notice]);
 async function run(action:"save"|"photo"|"submit"){
  const id=identity.current;if(!id||!account?.verified||lock.current)return;
  lock.current=true;setBusy(true);setNotice(null);
  try{
   if(action==="save"){
    const pins=[...new Set([draft.shopPin.trim(),...draft.pins.split(/[\s,]+/).filter(Boolean)])];
    await operationsRequest("/api/dealer/onboarding","POST",{action,legalBusinessName:draft.name,gstin:draft.gstin,shopCity:draft.city,shopPincode:draft.shopPin.trim(),servicePincodes:pins,categoryIds:draft.categories},id);
   }else if(action==="photo"){
    const app=data?.application;if(!app||!file)throw Error("Save your business details and choose a shop photograph.");
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size<1||file.size>5*1024*1024)throw Error("Choose a JPG, PNG or WebP photo up to 5 MB.");
    const db=createNeervaBrowserClient();if(!db)throw Error("Storage service unavailable.");
    const {data:session}=await db.auth.getSession();if(session.session?.user.id!==id||identity.current!==id)throw Error("Account changed. Sign in again.");
    const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
    const path=app.id+"/"+crypto.randomUUID()+"."+ext;
    const uploaded=await db.storage.from("neerva-dealer-kyc").upload(path,file,{contentType:file.type,upsert:false});
    if(uploaded.error)throw Error("Photo upload not confirmed. Retry when connected.");
    if(identity.current!==id)throw Error("Account changed.");
    const saved=await db.from("dealer_shop_photos").insert({application_id:app.id,uploaded_by:id,storage_path:path,content_type:file.type,file_bytes:file.size});
    if(saved.error)throw Error("Photo record not confirmed. Refresh before trying again.");
    setFile(null);if(photoInput.current)photoInput.current.value="";
   }else{
    if(!data?.application)throw Error("Save your business details first.");
    await operationsRequest("/api/dealer/onboarding","POST",{action,applicationId:data.application.id},id);
   }
   if(identity.current===id){setNotice({kind:"success",text:action==="save"?"Business draft saved. Upload your shop photo next.":action==="photo"?"Private shop photo saved. Submit your application when ready.":"Application submitted for administrator review. Dealer access remains pending."});await load(id,true)}
  }catch(e){if(identity.current===id)setNotice({kind:"error",text:e instanceof Error?e.message:"Action could not be confirmed. Refresh and retry."})}
  finally{lock.current=false;setBusy(false)}
 }
 const app=data?.application,editable=!app||["draft","changes_requested"].includes(app.status),disabled=busy||loading;
 function save(e:FormEvent<HTMLFormElement>){e.preventDefault();void run("save")}
 return <section className="dealer-onboarding account-access-card">
 <span className="eyebrow">NEERVA PARTNER NETWORK</span><h2>Become a material dealer</h2><p>Register your business, choose your delivery coverage and submit private evidence. An administrator independently reviews your GST registration and shop before activating your account.</p>
 <div className="dealer-onboarding-steps" aria-label="Application progress"><span>1 · Business details</span><span>2 · Shop evidence</span><span>3 · Review & approval</span></div>
 {!ready?<p role="status">Checking your account…</p>:!account?<Link className="button button-dark" href="/account">Sign in or create account →</Link>:!account.verified?<p role="alert">Verify your email in <Link href="/account">account settings</Link> before applying.</p>:<>
 {app&&<div className="dealer-onboarding-status" role="status"><strong>Status: {app.status.replaceAll("_"," ")}</strong><small>Application: {app.id}</small><small>GST review: {app.gstin_verification}</small>{app.decision_reason&&<p>{app.decision_reason}</p>}{app.status==="approved"&&<Link className="button button-dark" href="/dealer/dashboard">Open dealer business centre →</Link>}</div>}
 {editable&&data&&<form className="account-auth-form" onSubmit={save}>
 <label>Legal business name<input required minLength={3} maxLength={160} value={draft.name} disabled={disabled} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
 <label>GSTIN<input required maxLength={15} minLength={15} value={draft.gstin} disabled={disabled} onChange={e=>setDraft({...draft,gstin:e.target.value.toUpperCase()})}/><small>Format validation is not GST registration verification.</small></label>
 <div className="dealer-onboarding-grid"><label>Shop city<input required minLength={2} maxLength={80} value={draft.city} disabled={disabled} onChange={e=>setDraft({...draft,city:e.target.value})}/></label><label>Shop pincode<input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={draft.shopPin} disabled={disabled} onChange={e=>setDraft({...draft,shopPin:e.target.value})}/></label></div>
 <label>Other service pincodes (comma separated)<input value={draft.pins} disabled={disabled} onChange={e=>setDraft({...draft,pins:e.target.value})} placeholder="208002, 208003"/><small>Maximum 20 including your shop pincode.</small></label>
 <fieldset disabled={disabled}><legend>Material categories</legend><div className="dealer-onboarding-categories">{data.categories.map(c=><label key={c.id}><input type="checkbox" checked={draft.categories.includes(c.id)} onChange={e=>setDraft({...draft,categories:e.target.checked?[...draft.categories,c.id]:draft.categories.filter(x=>x!==c.id)})}/>{c.name_en}</label>)}</div>{!data.categories.length&&<p>No published categories are available. Contact support.</p>}</fieldset>
 <button className="button button-dark" disabled={disabled||!draft.categories.length}>{busy?"Saving…":"Save business details"}</button></form>}
 {app&&editable&&<div className="account-auth-form"><h3>Private shop evidence</h3><p>Upload an actual photograph of your shop. Do not upload customer documents, passwords or banking information.</p><label>Shop photograph<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={e=>setFile(e.target.files?.[0]??null)}/></label><button type="button" className="button button-outline" disabled={disabled||!file} onClick={()=>void run("photo")}>Upload shop photo</button><p>{data?.photos.length??0} photo record(s) saved.</p><button type="button" className="button button-dark" disabled={disabled||!data?.photos.length} onClick={()=>void run("submit")}>Submit for verification →</button></div>}
 {app&&!editable&&app.status!=="approved"&&<p>Your application is {app.status.replaceAll("_"," ")}. No merchant privileges are granted until approval. <Link href="/support">Contact support</Link> if needed.</p>}
 <button type="button" className="button button-outline" disabled={disabled} onClick={()=>void load(account.id,true)}>{loading?"Refreshing…":"Refresh application status"}</button>
 </>}
 {notice&&<div ref={feedback} tabIndex={-1} role={notice.kind==="error"?"alert":"status"} className={"account-feedback "+notice.kind}>{notice.text}</div>}
 <p><small>Private shop evidence is accessible only to authorised reviewers and your account. <Link href="/privacy">Privacy notice</Link>.</small></p>
 </section>
}
