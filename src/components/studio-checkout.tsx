"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {StudioUpiQr} from "@/components/studio-upi-qr";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {studioProducts,studioPayee,studioUpiUrl,type StudioProduct} from "@/modules/studio/paid-products";
import {useStudioSettings} from "@/components/use-studio-settings";
import {isStudioCheckoutStatus,type StudioCheckoutStatus as Status} from "@/modules/studio/checkout-status";
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export function StudioCheckout({product}:{product:StudioProduct}){return <StudioCheckoutSession key={product} product={product}/>;}
function StudioCheckoutSession({product}:{product:StudioProduct}){
 const actionLock=useRef(false),sessionToken=useRef(""),sessionUser=useRef(""),readRequest=useRef<AbortController|null>(null);
 const [token,setToken]=useState(""),[status,setStatus]=useState<Status|null>(null);
 const [utr,setUtr]=useState(""),[paidAt,setPaidAt]=useState("");
 const [message,setMessage]=useState("Sign in to review your Studio access."),[busy,setBusy]=useState(false);
 const {ready,config}=useStudioSettings(product),label=studioProducts[product].label;
 const refresh=useCallback(async(jwt:string)=>{
  if(!jwt||sessionToken.current!==jwt)return;
  readRequest.current?.abort();
  const controller=new AbortController();readRequest.current=controller;
  const timeout=window.setTimeout(()=>controller.abort(),10000);
  const current=()=>readRequest.current===controller&&sessionToken.current===jwt;
  try{
   const res=await fetch("/api/studio/payments?product="+product,{cache:"no-store",signal:controller.signal,headers:{Authorization:"Bearer "+jwt}});
   if(!res.ok)throw Error("Status unavailable");
   const body:unknown=await res.json();
   if(!isStudioCheckoutStatus(body,product))throw Error("Invalid status");
   if(!current()||controller.signal.aborted)return;
   setStatus(body);
   const pending=body.orders.find(o=>o.status==="requested");
   setMessage(body.mode==="free"?"Admin has made this Studio report free.":body.paid?"Verified purchase found.":
    pending&&body.claimedOrderIds.includes(pending.id)?"Receipt submitted. Bank confirmation pending.":
    pending?"Existing order loaded. Check its saved price before paying.":"Free previews remain available.");
  }catch{if(current()){setStatus(null);setMessage("Your account purchase status could not be checked. Checkout is paused.");}}
  finally{window.clearTimeout(timeout);if(readRequest.current===controller)readRequest.current=null;}
 },[product]);
 useEffect(()=>{
  let cancelled=false,authEvent=false;
  const client=createNeervaBrowserClient();if(!client)return;
  const apply=(jwt:string,userId:string)=>{
   if(cancelled)return;
   if(jwt===sessionToken.current){if(!jwt)setMessage("Sign in to purchase or check paid access.");return;}
   readRequest.current?.abort();readRequest.current=null;
   if(userId!==sessionUser.current){setUtr("");setPaidAt("");sessionUser.current=userId;}
   sessionToken.current=jwt;setToken(jwt);setStatus(null);
   setMessage(jwt?"Checking your Studio access…":"Sign in to purchase or check paid access.");
   // Auth callback must not wait on Supabase or run a blocking auth call.
   if(jwt)void refresh(jwt);
  };
  const {data:listener}=client.auth.onAuthStateChange((_event,session)=>{authEvent=true;apply(session?.access_token??"",session?.user.id??"");});
  void client.auth.getSession().then(s=>{if(!authEvent)apply(s.data.session?.access_token??"",s.data.session?.user.id??"");}).catch(()=>{if(!cancelled&&!authEvent)setMessage("Unable to verify account session.")});
  return ()=>{cancelled=true;sessionToken.current="";readRequest.current?.abort();readRequest.current=null;listener.subscription.unsubscribe();};
 },[refresh]);
 async function createOrder(){
  if(!token||sessionToken.current!==token||actionLock.current)return;actionLock.current=true;setBusy(true);
  try{
   const r=await fetch("/api/studio/payments",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({product})});
   const result=await r.json();
   if(sessionToken.current!==token)return;
   setMessage(r.ok?"Order generated. Verify UPI receiver and exact amount before paying.":String(result.error??"Order not created."));
   if(r.ok)await refresh(token);
  }catch{if(sessionToken.current===token)setMessage("Network issue; refresh existing orders before retrying.")}
  finally{actionLock.current=false;setBusy(false)}
 }
 async function cancelOrder(orderId:string){
  if(!token||sessionToken.current!==token||actionLock.current)return;actionLock.current=true;setBusy(true);
  try{
   const r=await fetch("/api/studio/payments",{method:"DELETE",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({orderId})});
   const data=await r.json();
   if(sessionToken.current!==token)return;
   setMessage(r.ok?"Unpaid order cancelled. No money was collected.":String(data.error??"Could not cancel the order."));
   await refresh(token);
  }catch{if(sessionToken.current===token)setMessage("Order cancellation could not be verified.")}
  finally{actionLock.current=false;setBusy(false)}
 }
 async function claim(e:FormEvent<HTMLFormElement>,orderId:string){
  e.preventDefault();if(!token||sessionToken.current!==token||actionLock.current)return;
  const date=new Date(paidAt);
  if(!Number.isFinite(date.getTime())){setMessage("Enter a valid actual payment time.");return;}
  actionLock.current=true;setBusy(true);
  try{
   const r=await fetch("/api/studio/payments/claim",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({orderId,utr:utr.trim().toUpperCase(),paidAt:date.toISOString()})});
   const data=await r.json();
   if(sessionToken.current!==token)return;
   setMessage(r.ok?"Reference received. Access stays locked until verified against the bank statement.":String(data.error??"Claim not saved."));
   await refresh(token);
  }catch{if(sessionToken.current===token)setMessage("Could not confirm receipt; open support before paying again.")}
  finally{actionLock.current=false;setBusy(false)}
 }
 const pending=status?.orders.find(o=>o.status==="requested"),hasClaim=!!pending&&!!status?.claimedOrderIds.includes(pending.id);
 const paymentActive=ready&&config.published&&config.mode==="paid"&&config.checkoutEnabled&&status?.enabled===true;
 return <section className="studio-upgrade-checkout" aria-label={label+" pricing"}>
  <p className="eyebrow">{config.mode==="free"?"FREE STUDIO":"OPTIONAL ONE-TIME UPGRADE"}</p>
  <h2>{label}</h2><p>{studioProducts[product].description}</p>
  <div className="studio-upgrade-price"><strong>{ready&&config.published?(config.mode==="free"?"FREE":money.format(config.pricePaise/100)):"Pricing unavailable"}</strong>
   <span>{config.mode==="free"?"No payment required":"One-time per Studio · no auto-renewal"}</span></div>
  <p role="status" className="studio-upgrade-status">{message}</p>
  {token&&!status&&!busy&&<button type="button" className="studio-upgrade-btn" onClick={()=>void refresh(token)}>Refresh checkout status</button>}
  {!token&&<Link className="studio-upgrade-btn" href="/account">Sign in to use this Studio</Link>}
  {token&&ready&&config.mode==="free"&&<p><strong>All signed-in customers can download this report for free.</strong> <Link href={product==="home_studio"?"/design-studio/portfolio":"/design-studio/visualizer"}>Open the Studio →</Link></p>}
  {token&&status?.paid&&config.mode==="paid"&&<p><strong>Access already verified.</strong> No second purchase necessary. <Link href={product==="home_studio"?"/design-studio/portfolio":"/design-studio/visualizer"}>Open your premium report →</Link></p>}
  {token&&status&&!status.paid&&config.mode==="paid"&&!paymentActive&&<p>Checkout is paused by admin or payment compliance controls. Do not transfer money to a QR outside a current order.</p>}
  {token&&status&&!status.paid&&config.mode==="paid"&&paymentActive&&<>
   {!pending?<button className="studio-upgrade-btn" type="button" disabled={busy} onClick={()=>void createOrder()}>Create verified-price UPI order</button>:<>
    <p>Order ID: <code>{pending.id}</code></p>
    <p><strong>Amount fixed for this order: {money.format(pending.amount_paise/100)}</strong></p>
    {pending.amount_paise!==config.pricePaise&&<p className="studio-upgrade-warning">The admin price changed after this order was created. The existing amount remains unchanged. Cancel an unpaid order to request the new price.</p>}
    <div className="studio-upgrade-qr"><StudioUpiQr uri={studioUpiUrl(product,pending.id,pending.amount_paise)}
     amount={money.format(pending.amount_paise/100)}/></div>
    <p>Beneficiary: <strong>{studioPayee.name}</strong> · UPI: <code>{studioPayee.id}</code></p>
    <a className="studio-upgrade-btn" href={studioUpiUrl(product,pending.id,pending.amount_paise)}>Open UPI app · {money.format(pending.amount_paise/100)}</a>
    <p className="studio-upgrade-warning">Check the receiver and amount in your UPI app. A receipt or UTR does not automatically unlock access. Never pay twice for the same order.</p>
    {!hasClaim?<form onSubmit={e=>void claim(e,pending.id)}>
      <label>Bank UPI reference / UTR<input required minLength={10} maxLength={35} value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Reference from actual bank transaction"/></label>
      <label>Actual payment date and time<input required type="datetime-local" value={paidAt} onChange={e=>setPaidAt(e.target.value)}/></label>
      <button disabled={busy} type="submit">Submit reference for bank review</button>
     </form>:<p>Reference received. Bank reconciliation is pending; do not submit a second payment.</p>}
    {!hasClaim&&<button type="button" disabled={busy} onClick={()=>void cancelOrder(pending.id)}>Cancel this unpaid order</button>}
   </>}
  </>}
  <p className="studio-upgrade-legal">Free previews are unchanged. These are digital concepts, not certified structural plans. <Link href="/returns">Payment/refund policy</Link> · <Link href="/support">Customer support</Link></p>
 </section>;
}
