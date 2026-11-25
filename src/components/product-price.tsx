"use client";
import {fittingPrice} from "@/modules/catalog/fitting-references";
import {hardwarePrice} from "@/modules/catalog/hardware-references";
import {paintReferencePrice} from "@/modules/catalog/paint-references";
import {tileReferencePrice} from "@/modules/catalog/tile-references";
import {planningRate} from "@/modules/catalog/planning-rate";
import {useSyncExternalStore} from "react";

type Rate={category:string;slug:string;sku:string;unit:string;paise:number;city:string;prefix:string|null;min:number;until:string|null};
const listeners=new Set<()=>void>();
let rates=new Map<string,Rate>(),request:Promise<void>|undefined,lastLoaded=0;
const rateKey=(category:string,slug:string,sku?:string)=>category+"|"+slug+"|"+(sku??"");
let timer:ReturnType<typeof setInterval>|undefined,expiry:ReturnType<typeof setTimeout>|undefined;
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
function refresh(){
 prune();scheduleExpiry();
 if(request||!listeners.size||document.visibilityState==="hidden")return;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 request=fetch("/api/catalog/prices",{cache:"no-cache",signal:controller.signal}).then(async response=>{
  if(!response.ok)throw Error("Price feed unavailable");
  const body=await response.json();
  const next=new Map<string,Rate>(),now=Date.now();
  if(Array.isArray(body?.prices))for(const r of body.prices as Rate[]){
   if(!Number.isSafeInteger(r.paise)||r.paise<=0||r.until&&(!Number.isFinite(Date.parse(r.until))||Date.parse(r.until)<=now))continue;
   for(const key of [rateKey(r.category,r.slug,r.sku),rateKey(r.category,r.slug)])if(!next.has(key))next.set(key,r);
  }
  rates=next;lastLoaded=now;
 }).catch(()=>{rates=new Map();lastLoaded=0}).finally(()=>{clearTimeout(timeout);request=undefined;notifyRates();scheduleExpiry()});
}
function onVisible(){if(document.visibilityState==="visible"){prune();scheduleExpiry();notifyRates();if(Date.now()-lastLoaded>=30000)refresh()}}
function subscribe(notify:()=>void){
 listeners.add(notify);
 if(listeners.size===1){onVisible();document.addEventListener("visibilitychange",onVisible);timer=setInterval(refresh,30000)}
 return ()=>{listeners.delete(notify);if(!listeners.size){clearInterval(timer);clearTimeout(expiry);timer=undefined;expiry=undefined;document.removeEventListener("visibilitychange",onVisible)}};
}
const noRate=()=>undefined;
function currentRate(category:string,slug:string,sku?:string){
 const rate=rates.get(rateKey(category,slug,sku));
 return rate&&(!rate.until||Date.parse(rate.until)>Date.now())&&Date.now()-lastLoaded<90000?rate:undefined;
}
const format=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export function ProductPrice({category,slug,sku,quoteOnly}:{sku?:string;category:string;slug:string;quoteOnly?:boolean}){
 const rate=useSyncExternalStore(subscribe,()=>currentRate(category,slug,sku),noRate);
 const budget=quoteOnly?null:planningRate(category,slug);
 const fitting=category==="plumbing"&&!quoteOnly?fittingPrice(slug):null;
 if(!rate&&fitting)return <span><strong>{format.format(fitting.rupees)}</strong> / listed piece<br/>{fitting.size} · {fitting.market}, checked 24 Nov 2026. <a href={fitting.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const hardware=category==="hardware"&&!quoteOnly?hardwarePrice(slug):null;
 if(!rate&&hardware)return <span><strong>{format.format(hardware.rupees)}</strong> / listed variant<br/>{hardware.pack} · Bengaluru retailer reference, {hardware.checked}; historical listing, not Neerva selling price. <a href={hardware.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const paint=category==="paint"&&!quoteOnly?paintReferencePrice(slug):null;
 if(!rate&&paint)return <span><strong>₹{paint.rupees} / L</strong><br/>Manufacturer reference MRP, tax included, largest pack basis · {paint.checked}. Smaller packs and shade may differ. <a href={paint.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const tile=category==="tiles"&&!quoteOnly?tileReferencePrice(slug):null;
 if(!rate&&tile)return <span><strong>₹{tile.rupees} / sq ft</strong><br/>Manufacturer MRP (tax included) · Reference checked {tile.checked}; dealer rate may differ. <a href={tile.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 if(!rate&&budget)return <span><strong>{budget}</strong><br/>Kanpur planning estimate · {category==="bricks-blocks"?"Aug":"Oct"} 2026 · Get a delivered quote</span>;
 if(quoteOnly||!rate)return <span>{quoteOnly?"Private quotation":"Request today’s rate"} · {category==="bricks-blocks"?"Specify quantity in pieces":category==="cement"?"Specify bag quantity":"Choose your quantity"}</span>;
 return <span><strong>From {format.format(rate.paise/100)} / {rate.unit}</strong><br/>Published location-specific reference · {rate.sku} · {rate.city}{rate.prefix?" · PIN starts "+rate.prefix:""} · Min. {rate.min} {rate.unit}{rate.until&&<> · Rate valid until {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(rate.until))} IST</>}</span>;
}
