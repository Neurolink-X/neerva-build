"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Studio={product_code:string;access_mode:string;checkout_enabled:boolean;is_published:boolean;price_paise:number};
type Snapshot={counts:Record<string,number|null>;studio:Studio[]|null;paymentInfrastructureEnabled:boolean;updatedAt:string};
const modules=[
 {title:"Orders",key:"orders",href:"/admin/orders",desc:"Direct orders, dealer orders, sourcing and delivery exceptions"},
 {title:"Quotations",key:"requests",href:"/admin/rfqs",desc:"Customer requirements and dealer offers"},
 {title:"Materials",key:"products",href:"/admin/catalog",desc:"Create, edit, publish or archive catalog records"},
 {title:"SKUs",key:"variants",href:"/admin/catalog",desc:"Variants and category-specific units"},
 {title:"Dealer businesses",key:"dealers",href:"/admin/dealers",desc:"Dealer directory and branch coverage"},
 {title:"Account profiles",key:"customers",href:"/admin/users",desc:"Review customer profiles and role grants"}
];
const quick=[["Supplier sourcing","/admin/fulfilment","Unassigned material requests"],["Pricing","/admin/pricing","Manage reviewed price rules"],["Marketing","/admin/marketing","Create verified offers"],["Studio library","/admin/studio","Design configuration"],["Payments","/admin/studio-payments","Reconciliation and payment support"],["System health","/admin/system-health","Review platform incidents"],["Activity audit","/admin/audit","Inspect administrative decisions"]];
export function AdminOverview(){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState(""),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try{
    const session=await createNeervaBrowserClient()?.auth.getSession();
    const token=session?.data.session?.access_token;if(!token)throw Error("Sign in again to refresh operations.");
    const response=await fetch("/api/admin/overview",{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:controller.signal});
    const result=await response.json();
    if(!response.ok)throw Error(typeof result.error==="string"?result.error:"Overview unavailable.");
    if(!controller.signal.aborted)setSnapshot(result as Snapshot);
   }catch(e){if(!controller.signal.aborted){setSnapshot(null);setError(e instanceof Error?e.message:"Overview unavailable.")}}
   finally{if(!controller.signal.aborted)setLoading(false)}
  }
  void load();return()=>controller.abort();
 },[revision]);
 return <main className="admin-overview">
  <div className="admin-inline admin-overview-head"><div><p className="admin-overview-kicker">NEERVA / BUSINESS OPERATIONS</p><h1>Control centre</h1><p>Manage your marketplace from one workspace.</p></div><button type="button" disabled={loading} onClick={()=>{setLoading(true);setError("");setRevision(v=>v+1)}}>{loading?"Refreshing…":"Refresh data"}</button></div>
  {error&&<p role="alert" className="admin-error">{error} Navigation remains available.</p>}
  <p role="status">{loading?"Loading protected metrics…":snapshot?"Updated "+new Date(snapshot.updatedAt).toLocaleString("en-IN")+". Counts reflect records visible under database permissions.":"Metrics unavailable."}</p>
  <div className="admin-overview-grid">{modules.map(m=><Link href={m.href} key={m.key} className="admin-box admin-overview-tile"><small>{m.title}</small><strong>{loading?"…":snapshot?.counts[m.key]==null?"Unavailable":snapshot.counts[m.key]?.toLocaleString("en-IN")}</strong><p>{m.desc}</p><span>Open module →</span></Link>)}</div>
  <section className="admin-box"><div className="admin-inline admin-overview-head"><div><h2>Free & paid Studio access</h2><p>Manage Home Studio and Colour Studio independently.</p></div><Link className="admin-overview-action" href="/admin/studio-settings">Manage access & pricing →</Link></div>
  {snapshot&&<p>Payment infrastructure: <strong>{snapshot.paymentInfrastructureEnabled?"Enabled":"Paused"}</strong></p>}
  {!snapshot?.studio?.length?<p>Studio configuration is not available in this snapshot. Open settings to investigate.</p>:<div className="admin-overview-grid">{snapshot.studio.map(s=><div className="admin-record" key={s.product_code}><strong>{s.product_code.replaceAll("_"," ")}</strong><p>{s.access_mode==="free"?"Free":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(s.price_paise/100)} · {s.is_published?"Published":"Hidden"}</p><small>Checkout: {snapshot.paymentInfrastructureEnabled&&s.checkout_enabled&&s.is_published&&s.access_mode==="paid"?"Enabled":"Paused"}</small></div>)}</div>}
  </section>
  <section className="admin-box"><h2>More controls</h2><div className="admin-overview-grid">{quick.map(([title,href,desc])=><Link className="admin-record admin-overview-tile" href={href} key={href}><h3>{title} →</h3><p>{desc}</p></Link>)}</div></section>
 </main>
}
