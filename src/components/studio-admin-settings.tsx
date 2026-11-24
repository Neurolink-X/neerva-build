"use client";
import {useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import type {StudioSetting} from "@/modules/studio/studio-config";
import {studioProducts,type StudioProduct} from "@/modules/studio/paid-products";
type Audit={id:number;product_code:string;actor_id:string;changed_at:string;previous:Record<string,unknown>;current:Record<string,unknown>};
const formatter=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export function StudioAdminSettings(){
 const [jwt,setJwt]=useState(""),[settings,setSettings]=useState<StudioSetting[]>([]);
 const [drafts,setDrafts]=useState<Partial<Record<StudioProduct,StudioSetting>>>({});
 const [audit,setAudit]=useState<Audit[]>([]),[infrastructure,setInfrastructure]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("Only administrators can publish Studio pricing.");
 async function load(token:string){
  const res=await fetch("/api/admin/studio-settings",{cache:"no-store",headers:{Authorization:"Bearer "+token}});
  if(!res.ok){setMessage("Settings could not be read; no changes were made.");return;}
  const result=await res.json();
  const rows=Array.isArray(result.products)?result.products as StudioSetting[]:[];
  setSettings(rows);setDrafts(Object.fromEntries(rows.map(p=>[p.product,{...p}])));
  setAudit(Array.isArray(result.audit)?result.audit:[]);
  setInfrastructure(result.paymentInfrastructureEnabled===true);
  setMessage("Changes publish to the server instantly. Existing orders keep their saved price.");
 }
 useEffect(()=>{
  let disposed=false,client=createNeervaBrowserClient();if(!client)return;
  void client.auth.getSession().then(async result=>{
   if(disposed||!result.data.session?.access_token)return;
   const bearer=result.data.session.access_token;setJwt(bearer);await load(bearer);
  }).catch(()=>{if(!disposed)setMessage("Admin authentication unavailable.")});
  return ()=>{disposed=true};
 },[]);
 function edit(product:StudioProduct,update:Partial<StudioSetting>){
  setDrafts(current=>{
   const base=current[product];if(!base)return current;
   return {...current,[product]:{...base,...update}};
  });
 }
 async function save(product:StudioProduct){
  const current=drafts[product],original=settings.find(s=>s.product===product);
  if(!jwt||!current||!original||busy)return;
  setBusy(true);
  try{
   const response=await fetch("/api/admin/studio-settings",{method:"PATCH",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+jwt},
    body:JSON.stringify({product,mode:current.mode,pricePaise:current.pricePaise,
     freePreviewCount:current.freePreviewCount,checkoutEnabled:current.mode==="paid"&&current.checkoutEnabled,
     published:current.published,expectedVersion:original.version})});
   const payload=await response.json();
   if(response.ok){await load(jwt);setMessage(String(payload.notice??"Studio settings published."));window.dispatchEvent(new Event("studio-config-changed"));}
   else setMessage(String(payload.error??"Settings not saved."));
  }catch{setMessage("Network error. Settings publication not confirmed.")}
  finally{setBusy(false)}
 }
 return <section className="nb-studio-admin-settings" aria-label="Admin paid and free Studio control">
   <h2>Studio monetisation & access control</h2>
   <p>Set Home Studio and Colour Studio independently. A customer pays only for the advertised server-issued order price. A free mode gives signed-in users full report access without payment.</p>
   <p role="status">{message}</p>
   {!infrastructure&&<p className="studio-upgrade-warning"><strong>Payment infrastructure OFF:</strong> Admin pricing can be prepared and saved, but no new payment requests are allowed until the separate operator/legal and UPI verification gates are enabled.</p>}
   <div className="nb-studio-admin-grid">{(["home_studio","colour_studio"] as const).map(product=>{
    const item=drafts[product],saved=settings.find(x=>x.product===product);
    if(!item)return null;
    const changed=!!saved&&(["mode","pricePaise","freePreviewCount","checkoutEnabled","published"] as const)
     .some(field=>saved[field]!==item[field]);
    return <form key={product} onSubmit={event=>{event.preventDefault();void save(product)}}>
      <h3>{studioProducts[product].label}</h3>
      <label>Access mode<select value={item.mode} onChange={e=>edit(product,{mode:e.target.value as "free"|"paid",checkoutEnabled:false})}>
       <option value="free">Free — full report at no cost</option><option value="paid">Paid — purchase needed for report</option>
      </select></label>
      <label>One-time price (₹, applied to NEW orders)<input type="number" min="10" max="20000" step="0.01" required
       value={(item.pricePaise/100).toFixed(2)} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v))edit(product,{pricePaise:Math.round(v*100)})}}/></label>
      <label>Free gallery sample designs (1–24)<input type="number" min="1" max="24" value={item.freePreviewCount}
       onChange={e=>edit(product,{freePreviewCount:Number(e.target.value)})}/></label>
      <label className="nb-studio-toggle"><input type="checkbox" checked={item.published}
       onChange={e=>edit(product,{published:e.target.checked,checkoutEnabled:e.target.checked?item.checkoutEnabled:false})}/> Published to customers</label>
      <label className="nb-studio-toggle"><input type="checkbox" disabled={item.mode==="free"||!item.published}
       checked={item.mode==="paid"&&item.checkoutEnabled} onChange={e=>edit(product,{checkoutEnabled:e.target.checked})}/> Allow new paid checkout (still requires verified infrastructure)</label>
      <div className="nb-studio-admin-summary">Now: <strong>{item.mode==="free"?"Free":formatter.format(item.pricePaise/100)}</strong> · {item.published?"Visible":"Hidden"} · Version {saved?.version??"—"}</div>
      <button type="submit" disabled={busy||!changed}>Publish these settings</button>
     </form>;
   })}</div>
   <h3>Recent pricing and access audit</h3>
   {audit.length?<div className="nb-studio-audit">{audit.map(a=><article key={a.id}>
    <strong>{a.product_code.replaceAll("_"," ")} · {new Date(a.changed_at).toLocaleString("en-IN")}</strong>
    <p>{String(a.previous.access_mode)} → {String(a.current.access_mode)} · {formatter.format(Number(a.previous.price_paise)/100)} → {formatter.format(Number(a.current.price_paise)/100)}</p>
    <small>Changed by administrator {a.actor_id}</small>
   </article>)}</div>:<p>No previous published settings changes.</p>}
 </section>;
}
