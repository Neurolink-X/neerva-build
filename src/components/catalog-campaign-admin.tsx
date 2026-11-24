"use client";
import {useEffect,useState,type FormEvent} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Rule={id:string;amount_paise:number;unit:string;city:string;status:string;visibility:string;valid_from:string;valid_to:string|null};
type Campaign={id:string;pricing_rule_id:string;title:string;terms:string;offer_amount_paise:number;base_amount_paise:number;starts_at:string;ends_at:string;status:string};
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"});
export function CatalogCampaignAdmin(){
 const [token,setToken]=useState(""),[rules,setRules]=useState<Rule[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [ruleId,setRuleId]=useState(""),[title,setTitle]=useState(""),[terms,setTerms]=useState("");
 const [offer,setOffer]=useState(""),[starts,setStarts]=useState(""),[ends,setEnds]=useState("");
 const [status,setStatus]=useState("Sign in as an admin to review promotions."),[busy,setBusy]=useState(false);
 async function load(bearer:string){
  const headers={Authorization:"Bearer "+bearer};
  const [a,b]=await Promise.all([
   fetch("/api/admin/pricing",{headers,cache:"no-store"}),
   fetch("/api/admin/catalog/campaigns",{headers,cache:"no-store"})
  ]);
  if(!a.ok||!b.ok){setStatus("Admin pricing or campaign access unavailable.");return;}
  const p=await a.json(),c=await b.json();
  const available=(Array.isArray(p.prices)?p.prices:[] as Rule[]).filter((r:Rule)=>
   r.status==="published"&&r.visibility==="public"&&r.amount_paise>0);
  setRules(available);setRuleId(v=>v||available[0]?.id||"");
  setCampaigns(Array.isArray(c.campaigns)?c.campaigns:[]);
  setStatus(available.length?"Only verified price rules can receive campaigns.":"No published public prices yet. Publish a real catalog price before offering a discount.");
 }
 useEffect(()=>{
  const client=createNeervaBrowserClient();if(!client)return;
  let canceled=false;
  void client.auth.getSession().then(async result=>{
   if(canceled)return;
   const bearer=result.data.session?.access_token;
   if(!bearer)return;
   setToken(bearer);await load(bearer);
  }).catch(()=>{if(!canceled)setStatus("Could not verify admin session.");});
  return ()=>{canceled=true};
 },[]);
 async function request(method:"POST"|"PATCH",payload:Record<string,unknown>){
  if(!token||busy)return;
  setBusy(true);
  try{
   const response=await fetch("/api/admin/catalog/campaigns",{method,
    headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify(payload)});
   const body=await response.json();
   setStatus(response.ok?"Saved successfully. Review the published terms before advertising.":
    String(body.error??"Offer could not be saved."));
   if(response.ok)await load(token);
  }catch{setStatus("Network issue. Offer was not confirmed saved.");}
  finally{setBusy(false)}
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const rupees=Number(offer),paise=Math.round(rupees*100);
  if(!Number.isFinite(rupees)||!Number.isSafeInteger(paise)||paise<=0||
    !starts||!ends){setStatus("Enter a valid offer price and a real validity period.");return;}
  void request("POST",{pricingRuleId:ruleId,title,terms,offerPaise:paise,
   startsAt:new Date(starts).toISOString(),endsAt:new Date(ends).toISOString()});
 }
 return <section className="nb-campaign-admin" aria-label="Admin managed time-limited catalog offers">
  <h2>Verified limited-time catalog offers</h2>
  <p>Publish only a genuine, lower price backed by a current public pricing rule. No fake stock scarcity, fabricated crossed-out prices, or countdown reset. A draft does not appear publicly.</p>
  <p role="status">{status}</p>
  {token&&rules.length>0&&<form onSubmit={submit}>
   <label>Published price rule<select value={ruleId} onChange={e=>setRuleId(e.target.value)} required>{rules.map(r=>
    <option key={r.id} value={r.id}>{r.city} · {money.format(r.amount_paise/100)} / {r.unit} · {r.id.slice(0,8)}</option>)}</select></label>
   <label>Customer-facing title<input required minLength={8} maxLength={90} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Verified Diwali cement offer"/></label>
   <label>Offer rate (₹ per published unit)<input type="number" required min="0.01" step="0.01" value={offer} onChange={e=>setOffer(e.target.value)}/></label>
   <label>Starts (local time)<input required type="datetime-local" value={starts} onChange={e=>setStarts(e.target.value)}/></label>
   <label>Ends (local time)<input required type="datetime-local" value={ends} onChange={e=>setEnds(e.target.value)}/></label>
   <label>Exact terms<textarea required minLength={12} maxLength={400} rows={3} value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Quantity, city, exclusions, applicable taxes and delivery confirmation"/></label>
   <button disabled={busy} type="submit">Save as draft for review</button>
  </form>}
  {token&&campaigns.length>0&&<div className="nb-campaign-list"><h3>Drafts and published offers</h3>{campaigns.map(p=>
   <article key={p.id}><strong>{p.title}</strong><p>{money.format(p.offer_amount_paise/100)} / unit · {p.status} · Ends {new Date(p.ends_at).toLocaleString("en-IN")}</p>
    <small>{p.terms}</small>
    {p.status==="draft"&&<button disabled={busy} type="button" onClick={()=>void request("PATCH",{id:p.id,status:"published"})}>Publish verified offer</button>}
    {p.status==="published"&&<button disabled={busy} type="button" onClick={()=>void request("PATCH",{id:p.id,status:"expired"})}>End offer</button>}
   </article>)}</div>}
 </section>;
}
