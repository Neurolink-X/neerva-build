"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {sourcingStatuses,type AdminSourcingRow,type SourcingScope,type SourcingStatus} from "@/modules/rfq/admin-sourcing";
const client=createNeervaBrowserClient();
const names:Record<SourcingStatus,string>={
 needs_dealer:"Needs dealer",checking_suppliers:"Checking suppliers",awaiting_customer:"Awaiting customer",
 supplier_unavailable:"Supplier unavailable",closed_unserviceable:"Not serviceable"
};
type Payload={cases?:AdminSourcingRow[];orderServiceStatus?:string;error?:string};
export function AdminSourcingDesk(){
 const [rows,setRows]=useState<AdminSourcingRow[]>([]);
 const [state,setState]=useState("Checking verified sourcing records…");
 const [orderStatus,setOrderStatus]=useState("not_configured");
 const [busy,setBusy]=useState(false);
 const token=useCallback(async()=>{
  const {data}=await client?.auth.getSession()??{data:{session:null}};
  return data.session?.access_token;
 },[]);
 const reload=useCallback(async()=>{
  if(!client){setState("Dedicated Neerva auth service not configured.");return}
  try{
   const jwt=await token();
   if(!jwt){setState("Sign in with a platform admin account.");return}
   const r=await fetch("/api/admin/fulfilment",{headers:{Authorization:"Bearer "+jwt},cache:"no-store"});
   const data=await r.json() as Payload;
   if(!r.ok){setState(data.error??"Sourcing queue not available.");return}
   setRows(data.cases??[]);
   setOrderStatus(data.orderServiceStatus??"not_configured");setState("");
  }catch{setState("Could not reach the admin sourcing queue. Retry.")}
 },[token]);
 useEffect(()=>{const t=setTimeout(()=>void reload(),0);return()=>clearTimeout(t)},[reload]);
 async function change(row:AdminSourcingRow,status:SourcingStatus,scope:SourcingScope){
  if(!row.caseId)return;
  setBusy(true);setState("");
  try{
   const jwt=await token();if(!jwt){setState("Admin session expired. Sign in again.");return}
   const r=await fetch("/api/admin/fulfilment",{method:"PATCH",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+jwt},
    body:JSON.stringify({caseId:row.caseId,status,scope,note:""})});
   if(!r.ok){const body=await r.json().catch(()=>({error:"Not saved"})) as {error?:string};throw Error(body.error??"Not saved")}
   await reload();
  }catch(e){setState(e instanceof Error?e.message:"Unable to update case");}finally{setBusy(false)}
 }
 return <section className="neerva-procurement-desk" aria-label="Admin verified nationwide sourcing">
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
   <div><h2 style={{fontSize:24}}>Admin sourcing & unassigned requests</h2>
    <p>Nationwide manual sourcing can be considered. No dealer, price, delivery date or successful order is guaranteed.</p></div>
   <button type="button" className="button button-outline" disabled={busy} onClick={()=>void reload()}>Refresh</button>
  </div>
  <p role="status">Order backend: {orderStatus==="typescript_postgres_ready"?"Neerva TypeScript + PostgreSQL connected; accepted orders live in the secured order queue":"database migration not ready — accepting orders is disabled"}. This desk only shows saved RFQs. <Link href="/admin/orders">Manage accepted orders</Link>.</p>
  {state&&<p role="status" style={{padding:12,background:"#fdf0df",borderRadius:10}}>{state}</p>}
  <p><strong>{rows.length} actual request(s)</strong> · <strong>{rows.filter(r=>r.invitationCount===0).length}</strong> without a recorded dealer invitation in the displayed data.</p>
  {!rows.length&&!state&&<p>No real quotation requests yet. Customer intake stays disabled until verified support/dealers are ready.</p>}
  <div style={{display:"grid",gap:12}}>
  {rows.map(row=><article key={row.id} style={{border:"1px solid #d8e2d8",padding:16,borderRadius:12,background:"#fffefa"}}>
   <strong>{row.material_description}</strong>
   <p>{row.quantity} {row.unit} · {row.city}, {row.pincode} · {row.status}</p>
   <p style={{fontSize:13}}>Dealer invitations: {row.invitationCount??"unavailable"} · Case: {row.sourcingStatus==="unknown"?"Migration not applied":names[row.sourcingStatus]}</p>
   {row.caseId&&<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
    <label>Action<select value={row.sourcingStatus} disabled={busy} onChange={e=>void change(row,e.target.value as SourcingStatus,row.scope==="unknown"?"local":row.scope as SourcingScope)}
      style={{minHeight:44,padding:10,maxWidth:"100%"}}>
     {sourcingStatuses.map(status=><option value={status} key={status}>{names[status]}</option>)}</select></label>
    <label>Sourcing scope<select value={row.scope} disabled={busy} onChange={e=>void change(row,row.sourcingStatus==="unknown"?"needs_dealer":row.sourcingStatus,e.target.value as SourcingScope)}
      style={{minHeight:44,padding:10}}>
     <option value="local">Local supplier</option><option value="national">Review suppliers across India</option></select></label>
   </div>}
  </article>)}
  </div>
  <p style={{fontSize:13}}>Admin may investigate suppliers and contact customers through approved channels. Never accept online payment or claim dispatched stock from an unverified sourcing case. Customer acceptance is stored separately and a verified dealer or admin must explicitly confirm fulfillment. <Link href="/admin/rfqs">View RFQ records</Link>.</p>
 </section>;
}
