"use client";
import {fittingPrice} from "@/modules/catalog/fitting-references";
import {hardwarePrice} from "@/modules/catalog/hardware-references";
import {paintReferencePrice} from "@/modules/catalog/paint-references";
import {tileReferencePrice} from "@/modules/catalog/tile-references";
import {planningRate} from "@/modules/catalog/planning-rate";
import {useSyncExternalStore} from "react";
import {loadPublicFeed} from "@/modules/catalog/public-feed-client";
import {subscribeCatalogPriceSignal} from "./catalog-price-signal";
import {validPublicRate,type PublicRate as Rate} from "@/modules/catalog/public-feed-validation";

const listeners=new Set<()=>void>();
let rates=new Map<string,Rate>(),request:Promise<void>|undefined,lastLoaded=0,lastAttempt=0;
const rateKey=(category:string,slug:string,sku?:string,unit?:string)=>category+"|"+slug+"|"+(sku??"")+"|"+(unit??"");
let timer:ReturnType<typeof setInterval>|undefined,expiry:ReturnType<typeof setTimeout>|undefined,stopSignal:(()=>void)|undefined,invalidated=false;
const notifyRates=()=>{for(const notify of listeners)notify()};
function scheduleExpiry(){
 clearTimeout(expiry);
 if(!listeners.size||!rates.size)return;
 const now=Date.now();
 let next=lastLoaded+90000;
 for(const rate of rates.values())if(rate.until)next=Math.min(next,Date.parse(rate.until));
 expiry=setTimeout(()=>{prune();scheduleExpiry();},Math.max(1,next-now));
}
function prune(){
 const now=Date.now();let changed=false;
 for(const [key,rate] of rates)if(now-lastLoaded>=90000||rate.until&&Date.parse(rate.until)<=now){rates.delete(key);changed=true;}
 if(changed)notifyRates();
}
function refresh(force=false){
 prune();scheduleExpiry();
 if(force){invalidated=true;rates=new Map();lastLoaded=0;notifyRates();}
 if(request||!listeners.size||document.visibilityState==="hidden"||navigator.onLine===false||(!invalidated&&Date.now()-lastAttempt<30000))return;
 invalidated=false;
 lastAttempt=Date.now();
 request=loadPublicFeed("prices").then(value=>{
  const body=value as {prices:unknown[]};
  const next=new Map<string,Rate>(),now=Date.now();
  if(Array.isArray(body?.prices))for(const r of body.prices as unknown[]){
   if(!validPublicRate(r,now))continue;
   for(const key of [rateKey(r.category,r.slug,r.sku),rateKey(r.category,r.slug),rateKey(r.category,r.slug,r.sku,r.unit),rateKey(r.category,r.slug,undefined,r.unit)])if(!next.has(key))next.set(key,r);
  }
  if(!invalidated){rates=next;lastLoaded=now;}
 }).catch(()=>{rates=new Map();lastLoaded=0}).finally(()=>{request=undefined;notifyRates();scheduleExpiry();if(invalidated)refresh()});
}
function onVisible(){if(document.visibilityState==="visible"){prune();scheduleExpiry();notifyRates();if(Date.now()-lastLoaded>=30000)refresh()}}
function subscribe(notify:()=>void){
 listeners.add(notify);
 if(listeners.size===1){onVisible();document.addEventListener("visibilitychange",onVisible);stopSignal=subscribeCatalogPriceSignal(()=>refresh(true));timer=setInterval(()=>refresh(),30000)}
 return ()=>{listeners.delete(notify);if(!listeners.size){clearInterval(timer);clearTimeout(expiry);timer=undefined;expiry=undefined;stopSignal?.();stopSignal=undefined;document.removeEventListener("visibilitychange",onVisible);}};
}
const noRate=()=>undefined;
function currentRate(category:string,slug:string,sku?:string,unit?:string){
 const rate=rates.get(rateKey(category,slug,sku,unit));
 return rate&&(!rate.until||Date.parse(rate.until)>Date.now())&&Date.now()-lastLoaded<90000?rate:undefined;
}
const format=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export function ProductPrice({category,slug,sku,unit,quoteOnly}:{sku?:string;unit?:string;category:string;slug:string;quoteOnly?:boolean}){
 const rate=useSyncExternalStore(subscribe,()=>currentRate(category,slug,sku,unit),noRate);
 // A published exact SKU must not inherit a generic historical family price.
 if(sku&&!rate)return <span>{quoteOnly?"Private quotation":"Get today’s price"}</span>;
 const budgetUnit:Record<string,string>={cement:"bag","bricks-blocks":"piece",steel:"kg",paint:"litre"};
 const budget=quoteOnly||(unit&&unit!==budgetUnit[category])?null:planningRate(category,slug);
 const fitting=category==="plumbing"&&!quoteOnly&&(!unit||unit==="piece")?fittingPrice(slug):null;
 if(!rate&&fitting)return <span><strong>{format.format(fitting.rupees)}</strong> / listed piece<br/>{fitting.size} · {fitting.market} · Reference, 24 Nov 2026. <a href={fitting.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const hardware=category==="hardware"&&!quoteOnly&&!unit?hardwarePrice(slug):null;
 if(!rate&&hardware)return <span><strong>{format.format(hardware.rupees)}</strong> / listed variant<br/>{hardware.pack} · Bengaluru reference · {hardware.checked} · Not a selling price. <a href={hardware.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const paint=category==="paint"&&!quoteOnly&&(!unit||unit==="litre")?paintReferencePrice(slug):null;
 if(!rate&&paint)return <span><strong>₹{paint.rupees} / L</strong><br/>MRP (incl. tax) · {paint.checked} · Largest pack; shade and pack prices may vary. <a href={paint.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const tile=category==="tiles"&&!quoteOnly&&(!unit||unit==="square_foot")?tileReferencePrice(slug):null;
 if(!rate&&tile)return <span><strong>₹{tile.rupees} / sq ft</strong><br/>Manufacturer MRP (tax included) · Reference checked {tile.checked}; dealer rate may differ. <a href={tile.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 if(!rate&&budget)return <span><strong>{budget}</strong><br/>Kanpur planning estimate · {category==="bricks-blocks"?"Aug":"Oct"} 2026 · Get a delivered quote</span>;
 if(quoteOnly||!rate)return <span>{quoteOnly?"Private quotation":"Request today’s rate"} · {category==="bricks-blocks"?"Specify quantity in pieces":category==="cement"?"Specify bag quantity":"Choose your quantity"}</span>;
 return <span><strong>From {format.format(rate.paise/100)} / {rate.unit}</strong><br/>Estimated material rate · {rate.city}{rate.prefix?" · PIN "+rate.prefix+"…":""} · Min. {rate.min} {rate.unit}{rate.until&&<> · Rate valid until {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(rate.until))} IST</>}</span>;
}
