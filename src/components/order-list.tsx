"use client";
import Link from "next/link";
import {customerOrderLabel,customerRequestError} from "@/modules/orders/customer-presentation";
import {useCallback,useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {OrderInvoice,type VerifiedInvoice} from "./order-invoice";
type Order=VerifiedInvoice&{
 id:string;quote_request_id:string;tenant_id:string;created_at:string;updated_at:string;
 city:string;pincode:string;status:string;delivery_address:string
};
const client=createNeervaBrowserClient();
const names:Record<string,string>={
 pending_confirmation:"Awaiting dealer stock & delivery confirmation",
 confirmed:"Dealer confirmed",preparing:"Preparing materials",
 out_for_delivery:"Out for delivery",delivered:"Received by customer",
 cancelled:"Cancelled",declined:"Seller unable to fulfil"
};
export function OrderList(){
 const [orders,setOrders]=useState<Order[]>([]),[message,setMessage]=useState("");
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState<string|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);setMessage("");
  try{
   if(!client){setMessage("Neerva account service is not configured.");return;}
   const session=await client.auth.getSession(),token=session.data.session?.access_token;
   if(!token){setMessage("Sign in to view your private orders.");return;}
   const response=await fetch("/api/orders",{headers:{Authorization:"Bearer "+token},cache:"no-store",signal});
   const data=await response.json().catch(()=>({error:"Could not read order service response."})) as {orders?:Order[];error?:string};
   if(!response.ok){setMessage("Orders are temporarily unavailable. Try refreshing.");return;}
   setOrders(Array.isArray(data.orders)?data.orders:[]);
  }catch{if(!signal?.aborted)setMessage("Network interruption. Refresh orders before taking another action.");}
  finally{if(!signal?.aborted)setLoading(false);}
 },[]);
 useEffect(()=>{const controller=new AbortController();const t=setTimeout(()=>void load(controller.signal),0);return()=>{clearTimeout(t);controller.abort();};},[load]);
 async function change(order:Order,status:"cancelled"|"delivered"){
  if(busy)return;
  const confirmMessage=status==="delivered"
   ?"Confirm that you have actually received the material delivery? This is your receipt acknowledgment."
   :"Cancel this still-unconfirmed order request? No online payment has been collected.";
  if(!window.confirm(confirmMessage))return;
  setBusy(order.id);setMessage("");
  try{
   const {data}=await client?.auth.getSession()??{data:{session:null}};
   if(!data.session?.access_token){setMessage("Session expired. Sign in again.");return;}
   const response=await fetch("/api/orders",{method:"PATCH",cache:"no-store",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+data.session.access_token},
    body:JSON.stringify({orderId:order.id,expectedStatus:order.status,status})
   });
   await response.json().catch(()=>null);
   if(!response.ok){setMessage(customerRequestError(response.status));return;}
   await load();
  }catch{setMessage("Network error. Refresh to check the latest order status.")}
  finally{setBusy(null);}
 }
 return <section aria-label="Private accepted customer orders" style={{maxWidth:1100}}>
  <p>These records represent real dealer offers you accepted. A pending order is not a guaranteed shipment, paid transaction or GST invoice.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"15px 0"}}>
   <button type="button" className="button button-outline" onClick={()=>void load()} disabled={loading||!!busy}>Refresh orders</button>
   <Link href="/account/quotes" className="button button-outline">My dealer quotations</Link>
   <Link href="/basket" className="button button-outline">My material list</Link>
  </div>
  {loading?<p role="status">Loading your orders…</p>:message?<p role="alert" style={{background:"#fff0e3",padding:12,borderRadius:8}}>{message}</p>
  :orders.length===0?<p>No accepted orders for your account. Start with a <Link href="/quotes">material quotation request</Link>.</p>
  :orders.map(order=><article key={order.id} style={{border:"1px solid #dbe3db",padding:16,borderRadius:14,marginBottom:14,background:"#fffefa"}}>
   <h2 style={{fontSize:19}}>Order {order.code}</h2>
   <p><strong>{names[order.status]??customerOrderLabel(order.status)}</strong> · {order.business_name}</p>
   <p>{order.city}, {order.pincode} · {order.delivery_address}</p>
   <p style={{fontSize:12}}>Request accepted {new Date(order.created_at).toLocaleString("en-IN")}</p>
   {Array.isArray(order.line_items)&&<OrderInvoice order={order}/>}
   <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>
    {order.status==="pending_confirmation"&&<button type="button" disabled={Boolean(busy)} className="button button-outline" onClick={()=>void change(order,"cancelled")}>{busy===order.id?"Saving…":"Cancel unconfirmed request"}</button>}
    {order.status==="out_for_delivery"&&<button type="button" disabled={Boolean(busy)} className="button button-dark" onClick={()=>void change(order,"delivered")}>{busy===order.id?"Saving…":"Confirm I received materials"}</button>}
    <Link href="/support">Need help?</Link>
   </div>
  </article>)}
 </section>;
}
