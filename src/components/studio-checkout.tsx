"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import Image from "next/image";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {studioProducts,studioPayee,studioUpiUrl,type StudioProduct} from "@/modules/studio/paid-products";
import {useStudioSettings} from "@/components/use-studio-settings";
type Order={id:string;status:string;created_at:string;amount_paise:number};
type Status={product:StudioProduct;enabled:boolean;mode:"free"|"paid";paid:boolean;canUseReport:boolean;orders:Order[];claimedOrderIds:string[];pricePaise:number};
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export function StudioCheckout({product}:{product:StudioProduct}){
 const [token,setToken]=useState(""),[status,setStatus]=useState<Status|null>(null);
 const [utr,setUtr]=useState(""),[paidAt,setPaidAt]=useState("");
 const [message,setMessage]=useState("Sign in to review your Studio access."),[busy,setBusy]=useState(false);
 const {ready,config}=useStudioSettings(product),label=studioProducts[product].label;
 const refresh=useCallback(async(jwt:string)=>{
  const res=await fetch("/api/studio/payments?product="+product,{cache:"no-store",headers:{Authorization:"Bearer "+jwt}});
  if(!res.ok){setMessage("Your account purchase status could not be checked. Checkout is paused.");return;}
  const body=await res.json() as Status;
  setStatus(body);
  const pending=body.orders.find(o=>o.status==="requested");
  setMessage(body.mode==="free"?"Admin has made this Studio report free.":body.paid?"Verified purchase found.":
   pending&&body.claimedOrderIds?.includes(pending.id)?"Receipt submitted. Bank confirmation pending.":
   pending?"Existing order loaded. Check its saved price before paying.":"Free previews remain available.");
 },[product]);
 useEffect(()=>{
  let cancelled=false;const client=createNeervaBrowserClient();if(!client)return;
  void client.auth.getSession().then(async s=>{
   if(cancelled)return;const jwt=s.data.session?.access_token;
   if(!jwt){setMessage("Sign in to purchase or check paid access.");return;}
   setToken(jwt);await refresh(jwt);
  }).catch(()=>{if(!cancelled)setMessage("Unable to verify account session.")});
  return ()=>{cancelled=true};
 },[refresh]);
 async function createOrder(){
  if(!token||busy)return;setBusy(true);
  try{
   const r=await fetch("/api/studio/payments",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({product})});
   const result=await r.json();
   setMessage(r.ok?"Order generated. Verify UPI receiver and exact amount before paying.":String(result.error??"Order not created."));
   if(r.ok)await refresh(token);
  }catch{setMessage("Network issue; refresh existing orders before retrying.")}
  finally{setBusy(false)}
 }
 async function cancelOrder(orderId:string){
  if(!token||busy)return;setBusy(true);
  try{
   const r=await fetch("/api/studio/payments",{method:"DELETE",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({orderId})});
   const data=await r.json();
   setMessage(r.ok?"Unpaid order cancelled. No money was collected.":String(data.error??"Could not cancel the order."));
   await refresh(token);
  }catch{setMessage("Order cancellation could not be verified.")}
  finally{setBusy(false)}
 }
 async function claim(e:FormEvent<HTMLFormElement>,orderId:string){
  e.preventDefault();if(!token||busy)return;
  const date=new Date(paidAt);
  if(!Number.isFinite(date.getTime())){setMessage("Enter a valid actual payment time.");return;}
  setBusy(true);
  try{
   const r=await fetch("/api/studio/payments/claim",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({orderId,utr:utr.trim().toUpperCase(),paidAt:date.toISOString()})});
   const data=await r.json();
   setMessage(r.ok?"Reference received. Access stays locked until verified against the bank statement.":String(data.error??"Claim not saved."));
   await refresh(token);
  }catch{setMessage("Could not confirm receipt; open support before paying again.")}
  finally{setBusy(false)}
 }
 const pending=status?.orders.find(o=>o.status==="requested"),hasClaim=!!pending&&!!status?.claimedOrderIds.includes(pending.id);
 const paymentActive=ready&&config.published&&config.mode==="paid"&&config.checkoutEnabled&&status?.enabled===true;
 return <section className="studio-upgrade-checkout" aria-label={label+" pricing"}>
  <p className="eyebrow">{config.mode==="free"?"FREE STUDIO":"OPTIONAL ONE-TIME UPGRADE"}</p>
  <h2>{label}</h2><p>{studioProducts[product].description}</p>
  <div className="studio-upgrade-price"><strong>{ready&&config.published?(config.mode==="free"?"FREE":money.format(config.pricePaise/100)):"Pricing unavailable"}</strong>
   <span>{config.mode==="free"?"No payment required":"One-time per Studio · no auto-renewal"}</span></div>
  <p role="status" className="studio-upgrade-status">{message}</p>
  {!token&&<Link className="studio-upgrade-btn" href="/account">Sign in to use this Studio</Link>}
  {token&&ready&&config.mode==="free"&&<p><strong>All signed-in customers can download this report for free.</strong> <Link href={product==="home_studio"?"/design-studio/portfolio":"/design-studio/visualizer"}>Open the Studio →</Link></p>}
  {token&&status?.paid&&config.mode==="paid"&&<p><strong>Access already verified.</strong> No second purchase necessary. <Link href={product==="home_studio"?"/design-studio/portfolio":"/design-studio/visualizer"}>Open your premium report →</Link></p>}
  {token&&status&&!status.paid&&config.mode==="paid"&&!paymentActive&&<p>Checkout is paused by admin or payment compliance controls. Do not transfer money to a QR outside a current order.</p>}
  {token&&status&&!status.paid&&config.mode==="paid"&&paymentActive&&<>
   {!pending?<button className="studio-upgrade-btn" type="button" disabled={busy} onClick={()=>void createOrder()}>Create verified-price UPI order</button>:<>
    <p>Order ID: <code>{pending.id}</code></p>
    <p><strong>Amount fixed for this order: {money.format(pending.amount_paise/100)}</strong></p>
    {pending.amount_paise!==config.pricePaise&&<p className="studio-upgrade-warning">The admin price changed after this order was created. The existing amount remains unchanged. Cancel an unpaid order to request the new price.</p>}
    {pending.amount_paise===14900?<div className="studio-upgrade-qr"><Image src={product==="home_studio"?"/images/studio-149-home-studio.svg":"/images/studio-149-colour-studio.svg"} width={220} height={220} alt={"UPI QR for ₹149 "+studioProducts[product].short}/></div>:<p className="studio-upgrade-warning">For this customised price, use the exact-amount UPI payment link below. No mismatched fixed-price QR will be shown.</p>}
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
