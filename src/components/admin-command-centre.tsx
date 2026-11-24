"use client";
import Link from "next/link";
import {useEffect,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import styles from "./admin-command-centre.module.css";

const groups=[
 {title:"Marketplace",items:[["Orders","Manage accepted orders and delivery exceptions","/admin/orders"],["RFQ desk","Review quotations and route eligible dealers","/admin/rfqs"],["Sourcing","Handle uncovered customer requests","/admin/fulfilment"]]},
 {title:"Commerce & growth",items:[["Catalog","Products, variants and publication","/admin/catalog"],["Pricing","Review and publish real prices","/admin/pricing"],["Marketing","Create and manage verified offers","/admin/marketing"]]},
 {title:"Design Studio",items:[["Studio settings","Paid access, preview limits and checkout","/admin/studio-settings"],["Payments","Bank reconciliation and support","/admin/studio-payments"],["Studio library","Manage design records and rules","/admin/studio"]]},
 {title:"Platform",items:[["Users & roles","Review account profiles and grants","/admin/users"],["System health","Review recorded errors and incidents","/admin/system-health"]]}
];
type Campaign={id:string;title:string;terms:string;status:string;base_amount_paise:number;offer_amount_paise:number;starts_at:string;ends_at:string};
type Price={id:string;variant_id:string;city:string;unit:string;amount_paise:number;visibility:string;status:string;valid_from:string;valid_to:string|null};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(paise/100);
const client=createNeervaBrowserClient();
async function request(path:string,method="GET",body?:unknown,signal?:AbortSignal){
 const session=await client?.auth.getSession();
 const token=session?.data.session?.access_token;
 if(!token)throw new Error("Sign in with an approved administrator account.");
 const res=await fetch(path,{method,signal,cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json();
 if(!res.ok)throw new Error(typeof data.error==="string"?data.error:"Request failed. Try again.");
 return data;
}
export function AdminCommandCentre({marketing=false}:{marketing?:boolean}){
 const [access,setAccess]=useState<"loading"|"ready"|"denied">("loading");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [prices,setPrices]=useState<Price[]>([]);
 const [busy,setBusy]=useState(false);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try{
    const result=await request("/api/admin/catalog/campaigns","GET",undefined,controller.signal);
    if(controller.signal.aborted)return;
    setCampaigns(result.campaigns??[]);
    if(marketing){
     const pricing=await request("/api/admin/pricing","GET",undefined,controller.signal);
     if(controller.signal.aborted)return;
     setPrices((pricing.prices??[]).filter((p:Price)=>p.status==="published"&&p.visibility==="public"&&p.amount_paise>0&&(!p.valid_to||Date.parse(p.valid_to)>Date.now())));
    }
    setAccess("ready");setError("");
   }catch(e){if(!controller.signal.aborted){setAccess("denied");setError(e instanceof Error?e.message:"Access check failed.");}}
  }
  void load();
  return()=>controller.abort();
 },[marketing,revision]);
 async function mutate(method:string,body:unknown){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{await request("/api/admin/catalog/campaigns",method,body);setNotice(method==="POST"?"Draft saved. Review before publishing.":"Campaign status updated.");setRevision(v=>v+1);}
  catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
  finally{setBusy(false);}
 }
 function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const f=new FormData(e.currentTarget);
  const amount=Number(f.get("amount"));const start=new Date(String(f.get("start")));const end=new Date(String(f.get("end")));
  if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start){setError("Enter a positive amount and valid start and end dates.");return;}
  void mutate("POST",{pricingRuleId:f.get("price"),title:f.get("title"),terms:f.get("terms"),offerPaise:Math.round(amount*100),startsAt:start.toISOString(),endsAt:end.toISOString()});
 }
 return <main className={styles.shell}>
  <header className={styles.header}><Link href="/" className={styles.brand}>N / NEERVA BUILD</Link><span>Administration</span><Link href="/account">Account</Link></header>
  {access!=="ready"?<section className={styles.panel}><h1>{access==="loading"?"Checking access…":"Administrator access required"}</h1><p role="status">{error||"Checking your account against the protected server API."}</p><Link href="/account">Open account sign-in</Link> <button type="button" onClick={()=>{setRevision(v=>v+1)}}>Retry access check</button></section>:
  <div className={styles.workspace}>
   <nav className={styles.sidebar} aria-label="Administration"><Link href="/admin" aria-current={!marketing?"page":undefined}>Overview</Link>{groups.map(group=><div key={group.title}><strong>{group.title}</strong>{group.items.map(([label,,href])=><Link key={href} href={href} aria-current={marketing&&href==="/admin/marketing"?"page":undefined}>{label}</Link>)}</div>)}</nav>
   <section className={styles.content}>
    <p className={styles.kicker}>NEERVA OPERATIONS / {marketing?"GROWTH":"OVERVIEW"}</p>
    <h1>{marketing?"Marketing & offers":"Business command centre"}</h1>
    <p>{marketing?"Create offers against real published prices. Review and publish only valid campaigns.":"Manage marketplace operations, growth, Studio services and platform access in one workspace."}</p>
    {marketing?<><section className={styles.panel}><h2>Create an offer</h2>{prices.length===0?<p>No eligible published public prices yet. <Link href="/admin/pricing">Publish a genuine price first.</Link></p>:<form onSubmit={create} className={styles.form}>
     <label>Published price<select name="price" required defaultValue=""><option value="" disabled>Select a price</option>{prices.map(p=><option key={p.id} value={p.id}>{p.city} · {money(p.amount_paise)}/{p.unit} · SKU {p.variant_id.slice(0,8)} · rule {p.id.slice(0,8)}</option>)}</select></label>
     <label>Campaign title<input name="title" required minLength={8} maxLength={90}/></label><label>Offer amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required/></label>
     <label>Starts (local time)<input name="start" type="datetime-local" required/></label><label>Ends (local time)<input name="end" type="datetime-local" required/></label>
     <label>Offer terms<textarea name="terms" required minLength={12} maxLength={400}/></label><button disabled={busy}>Save campaign draft</button></form>}</section>
     {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
     <section className={styles.panel}><h2>Campaigns</h2>{campaigns.length===0?<p>No campaigns have been created.</p>:<div className={styles.cards}>{campaigns.map(c=><article key={c.id} className={styles.card}><small>{c.status}</small><h3>{c.title}</h3><p>{money(c.offer_amount_paise)} · base {money(c.base_amount_paise)}</p><p>{new Date(c.starts_at).toLocaleString()} – {new Date(c.ends_at).toLocaleString()}</p><p>{c.terms}</p>{(c.status==="draft"||c.status==="published")&&<button disabled={busy} onClick={()=>void mutate("PATCH",{id:c.id,status:c.status==="draft"?"published":"expired"})}>{c.status==="draft"?"Publish reviewed offer":"Expire offer"}</button>}</article>)}</div>}</section></>:<><section className={styles.panel}><h2>Marketing snapshot</h2><p>{campaigns.length} recent campaigns returned by the protected API · {campaigns.filter(c=>c.status==="published"&&Date.parse(c.starts_at)<=Date.now()&&Date.parse(c.ends_at)>Date.now()).length} currently within published offer windows.</p><Link href="/admin/marketing">Manage marketing →</Link></section>{groups.map(g=><section key={g.title}><h2>{g.title}</h2><div className={styles.cards}>{g.items.map(([label,desc,href])=><Link className={styles.card} key={href} href={href}><h3>{label} ↗</h3><p>{desc}</p></Link>)}</div></section>)}</>}
   </section>
  </div>}
 </main>;
}
