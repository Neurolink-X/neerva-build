"use client";
import {useEffect,useState} from "react";
import {estimateCart} from "@/modules/orders/cart-estimate";
import {cartKey,type CartItem} from "@/modules/orders/direct-cart";
import {operationsRequest} from "./operations-request";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(n/100);
type Seller={seller:string;sku:string;unit:string;material_paise:number;fee_paise:number;discount_paise:number;freight_paise:number|null;unloading_paise:number|null;tax_paise:number|null;estimated_total_paise:number|null;valid_to:string|null};
export function CartPricePreview({rows,unload,pin,city,onLocation}:{rows:CartItem[];unload:boolean;pin:string;city:string;onLocation:(pin:string,city:string)=>void}){
 const [feed,setFeed]=useState<{rates:unknown[];offers:unknown[];at:number}|null>(null),[failed,setFailed]=useState(false),[clock,setClock]=useState(0),[refresh,setRefresh]=useState(0),[dealer,setDealer]=useState<{fingerprint:string;row:Seller|null;message:string}|null>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true;const abort=new AbortController();async function load(){try{const [p,o]=await Promise.all(["/api/catalog/prices","/api/catalog/offers"].map(u=>fetch(u,{signal:abort.signal,cache:"no-store"})));if(!p.ok||!o.ok)throw Error();const [a,b]=await Promise.all([p.json(),o.json()]);if(alive){const at=Date.now();setClock(at);setFeed({rates:Array.isArray(a.prices)?a.prices:[],offers:Array.isArray(b.offers)?b.offers:[],at});setFailed(false)}}catch{if(alive){setFeed(null);setFailed(true)}}}void load();const timer=setInterval(()=>{setClock(Date.now());void load()},30000);const tick=setInterval(()=>setClock(Date.now()),1000);return()=>{alive=false;abort.abort();clearInterval(timer);clearInterval(tick)}},[refresh]);
 const estimate=estimateCart(rows,pin,city,feed&&clock-feed.at<90000?feed.rates:[],feed&&clock-feed.at<90000?feed.offers:[],clock);
 const fingerprint=JSON.stringify([rows,pin,city,unload]),seller=dealer?.fingerprint===fingerprint?dealer.row:null;
 const activeSeller=seller&&(!seller.valid_to||Date.parse(seller.valid_to)>clock)?seller:null;
 async function compare(){if(busy||rows.length!==1||!(/^[1-9][0-9]{5}$/).test(pin))return;setBusy(true);setDealer(null);try{
 const client=createNeervaBrowserClient(),session=await client?.auth.getSession();if(!session?.data.session){setDealer({fingerprint,row:null,message:"Sign in to check local dealer estimates. Your cart is saved."});return}
 const item=rows[0],result=await operationsRequest<{sellers:Seller[]}>("/api/customer/dealer-comparison?"+new URLSearchParams({category:item.category,slug:item.productSlug,pin,qty:String(item.quantity)}),"GET",undefined,session.data.session.user.id);
 const eligible=(result.sellers??[]).filter(s=>s.unit===item.unit&&s.estimated_total_paise!==null&&[s.material_paise,s.fee_paise,s.discount_paise,s.tax_paise,s.freight_paise,s.unloading_paise,s.estimated_total_paise].every(n=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0));
 const exact=new Set(eligible.map(s=>s.sku)).size===1?eligible.sort((a,b)=>Number(a.estimated_total_paise)-Number(b.estimated_total_paise))[0]:null;
 setDealer({fingerprint,row:exact??null,message:exact?"Local seller estimate available. Final stock and service taxes require confirmation.":"No unambiguous fully priced seller found. Neerva will arrange a confirmed quote."});
 }catch(e){setDealer({fingerprint,row:null,message:e instanceof Error?e.message:"Dealer estimates unavailable."})}finally{setBusy(false)}}
 return <section className="nb-shop-cart-card"><h2>Delivery location & bill</h2><div className="dealer-onboarding-grid"><label>City<input value={city} maxLength={80} autoComplete="address-level2" onChange={e=>onLocation(pin,e.target.value)}/></label><label>Pincode<input value={pin} inputMode="numeric" maxLength={6} autoComplete="postal-code" onChange={e=>onLocation(e.target.value.replace(/\D/g,""),city)}/></label></div>
 {estimate.lines.map((line,i)=>line&&<p key={cartKey(rows[i])}>{rows[i].productName} · {line.sku}: {money(line.unitPaise)} / {rows[i].unit} · {money(line.materialPaise-line.discountPaise)}</p>)}
 <dl className="nb-shop-bill"><div><dt>Materials (published reference)</dt><dd>{estimate.complete?money(estimate.subtotalPaise):"To be confirmed"}</dd></div><div><dt>Published offer savings</dt><dd>{estimate.complete?money(estimate.discountPaise):"To be confirmed"}</dd></div>{["GST","Delivery","Handling",...(unload?["Unloading"]:[])].map(label=><div key={label}><dt>{label}</dt><dd>To be confirmed</dd></div>)}<div className="nb-shop-total"><dt>Final total</dt><dd>Awaiting confirmation</dd></div></dl>
 {failed&&<p role="status">Published price service unavailable. <button type="button" onClick={()=>setRefresh(n=>n+1)}>Retry prices</button></p>}
 <p>Published rates are not payable totals; exact SKU, tax and charges require confirmation. No discount code is promised.</p>
 {rows.length===1&&<button type="button" className="button button-outline" disabled={busy||!(/^[1-9][0-9]{5}$/).test(pin)} onClick={()=>void compare()}>{busy?"Checking dealers…":"Check local delivered price"}</button>}
 {dealer?.fingerprint===fingerprint&&<p role="status">{dealer.message}</p>}
 {activeSeller&&<div className="nb-shop-cart-card"><strong>{activeSeller.seller} · {activeSeller.sku}</strong><dl className="nb-shop-bill">{[["Materials",activeSeller.material_paise],["Additional material tax",activeSeller.tax_paise],["Platform fee",activeSeller.fee_paise],["Freight",activeSeller.freight_paise],["Unloading allowance",unload?activeSeller.unloading_paise:0],["Discount",-activeSeller.discount_paise],["Estimated total",Number(activeSeller.estimated_total_paise)-(unload?0:Number(activeSeller.unloading_paise))]].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{money(Number(value))}</dd></div>)}</dl><small>Not reserved or payable. Service taxes and optional charges require review.</small></div>}
 {rows.length>1&&<p>Multi-material delivery charges depend on the combined shipment. They are not added independently per item.</p>}
 </section>
}
