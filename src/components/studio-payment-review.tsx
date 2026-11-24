"use client";
import {useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Order={id:string;user_id:string;product_code:string;amount_paise:number;currency:string;status:string;created_at:string;reviewed_at:string|null};
type Claim={id:string;order_id:string;utr:string;reported_paid_at:string;created_at:string};
export function StudioPaymentReview(){
 const [jwt,setJwt]=useState(""),[orders,setOrders]=useState<Order[]>([]),[claims,setClaims]=useState<Claim[]>([]);
 const [ack,setAck]=useState<string[]>([]),[message,setMessage]=useState("Administrator login required."),[busy,setBusy]=useState(false);
 async function reload(token:string){
  const r=await fetch("/api/admin/studio-payments",{cache:"no-store",headers:{Authorization:"Bearer "+token}});
  if(!r.ok){setMessage("Payment review is not available for this account.");return;}
  const data=await r.json();setOrders(data.orders??[]);setClaims(data.claims??[]);
  setMessage("Always match UTR, the exact bank-credit amount and beneficiary with the original bank statement. Customer screenshots are not proof.");
 }
 useEffect(()=>{
  let canceled=false;const client=createNeervaBrowserClient();
  if(!client)return;
  void client.auth.getSession().then(async s=>{
   if(canceled)return;const token=s.data.session?.access_token;
   if(!token)return;setJwt(token);await reload(token);
  });
  return ()=>{canceled=true};
 },[]);
 async function action(orderId:string,decision:"verified"|"rejected"|"refunded"){
  if(!jwt||busy||!ack.includes(orderId))return;
  setBusy(true);
  try{
   const r=await fetch("/api/admin/studio-payments",{method:"PATCH",
    headers:{Authorization:"Bearer "+jwt,"Content-Type":"application/json"},
    body:JSON.stringify({orderId,action:decision,bankReconciled:true,
     confirmation:"I independently confirmed this transaction in the bank statement"})});
   const data=await r.json();
   setMessage(r.ok?"Admin decision saved in the protected payment audit log.":data.error??"Decision not saved.");
   if(r.ok)await reload(jwt);
  }catch{setMessage("Network failure; no bank decision confirmed.")}
  finally{setBusy(false)}
 }
 return <section className="nb-studio-review">
  <h2>Studio paid access — bank reconciliation queue</h2>
  <p role="status">{message}</p>
  <p><strong>Never approve from UTR text alone.</strong> Check bank credit, amount, receiver and that the same UTR was not used for another payment.</p>
  {orders.map(o=>{
   const proof=claims.find(c=>c.order_id===o.id),checked=ack.includes(o.id);
   return <article key={o.id}>
    <strong>{o.product_code.replace("_"," ")} · ₹{(o.amount_paise/100).toFixed(2)} · {o.status}</strong>
    <p>Order <code>{o.id}</code></p><small>Account ID: <code>{o.user_id}</code> · {new Date(o.created_at).toLocaleString("en-IN")}</small>
    <p>{proof?<>Self-reported UTR <code>{proof.utr}</code> · Customer claimed date: {new Date(proof.reported_paid_at).toLocaleString("en-IN")}</>:"No payment reference submitted"}</p>
    {o.status==="requested"&&proof&&<><label><input type="checkbox" checked={checked} onChange={e=>setAck(x=>e.target.checked?[...x,o.id]:x.filter(a=>a!==o.id))}/> I independently reconciled this payment against the bank statement.</label>
     <button type="button" disabled={!checked||busy} onClick={()=>void action(o.id,"verified")}>Approve verified credit and unlock</button>
     <button type="button" disabled={!checked||busy} onClick={()=>void action(o.id,"rejected")}>Reject mismatched claim</button>
    </>}
    {o.status==="verified"&&<><label><input type="checkbox" checked={checked} onChange={e=>setAck(x=>e.target.checked?[...x,o.id]:x.filter(a=>a!==o.id))}/> Confirm refund was processed in bank ledger.</label><button type="button" disabled={!checked||busy} onClick={()=>void action(o.id,"refunded")}>Record refund and revoke entitlement</button></>}
   </article>;
  })}
  {!orders.length&&<p>No orders found for review.</p>}
 </section>;
}
