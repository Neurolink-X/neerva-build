"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {loadPublicFeed} from "@/modules/catalog/public-feed-client";
import {subscribeCatalogPriceSignal} from "./catalog-price-signal";
import {validPublicRate} from "@/modules/catalog/public-feed-validation";
import {validCombinedEstimate} from "@/modules/orders/combined-estimate";
import {estimateCart} from "@/modules/orders/cart-estimate";
import {cartKey,type CartItem} from "@/modules/orders/direct-cart";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
const formatter=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"});
const money=(n:number)=>formatter.format(n/100);
type Seller={seller:string;material_paise:number;fee_paise:number;discount_paise:number;freight_paise:number|null;unloading_paise:number|null;tax_paise:number|null;estimated_total_paise:number|null;valid_to:string|null};
export function CartPricePreview({rows,unload,pin,city,onLocation}:{rows:CartItem[];unload:boolean;pin:string;city:string;onLocation:(pin:string,city:string)=>void}){
 const [feed,setFeed]=useState<{rates:unknown[];offers:unknown[];at:number}|null>(null),[failed,setFailed]=useState(false),[clock,setClock]=useState(0),[refresh,setRefresh]=useState(0),[dealer,setDealer]=useState<{fingerprint:string;row:Seller|null;message:string;at?:number}|null>(null),[busy,setBusy]=useState(false);
 const revision=useRef(0);
 useEffect(()=>subscribeCatalogPriceSignal(()=>{revision.current++;setDealer(null);setFeed(null);setRefresh(n=>n+1)}),[]);
 useEffect(()=>{let alive=true,fetching=false;async function load(){if(fetching||document.hidden||!navigator.onLine)return;fetching=true;try{
 const [p,o]=await Promise.allSettled([loadPublicFeed("prices"),loadPublicFeed("offers")]);
 if(p.status!=="fulfilled")throw Error("Pricing unavailable");
 const a=p.value as {prices:unknown[]},b=o.status==="fulfilled"?o.value as {offers:unknown[]}:{offers:[]};
 if(alive){const at=Date.now();setClock(at);setFeed({rates:a.prices,offers:b.offers,at});setFailed(false)}
 }catch{if(alive){setFeed(null);setFailed(true)}}finally{fetching=false}}
 void load();const timer=setInterval(()=>{void load()},30000);
 const wake=()=>{if(!document.hidden){setClock(Date.now());void load()}};
 document.addEventListener("visibilitychange",wake);window.addEventListener("online",wake);
 return()=>{alive=false;clearInterval(timer);document.removeEventListener("visibilitychange",wake);window.removeEventListener("online",wake)}},[refresh]);
 // Recompute on actual expiry or data changes, not on every second.
 useEffect(()=>{const deadlines:number[]=[];
 if(feed){deadlines.push(feed.at+90000);for(const r of feed.rates)if(r&&typeof r==="object"&&"until" in r&&typeof r.until==="string")deadlines.push(Date.parse(r.until));for(const o of feed.offers)if(o&&typeof o==="object"&&"endsAt" in o&&typeof o.endsAt==="string")deadlines.push(Date.parse(o.endsAt));}
 if(dealer?.at){deadlines.push(dealer.at+60000);if(dealer.row?.valid_to)deadlines.push(Date.parse(dealer.row.valid_to));}
 const next=deadlines.filter(t=>Number.isFinite(t)&&t>clock).reduce((a,b)=>Math.min(a,b),Infinity);
 if(!Number.isFinite(next))return;const timeout=setTimeout(()=>setClock(Date.now()),Math.max(1,next-Date.now()+5));return()=>clearTimeout(timeout);
 },[feed,dealer,clock]);
 const current=useMemo(()=>feed&&clock-feed.at<90000?feed.rates.filter(r=>validPublicRate(r,clock)):[],[feed,clock]);
 const estimate=estimateCart(rows,pin,city,current,feed&&clock-feed.at<90000?feed.offers:[],clock);
 const referenceRows=rows.map(item=>{const eligible=current.filter(r=>r.category===item.category&&r.slug===item.productSlug&&r.unit===item.unit&&item.quantity>=r.min&&(!city.trim()||r.city.trim().toLowerCase()===city.trim().toLowerCase())&&(!/^[1-9][0-9]{5}$/.test(pin)||!r.prefix||pin.startsWith(r.prefix)));if(!eligible.length)return null;const values=eligible.map(r=>r.paise);return {low:Math.min(...values),high:Math.max(...values),locations:[...new Set(eligible.map(r=>r.city))].join(", ")};});
 const locationReady=/^[1-9][0-9]{5}$/.test(pin)&&city.trim().length>=2;
 const fingerprint=JSON.stringify([rows,pin,city,unload]),seller=dealer?.fingerprint===fingerprint?dealer.row:null;
 const activeSeller=seller&&dealer?.at&&clock-dealer.at<60000&&(!seller.valid_to||Date.parse(seller.valid_to)>clock)?seller:null;
 async function compare(){if(busy||!rows.length||!(/^[1-9][0-9]{5}$/).test(pin))return;const comparedRevision=revision.current;setBusy(true);setDealer(null);try{
 const client=createNeervaBrowserClient(),session=await client?.auth.getSession();if(!session?.data.session){setDealer({fingerprint,row:null,message:"Sign in to check local dealer estimates. Your cart is saved."});return}
 const {data,error}=await client!.rpc("neerva_combined_cart_estimate",{p_items:rows.map(({category,productSlug,quantity,unit})=>({category,productSlug,quantity,unit})),p_pin:pin,p_unload:unload}).abortSignal(AbortSignal.timeout(15000));
 if(error)throw Error("Local pricing service unavailable. Retry.");
 const latest=await client!.auth.getSession();if(latest.error||latest.data.session?.user.id!==session.data.session.user.id)throw Error("Account changed. Check prices again.");
 if(data!==null&&!validCombinedEstimate(data,unload,Date.now()))throw Error("Dealer estimate could not be verified. Request a reviewed quote.");
 if(comparedRevision!==revision.current)return;
 const exact=data as Seller|null;
 setDealer({fingerprint,row:exact,at:Date.now(),message:exact?"One eligible branch can quote the full cart. Delivery is counted once. Stock is not reserved.":"No single fully priced branch covers the entire cart. Neerva will arrange supply."});
 }catch(e){if(comparedRevision===revision.current)setDealer({fingerprint,row:null,message:e instanceof Error?e.message:"Dealer estimates unavailable."})}finally{setBusy(false)}}
 return <section className="nb-shop-cart-card"><h2>Delivery location & estimated bill</h2><p>See published material rates below. Enter your city and PIN for a local delivered estimate.</p><div className="nb-shop-location"><label>City<input value={city} maxLength={80} autoComplete="address-level2" onChange={e=>onLocation(pin,e.target.value)}/></label><label>Pincode<input value={pin} inputMode="numeric" maxLength={6} autoComplete="postal-code" onChange={e=>onLocation(e.target.value.replace(/\D/g,""),city)}/></label></div>
 {estimate.lines.map((line,i)=>line?<p key={cartKey(rows[i])}>{rows[i].productName} · {line.sku}: {money(line.unitPaise)} / {rows[i].unit} · {money(line.materialPaise-line.discountPaise)}</p>:referenceRows[i]?<p key={cartKey(rows[i])}>{rows[i].productName} · <strong>{money(referenceRows[i]!.low)}{referenceRows[i]!.high!==referenceRows[i]!.low?" – "+money(referenceRows[i]!.high):""} / {rows[i].unit}</strong><br/><small>Published reference · {referenceRows[i]!.locations} · not a delivered quote</small></p>:null)}
 <dl className="nb-shop-bill"><div><dt>Materials (published reference)</dt><dd>{estimate.complete?money(estimate.subtotalPaise):!locationReady?"Enter delivery location":"Exact SKU rate needed"}</dd></div><div><dt>Published offer savings</dt><dd>{estimate.complete&&estimate.discountPaise>0?money(estimate.discountPaise):"Not verified"}</dd></div>{["GST","Delivery","Handling",...(unload?["Unloading"]:[])].map(label=><div key={label}><dt>{label}</dt><dd>Included in reviewed quote</dd></div>)}<div className="nb-shop-total"><dt>Delivered total</dt><dd>{activeSeller?money(Number(activeSeller.estimated_total_paise))+" est.":"Quote required"}</dd></div></dl>
 {failed&&<p role="status">Published price service unavailable. <button type="button" onClick={()=>setRefresh(n=>n+1)}>Retry prices</button></p>}
 <p>No payment is taken now. Review the exact materials, GST, delivery and other fees before approving your order.</p>
 {rows.length>0&&<button type="button" className="button button-outline" disabled={busy||!(/^[1-9][0-9]{5}$/).test(pin)} onClick={()=>void compare()}>{busy?"Checking dealers…":"Check local delivered price"}</button>}
 {dealer?.fingerprint===fingerprint&&<p role="status">{dealer.message}</p>}
 {activeSeller&&<div className="nb-shop-cart-card"><strong>{activeSeller.seller} · Combined shipment</strong><dl className="nb-shop-bill">{[["Materials",activeSeller.material_paise],["Additional material tax",activeSeller.tax_paise],["Platform fee",activeSeller.fee_paise],["Freight",activeSeller.freight_paise],["Unloading allowance",activeSeller.unloading_paise],["Discount",-activeSeller.discount_paise],["Estimated total",Number(activeSeller.estimated_total_paise)]].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{money(Number(value))}</dd></div>)}</dl><small>Not reserved or payable. Service taxes and optional charges require review.</small></div>}
 {rows.length>1&&<p>For a combined shipment, freight and unloading are counted once. Split shipments need a reviewed quote.</p>}
 </section>
}
