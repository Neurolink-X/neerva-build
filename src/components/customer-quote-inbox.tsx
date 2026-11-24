"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";

type Offer={
 id:string;tenant_id:string;subtotal_paise:number;tax_paise:number;
 freight_paise:number;unloading_paise:number;total_paise:number;
 valid_until:string;terms:string
};
type CustomerRequest={
 id:string;material_description:string;quantity:number;unit:string;city:string;
 pincode:string;status:string;created_at:string;offers:Offer[]|null
};
type InboxResponse={requests?:CustomerRequest[];error?:string};
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"});
const formatPaise=(value:number)=>money.format(value/100);

export function CustomerQuoteInbox(){
 const client=createNeervaBrowserClient();
 const [requests,setRequests]=useState<CustomerRequest[]>([]);
 const [message,setMessage]=useState("Loading your private quotation requests…");
 const [deliveryAddresses,setDeliveryAddresses]=useState<Record<string,string>>({});
 const [accepting,setAccepting]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const keys=useRef<Record<string,string>>({});
 const reload=useCallback(async()=>{
  if(!client){setMessage("Neerva account authentication is not configured.");return;}
  try{
   const {data}=await client.auth.getSession();
   const token=data.session?.access_token;
   if(!token){setMessage("Sign in to view your private quotations and dealer offers.");return;}
   const response=await fetch("/api/customer/quotes",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
   const result=await response.json().catch(()=>({error:"Quotation data is unavailable."})) as InboxResponse;
   if(!response.ok){setMessage(result.error??"Quotation records cannot be loaded.");return;}
   setRequests(Array.isArray(result.requests)?result.requests:[]);
   setMessage("");
  }catch{setMessage("Network error. Refresh your private quotes before continuing.");}
 },[client]);
 useEffect(()=>{
  const controller=window.setTimeout(()=>void reload(),0);
  return()=>window.clearTimeout(controller);
 },[reload]);
 async function accept(event:FormEvent<HTMLFormElement>,quote:CustomerRequest,offer:Offer){
  event.preventDefault();
  if(accepting)return;
  const address=(deliveryAddresses[quote.id]??"").trim();
  if(address.length<12||address.length>300){setMessage("Enter a complete delivery address (12–300 characters).");return;}
  const key=quote.id+":"+offer.id;
  keys.current[key]??=crypto.randomUUID();
  setAccepting(key);setMessage("");setSuccess(null);
  try{
   const session=await client?.auth.getSession();
   const jwt=session?.data.session?.access_token;
   if(!jwt){setMessage("Session expired. Sign in and check My Orders before retrying.");return;}
   const response=await fetch("/api/orders",{method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+jwt},
    body:JSON.stringify({offerId:offer.id,idempotencyKey:keys.current[key],
     deliveryAddress:address,quoteAccepted:true})
   });
   const result=await response.json().catch(()=>({error:"Could not read order response."})) as
    {order?:{code:string};error?:string;duplicate?:boolean};
   if(!response.ok){
    setMessage(result.error??"No order was confirmed. Review the offer or contact support.");
    return;
   }
   setSuccess((result.duplicate?"Existing":"New")+" request "+(result.order?.code??"")+" saved. The dealer must confirm stock and delivery. No payment was taken.");
   await reload();
  }catch{setMessage("Connection interrupted. Check My Orders before submitting again; no payment was taken.")}
  finally{setAccepting(null)}
 }
 return <section aria-label="My private material quotations" style={{maxWidth:1050}}>
  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:14}}>
   <button className="button button-outline" type="button" disabled={Boolean(accepting)} onClick={()=>void reload()}>Refresh quotations</button>
   <Link href="/account/orders">View accepted orders</Link>
   <Link href="/quotes">Prepare a new quote</Link>
  </div>
  <p>Offers are private and can expire. Only accepted, approved dealer proposals are checked for matching delivery coverage. Submitting an acceptance does not charge you or guarantee dispatch.</p>
  {message&&<p role="alert" style={{padding:12,borderRadius:10,background:"#fff3e9"}}>{message}</p>}
  {success&&<p role="status" style={{padding:12,borderRadius:10,background:"#edf7eb"}}>{success} <Link href="/account/orders">Track request</Link></p>}
  {!message&&!requests.length&&<p>No material quotations are saved yet. <Link href="/materials">Explore construction materials</Link>.</p>}
  <div style={{display:"grid",gap:18}}>
   {requests.map(quote=>{
    const active=["open","quoted"].includes(quote.status);
    return <article key={quote.id} style={{background:"#fffefa",padding:18,border:"1px solid #d9e4d8",borderRadius:15}}>
     <h3 style={{fontSize:20,margin:"0 0 8px"}}>{quote.material_description}</h3>
     <p>{quote.quantity} {quote.unit} · {quote.city} {quote.pincode} · Status: <strong>{quote.status.replaceAll("_"," ")}</strong></p>
     <p style={{fontSize:12}}>Created {new Date(quote.created_at).toLocaleString("en-IN")} · Reference {quote.id.slice(0,8)}</p>
     {!(quote.offers??[]).length&&<p>No eligible dealer has submitted an offer yet. The admin sourcing queue may review your request. No order exists at this stage.</p>}
     {(quote.offers??[]).map(offer=>{
      const valid=active&&Number.isFinite(Date.parse(offer.valid_until))&&Date.parse(offer.valid_until)>Date.now();
      return <section key={offer.id} style={{borderTop:"1px solid #e4e9e0",paddingTop:14,marginTop:14}}>
       <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,flexWrap:"wrap"}}>
        <strong>Dealer proposal · {offer.id.slice(0,8)}</strong>
        <strong style={{fontSize:19}}>{formatPaise(offer.total_paise)}</strong>
       </div>
       <p style={{fontSize:13}}>Items {formatPaise(offer.subtotal_paise)} · GST {formatPaise(offer.tax_paise)} · Freight {formatPaise(offer.freight_paise)} · Unloading {formatPaise(offer.unloading_paise)}</p>
       <p style={{fontSize:13}}>Terms: {offer.terms}</p>
       <p style={{fontSize:12}}>Valid until {new Date(offer.valid_until).toLocaleString("en-IN")}</p>
       {valid?<form onSubmit={event=>void accept(event,quote,offer)} style={{display:"grid",gap:10}}>
        <label htmlFor={"address-"+quote.id+"-"+offer.id}>Complete house / street delivery address</label>
        <textarea id={"address-"+quote.id+"-"+offer.id} required minLength={12} maxLength={300} rows={2}
         value={deliveryAddresses[quote.id]??""}
         onChange={event=>setDeliveryAddresses(current=>({...current,[quote.id]:event.target.value}))}
         placeholder="House number, street, landmark and area (city and pincode are kept from your quote)"/>
        <label style={{display:"flex",gap:10,alignItems:"flex-start"}}>
         <input required type="checkbox" style={{marginTop:5}}/>
         <span>I accept this offer total and dealer terms. I understand delivery still requires seller confirmation, and no payment is being collected now.</span>
        </label>
        <button type="submit" className="button button-dark" disabled={Boolean(accepting)}
         style={{justifySelf:"start",minHeight:45}}>{accepting===quote.id+":"+offer.id?"Checking offer securely…":"Accept offer & request confirmation"}</button>
       </form>:<p style={{fontSize:13}}>This offer is expired or this request is closed. <Link href="/quotes">Start a new request</Link>.</p>}
      </section>;
     })}
    </article>;
   })}
  </div>
 </section>;
}
