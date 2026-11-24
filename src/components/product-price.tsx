"use client";
import {hardwarePrice} from "@/modules/catalog/hardware-references";
import {paintReferencePrice} from "@/modules/catalog/paint-references";
import {tileReferencePrice} from "@/modules/catalog/tile-references";
import {planningRate} from "@/modules/catalog/planning-rate";
import {useSyncExternalStore} from "react";

type Rate={category:string;slug:string;sku:string;unit:string;paise:number;city:string;prefix:string|null;min:number;until:string|null};
const listeners=new Set<()=>void>();
let rates=new Map<string,Rate>(),request:Promise<void>|undefined,lastLoaded=0;
const rateKey=(category:string,slug:string,sku?:string)=>category+"|"+slug+"|"+(sku??"");
function refresh(){
 if(request||document.visibilityState==="hidden")return;
 request=fetch("/api/catalog/prices",{cache:"no-cache"}).then(async response=>{
  const body=response.ok?await response.json():null;
  const next=new Map<string,Rate>();
  if(Array.isArray(body?.prices))for(const r of body.prices as Rate[]){
   if(r.until&&Date.parse(r.until)<=Date.now())continue;
   for(const key of [rateKey(r.category,r.slug,r.sku),rateKey(r.category,r.slug)])if(!next.has(key))next.set(key,r);
  }
  rates=next;lastLoaded=Date.now();
 }).catch(()=>{rates=new Map();lastLoaded=0}).finally(()=>{request=undefined;for(const notify of listeners)notify()});
}
let timer:ReturnType<typeof setInterval>|undefined;
function onVisible(){if(document.visibilityState==="visible"){for(const notify of listeners)notify();if(Date.now()-lastLoaded>=30000)refresh()}}
function subscribe(notify:()=>void){
 listeners.add(notify);
 if(listeners.size===1){onVisible();document.addEventListener("visibilitychange",onVisible);timer=setInterval(refresh,30000)}
 return ()=>{listeners.delete(notify);if(!listeners.size){clearInterval(timer);timer=undefined;document.removeEventListener("visibilitychange",onVisible)}};
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
 const hardware=category==="hardware"&&!quoteOnly?hardwarePrice(slug):null;
 if(!rate&&hardware)return <span><strong>{format.format(hardware.rupees)}</strong> / listed variant<br/>{hardware.pack} · Bengaluru retailer reference, {hardware.checked}; historical listing, not Neerva selling price. <a href={hardware.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const paint=category==="paint"&&!quoteOnly?paintReferencePrice(slug):null;
 if(!rate&&paint)return <span><strong>₹{paint.rupees} / L</strong><br/>Manufacturer reference MRP, tax included, largest pack basis · {paint.checked}. Smaller packs and shade may differ. <a href={paint.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 const tile=category==="tiles"&&!quoteOnly?tileReferencePrice(slug):null;
 if(!rate&&tile)return <span><strong>₹{tile.rupees} / sq ft</strong><br/>Manufacturer MRP (tax included) · Reference checked {tile.checked}; dealer rate may differ. <a href={tile.source} target="_blank" rel="noopener noreferrer">Source ↗</a></span>;
 if(!rate&&budget)return <span><strong>{budget}</strong><br/>Kanpur planning estimate · {category==="bricks-blocks"?"Aug":"Oct"} 2026 · Get a delivered quote</span>;
 if(quoteOnly||!rate)return <span>{quoteOnly?"Private quotation":"Request today’s rate"} · {category==="bricks-blocks"?"Specify quantity in pieces":category==="cement"?"Specify bag quantity":"Choose your quantity"}</span>;
 return <span><strong>{format.format(rate.paise/100)} / {rate.unit}</strong><br/>{rate.sku} · {rate.city}{rate.prefix?" · PIN starts "+rate.prefix:""} · Min. {rate.min} {rate.unit}{rate.until&&<> · Rate valid until {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(rate.until))} IST</>}</span>;
}
