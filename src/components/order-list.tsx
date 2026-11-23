"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {OrderInvoice,type VerifiedInvoice} from "./order-invoice";
type Order=VerifiedInvoice &{id:string;created_at:string;city:string;pincode:string;status:string};
const client=createNeervaBrowserClient();
export function OrderList(){
 const [orders,setOrders]=useState<Order[]>([]),[status,setStatus]=useState(""),[loading,setLoading]=useState(true);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);setStatus("");
  try{
   if(!client){setStatus("Separate Neerva account service is not yet configured.");return;}
   const session=await client.auth.getSession(),token=session.data.session?.access_token;
   if(!token){setStatus("Sign in to view your private orders.");return;}
   const response=await fetch("/api/orders",{headers:{Authorization:"Bearer "+token},cache:"no-store",signal});
   const body=await response.json().catch(()=>({error:"Invalid order service response"})) as {orders?:Order[];error?:string};
   if(!response.ok){setStatus(body.error||"Order service is unavailable.");return;}
   setOrders(Array.isArray(body.orders)?body.orders:[]);
  }catch{if(!signal?.aborted)setStatus("Could not load orders. Retry when connectivity is restored.");}
  finally{if(!signal?.aborted)setLoading(false)}
 },[]);
 useEffect(()=>{const c=new AbortController();const task=window.setTimeout(()=>void load(c.signal),0);return()=>{window.clearTimeout(task);c.abort()}},[load]);
 return <section aria-label="Private orders" style={{maxWidth:1100}}>
  <p>No order, delivery estimate or payment is fabricated when Neerva order processing is offline.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"15px 0"}}><button type="button" className="button button-outline" onClick={()=>void load()} disabled={loading}>Refresh orders</button><Link href="/basket" className="button button-outline">My material list</Link></div>
  {loading?<p role="status">Loading your orders…</p>:status?<p role="alert" style={{background:"#fff0e3",padding:12,borderRadius:8}}>{status}</p>:orders.length===0?<p>No orders found for your account. <Link href="/materials">Explore materials →</Link></p>:orders.map(order=><article key={order.id} style={{border:"1px solid #dbe3db",padding:16,borderRadius:14,marginBottom:14}}>
   <h2 style={{fontSize:19}}>Order {order.code}</h2><p>{order.city} · {order.pincode} · {order.status}</p>
   <p>Placed: {new Date(order.created_at).toLocaleString("en-IN")}</p>
   {Array.isArray(order.line_items)&&<OrderInvoice order={order}/>}
  </article>)}
 </section>;
}
