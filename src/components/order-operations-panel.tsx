"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Role="admin"|"dealer";
type Order={
 id:string;code:string;tenant_id:string;business_name:string;customer_id:string;contact_name:string;
 phone:string;delivery_address:string;city:string;pincode:string;status:string;
 created_at:string;updated_at:string;total_paise:number;currency:string;
 line_items:{productName:string;quantity:number;unit:string;lineTotalPaise:number}[]
};
type Result={orders?:Order[];error?:string};
const paths:Record<Role,string>={admin:"/api/admin/orders",dealer:"/api/dealer/orders"};
const transitions:Record<Role,Record<string,{status:string;label:string}[]>>={
 dealer:{
  pending_confirmation:[{status:"confirmed",label:"Confirm actual stock & delivery"},{status:"declined",label:"Decline (unable to fulfil)"}],
  confirmed:[{status:"preparing",label:"Start preparing materials"}],
  preparing:[{status:"out_for_delivery",label:"Mark dispatched to customer"}]
 },
 admin:{
  pending_confirmation:[{status:"confirmed",label:"Confirm verified supplier"},{status:"cancelled",label:"Cancel pending request"},{status:"declined",label:"Supplier unavailable"}],
  confirmed:[{status:"preparing",label:"Start preparation"},{status:"cancelled",label:"Cancel confirmed request"}],
  preparing:[{status:"out_for_delivery",label:"Record verified dispatch"},{status:"cancelled",label:"Cancel preparation"}],
  out_for_delivery:[{status:"cancelled",label:"Record delivery failure / cancellation"}]
 }
};
const currency=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"});
const supabase=createNeervaBrowserClient();
export function OrderOperationsPanel({role}:{role:Role}){
 const [orders,setOrders]=useState<Order[]>([]),[message,setMessage]=useState("Loading verified orders…");
 const [busy,setBusy]=useState<string|null>(null);
 const reload=useCallback(async()=>{
  if(!supabase){setMessage("Neerva account authentication is not configured.");return;}
  try{
   const {data}=await supabase.auth.getSession();
   const jwt=data.session?.access_token;
   if(!jwt){setMessage("Sign in with your approved "+role+" account.");return;}
   const result=await fetch(paths[role],{headers:{Authorization:"Bearer "+jwt},cache:"no-store"});
   const payload=await result.json().catch(()=>({error:"Order records unavailable."})) as Result;
   if(!result.ok){setMessage(payload.error??"Orders could not be loaded.");return;}
   setOrders(payload.orders??[]);
   setMessage("");
  }catch{setMessage("Connection issue. Refresh before taking any order action.");}
 },[role]);
 useEffect(()=>{const t=setTimeout(()=>void reload(),0);return()=>clearTimeout(t);},[reload]);
 async function update(order:Order,nextStatus:string){
  if(busy)return;
  if(!window.confirm("Only confirm real verified stock, delivery readiness or supplier failure. Continue with "+nextStatus.replaceAll("_"," ")+"?"))return;
  setBusy(order.id);setMessage("");
  try{
   const session=await supabase?.auth.getSession();
   const jwt=session?.data.session?.access_token;
   if(!jwt){setMessage("Session expired. Sign in again.");return;}
   const result=await fetch(paths[role],{method:"PATCH",cache:"no-store",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+jwt},
    body:JSON.stringify({orderId:order.id,expectedStatus:order.status,status:nextStatus})});
   const payload=await result.json().catch(()=>({error:"Order update response not received."})) as {error?:string};
   if(!result.ok){setMessage(payload.error??"Order status update was not saved.");return;}
   await reload();
  }catch{setMessage("Network issue. Refresh before retrying this status update.");}
  finally{setBusy(null);}
 }
 return <section aria-label={role==="admin"?"Admin accepted orders":"Dealer accepted orders"} style={{maxWidth:1120}}>
  <p>Only customer-accepted, database-backed dealer offers appear here. Status changes are transactional and audited. No tax invoice or payment is fabricated.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",margin:"14px 0"}}>
   <button className="button button-outline" type="button" disabled={!!busy} onClick={()=>void reload()}>Refresh order queue</button>
   <Link href={role==="admin"?"/admin/fulfilment":"/dealer/quotes"}>{role==="admin"?"Manual supplier sourcing":"Dealer quotation inbox"}</Link>
  </div>
  {message&&<p role="status" style={{padding:12,borderRadius:10,background:"#fff2e2"}}>{message}</p>}
  {!message&&!orders.length&&<p>No accepted order is present for this {role==="admin"?"platform":"dealer"} account.</p>}
  <div style={{display:"grid",gap:14}}>
   {orders.map(order=><article key={order.id} style={{border:"1px solid #d9e3d9",borderRadius:14,padding:18,background:"#fffefa"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
     <strong style={{fontSize:19}}>{order.code}</strong>
     <strong>{currency.format(order.total_paise/100)}</strong>
    </div>
    <p><strong>{order.status.replaceAll("_"," ")}</strong> · {order.business_name}</p>
    <p>{order.contact_name} · {order.phone} · {order.delivery_address}, {order.city} {order.pincode}</p>
    <ul>{(order.line_items??[]).map((line,index)=><li key={index}>{line.productName} — {line.quantity} {line.unit} — {currency.format(line.lineTotalPaise/100)}</li>)}</ul>
    <p style={{fontSize:12}}>Accepted {new Date(order.created_at).toLocaleString("en-IN")}</p>
    <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
     {(transitions[role][order.status]??[]).map(action=><button key={action.status}
      className="button button-outline" type="button" disabled={Boolean(busy)}
      onClick={()=>void update(order,action.status)}>{busy===order.id?"Updating…":action.label}</button>)}
    </div>
    {order.status==="out_for_delivery"&&<p style={{fontSize:13}}>Delivery completes only when the signed-in customer confirms receipt. Do not issue a GST invoice from this screen.</p>}
   </article>)}
  </div>
 </section>;
}
