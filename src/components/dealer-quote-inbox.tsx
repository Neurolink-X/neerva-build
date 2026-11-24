"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {SecureOperationsList} from "./secure-operations-list";

type RequestData={id:string;category_slug:string;material_description:string;quantity:number;unit:string;city:string;pincode:string;status:string};
type Invite={quote_request_id:string;tenant_id:string;status:string;invited_at:string;request:RequestData|RequestData[]|null};
type Offer={id:string;quote_request_id:string;tenant_id:string;revision:number;total_paise:number;valid_until:string};
type Payload={invites:Invite[];offers:Offer[]};
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"});
const requestFor=(invite:Invite)=>Array.isArray(invite.request)?invite.request[0]??null:invite.request;
const invitationId=(invite:Invite)=>invite.tenant_id+":"+invite.quote_request_id;
function toPaise(value:string){
 if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value.trim()))return null;
 const total=Math.round(Number(value)*100);
 return Number.isSafeInteger(total)&&total<=5_000_000_000?total:null;
}
export function DealerQuoteInbox(){
 const [token,setToken]=useState(""),[payload,setPayload]=useState<Payload|null>(null);
 const [selected,setSelected]=useState(""),[unitRate,setUnitRate]=useState("");
 const [tax,setTax]=useState("0"),[freight,setFreight]=useState("0"),[unloading,setUnloading]=useState("0");
 const [validDays,setValidDays]=useState("7"),[terms,setTerms]=useState("Rates subject to confirmed stock and the stated delivery date.");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("Sign in with an approved dealer account to submit a quote.");
 const reload=useCallback(async(jwt:string)=>{
  const response=await fetch("/api/dealer/quotes",{headers:{Authorization:"Bearer "+jwt},cache:"no-store"});
  const data=await response.json().catch(()=>({error:"Dealer quotations unavailable."})) as Payload&{error?:string};
  if(!response.ok){setNotice(data.error??"Dealer access unavailable.");setPayload(null);return;}
  setPayload({invites:data.invites??[],offers:data.offers??[]});
 },[]);
 useEffect(()=>{
  let active=true;
  const client=createNeervaBrowserClient();
  if(!client)return;
  void client.auth.getSession().then(async ({data})=>{
   if(!active)return;
   const jwt=data.session?.access_token;
   if(!jwt){setNotice("Sign in and obtain approved dealer membership first.");return;}
   setToken(jwt);
   await reload(jwt);
  }).catch(()=>{if(active)setNotice("Unable to verify your dealer session.")});
  return()=>{active=false};
 },[reload]);
 const activeInvites=useMemo(()=>(payload?.invites??[]).filter(invite=>{
  const request=requestFor(invite);
  return ["invited","viewed"].includes(invite.status)&&request?.status==="open";
 }),[payload]);
 const chosen=activeInvites.find(invite=>invitationId(invite)===selected)??activeInvites[0];
 const request=chosen?requestFor(chosen):null;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||!token||!chosen||!request)return;
  const amounts=[unitRate,tax,freight,unloading].map(toPaise);
  if(amounts.some(value=>value===null)||!amounts[0]||terms.trim().length<10){
   setNotice("Enter a positive unit price, valid tax/freight/unloading (0 allowed) and at least 10 characters of terms.");
   return;
  }
  const [unitPricePaise,taxPaise,freightPaise,unloadingPaise]=amounts as number[];
  setBusy(true);setNotice("Submitting itemised offer...");
  try{
   const response=await fetch("/api/dealer/quotes",{
    method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({
     quoteRequestId:chosen.quote_request_id,tenantId:chosen.tenant_id,
     lines:[{description:request.material_description.slice(0,180),quantity:request.quantity,unit:request.unit,unitPricePaise}],
     taxPaise,freightPaise,unloadingPaise,terms:terms.trim(),
     validUntil:new Date(Date.now()+Number(validDays)*86_400_000).toISOString()
    })
   });
   const result=await response.json().catch(()=>({error:"Dealer offer response unavailable."})) as {error?:string;offer?:{revision:number;total_paise:number}};
   if(!response.ok){setNotice(result.error??"Offer not saved. Nothing was sent to the customer.");return;}
   setNotice("Offer revision "+String(result.offer?.revision??1)+" saved for customer review. No order or payment was created.");
   await reload(token);
  }catch{setNotice("Network error. Verify your existing offers before submitting again.")}
  finally{setBusy(false)}
 }
 return <div className="catalog-admin-panel">
  <section className="catalog-admin-card" aria-label="Submit a dealer quotation offer">
   <h2>Respond to an assigned customer quote</h2>
   <p>Only approved dealer members with sales rights can submit an offer. Freight, tax, unloading and validity are separate and auditable. A quotation is not an accepted order.</p>
   <p role="status" aria-live="polite">{notice}</p>
   {token&&payload&&activeInvites.length===0&&<p>No open invitation is assigned to your approved dealer account. You cannot make unsolicited offers.</p>}
   {token&&payload&&activeInvites.length>0&&request&&chosen&&<form className="catalog-admin-form" onSubmit={e=>void submit(e)}>
    <label className="wide-field">Customer quotation
     <select value={chosen?invitationId(chosen):""} onChange={event=>{setSelected(event.target.value);setUnitRate("");}}>
      {activeInvites.map(invite=><option key={invitationId(invite)} value={invitationId(invite)}>
       {requestFor(invite)?.city??"Location"} · {requestFor(invite)?.material_description??"Material"} · {invite.quote_request_id.slice(0,8)}
      </option>)}
     </select>
    </label>
    <p className="wide-field">Material: <strong>{request.material_description}</strong> · Quantity: <strong>{request.quantity} {request.unit}</strong> · Delivery area: {request.city}, {request.pincode}</p>
    <label>Unit price (₹ per {request.unit})<input required inputMode="decimal" pattern="\d{1,8}(\.\d{1,2})?" value={unitRate} onChange={e=>setUnitRate(e.target.value)} placeholder="e.g. 420.00"/></label>
    <label>Tax / GST total (₹)<input required inputMode="decimal" value={tax} onChange={e=>setTax(e.target.value)}/></label>
    <label>Freight total (₹)<input required inputMode="decimal" value={freight} onChange={e=>setFreight(e.target.value)}/></label>
    <label>Unloading total (₹)<input required inputMode="decimal" value={unloading} onChange={e=>setUnloading(e.target.value)}/></label>
    <label>Offer validity
     <select value={validDays} onChange={e=>setValidDays(e.target.value)}>
      <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option>
     </select>
    </label>
    <label className="wide-field">Exact delivery terms<textarea required minLength={10} maxLength={2000} value={terms} onChange={e=>setTerms(e.target.value)}/></label>
    <p className="wide-field">Estimated offer total: <strong>{
      [unitRate,tax,freight,unloading].every(x=>toPaise(x)!==null)&&toPaise(unitRate)!==null
       ?money.format((Math.round((toPaise(unitRate)??0)*request.quantity)+(toPaise(tax)??0)+(toPaise(freight)??0)+(toPaise(unloading)??0))/100)
       :"Enter valid amounts"
     }</strong> — calculated by the server again before saving.</p>
    <button className="button button-dark wide-field" type="submit" disabled={busy||!unitRate}>{busy?"Saving verified offer...":"Submit itemised offer"}</button>
   </form>}
  </section>
  <SecureOperationsList endpoint="/api/dealer/quotes" title="Dealer quote inbox"
   description="Only invitations for your approved dealer membership are visible. Refresh after submitting an offer to see the newest revision."
   arrays={[{key:"invites",label:"Invitations",fields:["quote_request_id","status","invited_at"]},
    {key:"offers",label:"Submitted offers",fields:["quote_request_id","revision","total_paise","valid_until"]}]}/>
 </div>;
}
