"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {studioProducts,studioPayee,studioUpiUrl,type StudioProduct} from "@/modules/studio/paid-products";
type Order={id:string;status:string;created_at:string};
type Status={product:StudioProduct;enabled:boolean;paid:boolean;orders:Order[];claimedOrderIds:string[];pricePaise:number};
export function StudioCheckout({product}:{product:StudioProduct}){
 const [token,setToken]=useState(""),[status,setStatus]=useState<Status|null>(null);
 const [orderId,setOrderId]=useState(""),[utr,setUtr]=useState(""),[paidAt,setPaidAt]=useState("");
 const [message,setMessage]=useState("Please sign in to check your access."),[busy,setBusy]=useState(false);
 const config=studioProducts[product],currency=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
 async function refresh(jwt:string){
  const res=await fetch("/api/studio/payments?product="+product,{cache:"no-store",headers:{Authorization:"Bearer "+jwt}});
  if(!res.ok){setMessage("Unable to verify your saved purchases. Retry after sign-in.");return;}
  const body=await res.json() as Status;
  setStatus(body);const requested=body.orders.find(v=>v.status==="requested");
  setOrderId(requested?.id??"");
  setMessage(body.paid?"Your paid studio access has been confirmed.":requested&&body.claimedOrderIds?.includes(requested.id)?"Payment reference received; waiting for independent bank verification.":requested?"Payment order is ready. Confirm payment details before proceeding.":"Free preview is ready.");
 }
 useEffect(()=>{
  let canceled=false;const client=createNeervaBrowserClient();
  if(!client){setMessage("Secure customer accounts are not configured.");return;}
  void client.auth.getSession().then(async x=>{
   if(canceled)return;const jwt=x.data.session?.access_token;
   if(!jwt){setMessage("Sign in to purchase or review your paid access.");return;}
   setToken(jwt);await refresh(jwt);
  }).catch(()=>{if(!canceled)setMessage("Session check failed. No payment was created.")});
  return ()=>{canceled=true};
 },[product]);
 async function createOrder(){
  if(!token||busy)return;setBusy(true);
  try{
   const response=await fetch("/api/studio/payments",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({product})});
   const data=await response.json();
   setMessage(response.ok?"Your ₹149 order is ready. Only pay after checking the UPI payee name and service.":String(data.error??"Order was not created."));
   if(response.ok)await refresh(token);
  }catch{setMessage("Network error. Please check order history before retrying.")}
  finally{setBusy(false);}
 }
 async function claim(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!token||!orderId||busy)return;
  const date=new Date(paidAt);if(!Number.isFinite(date.getTime())){setMessage("Enter a valid payment date and time.");return;}
  const at=date.toISOString();
  setBusy(true);
  try{
   const r=await fetch("/api/studio/payments/claim",{method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({orderId,utr:utr.toUpperCase().trim(),paidAt:at})});
   const data=await r.json();
   setMessage(r.ok?"UPI reference received. Access remains locked until bank verification.":String(data.error??"Claim not saved."));
   await refresh(token);
  }catch{setMessage("Unable to confirm reference submission. Please contact support.")}
  finally{setBusy(false);}
 }
 const pending=status?.orders.some(o=>o.status==="requested")??false;
 return <section className="studio-upgrade-checkout" aria-label={config.label+" purchase"}>
   <p className="eyebrow">OPTIONAL ONE-TIME UPGRADE</p>
   <h2>{config.label}</h2>
   <p>{config.description} Free samples and basic viewing remain available.</p>
   <div className="studio-upgrade-price"><strong>{currency.format(config.pricePaise/100)}</strong><span>per studio · one-time purchase · no auto-renewal</span></div>
   <p role="status" className="studio-upgrade-status">{message}</p>
   {!token&&<Link className="studio-upgrade-btn" href="/account">Sign in to see your access</Link>}
   {token&&status?.paid&&<p><strong>Paid access confirmed.</strong> Your premium features are unlocked for this account. <Link href={product==="home_studio"?"/design-studio/portfolio":"/design-studio/visualizer"}>Open studio →</Link></p>}
   {token&&status&&!status.paid&&!status.enabled&&<p>Checkout is currently paused pending operator and refund-policy verification. Please do not send money to this QR yet.</p>}
   {token&&status&&!status.paid&&status.enabled&&<>
    {!pending?<button type="button" className="studio-upgrade-btn" disabled={busy} onClick={()=>void createOrder()}>Generate secure payment reference</button>:<>
     <p className="studio-order-id">Order reference: <code>{orderId}</code></p>
     <div className="studio-upgrade-qr"><Image src={product==="home_studio"?"/images/studio-149-home-studio.svg":"/images/studio-149-colour-studio.svg"} width={220} height={220} alt={"QR for UPI ₹149 "+config.short}/></div>
     <p>Receiver: <strong>{studioPayee.name}</strong> · UPI ID: <code>{studioPayee.id}</code></p>
     <a className="studio-upgrade-btn" href={studioUpiUrl(product,orderId)}>Open any UPI app · ₹149</a>
     <p className="studio-upgrade-warning">Check the receiver name and ₹149 amount in your UPI app. The UPI intent fills service and amount; final confirmation remains inside the payment app. Do not pay twice for the same order. A UTR is not automatic payment verification.</p>
     {!(status.claimedOrderIds??[]).includes(orderId)&&<form onSubmit={claim}>
      <label>UPI transaction reference (UTR)<input required value={utr} onChange={e=>setUtr(e.target.value)} minLength={10} maxLength={35} placeholder="Reference from your bank/UPI app" autoComplete="off"/></label>
      <label>Actual payment date and time<input type="datetime-local" required value={paidAt} onChange={e=>setPaidAt(e.target.value)}/></label>
      <button type="submit" disabled={busy}>Submit payment reference for review</button>
     </form>}
    </>}
   </>}
   <p className="studio-upgrade-legal">This is a digital planning aid, not a certified architectural plan or physically colour-matched paint sample. <Link href="/returns">Payment, cancellation & refund policy</Link> · <Link href="/privacy">Privacy</Link></p>
  </section>;
}
