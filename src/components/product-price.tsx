"use client";
import {useSyncExternalStore} from "react";

type Rate={category:string;slug:string;sku:string;unit:string;paise:number;city:string;prefix:string|null;min:number;until:string|null};
const empty:Rate[]=[];
let rates:Rate[]=empty,request:Promise<void>|undefined;
const listeners=new Set<()=>void>();
function refresh(){
 if(request)return;
 request=fetch("/api/catalog/prices").then(async response=>{
  const body=response.ok?await response.json():null;
  rates=Array.isArray(body?.prices)?body.prices.filter((r:Rate)=>!r.until||Date.parse(r.until)>Date.now()):empty;
 }).catch(()=>{rates=empty}).finally(()=>{request=undefined;for(const notify of listeners)notify()});
}
let timer:ReturnType<typeof setInterval>|undefined;
function subscribe(notify:()=>void){
 listeners.add(notify);
 if(listeners.size===1){refresh();timer=setInterval(refresh,30000)}
 return ()=>{listeners.delete(notify);if(!listeners.size)clearInterval(timer)};
}
const format=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
export function ProductPrice({category,slug,quoteOnly}:{category:string;slug:string;quoteOnly?:boolean}){
 const all=useSyncExternalStore(subscribe,()=>rates,()=>empty);
 const rate=all.find(r=>r.category===category&&r.slug===slug);
 if(quoteOnly||!rate)return <span>{quoteOnly?"Private quotation":"Request today’s rate"} · {category==="bricks-blocks"?"Specify quantity in pieces":category==="cement"?"Specify bag quantity":"Choose your quantity"}</span>;
 return <span><strong>{format.format(rate.paise/100)} / {rate.unit}</strong><br/>{rate.sku} · {rate.city}{rate.prefix?" · PIN starts "+rate.prefix:""} · Min. {rate.min} {rate.unit}{rate.until&&<> · Rate valid until {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(rate.until))} IST</>}</span>;
}
