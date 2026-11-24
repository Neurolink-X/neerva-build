"use client";
import {subscribePublicRefresh,publicRefreshConnected} from "./public-refresh";
import {planningRate} from "@/modules/catalog/planning-rate";
import {useSyncExternalStore} from "react";

type Rate={category:string;slug:string;sku:string;unit:string;paise:number;city:string;prefix:string|null;min:number;until:string|null};
const listeners=new Set<()=>void>();
let rates=new Map<string,Rate>(),request:Promise<void>|undefined,lastLoaded=0;
const rateKey=(category:string,slug:string,sku?:string)=>category+"|"+slug+"|"+(sku??"");
let channel:BroadcastChannel|undefined,unsubscribeRefresh:(()=>void)|undefined;
let pendingRefresh=false;
function refresh(){
 if(document.visibilityState==="hidden")return;
 if(request){pendingRefresh=true;return;}
 request=fetch("/api/catalog/prices",{cache:"no-cache"}).then(async response=>{
  const body=response.ok?await response.json():null;
  const next=new Map<string,Rate>();
  if(Array.isArray(body?.prices))for(const r of body.prices as Rate[]){
   if(r.until&&Date.parse(r.until)<=Date.now())continue;
   for(const key of [rateKey(r.category,r.slug,r.sku),rateKey(r.category,r.slug)])if(!next.has(key))next.set(key,r);
  }
  rates=next;lastLoaded=Date.now();
 }).catch(()=>{rates=new Map();lastLoaded=0}).finally(()=>{request=undefined;for(const notify of listeners)notify();if(pendingRefresh){pendingRefresh=false;if(listeners.size)refresh()}});
}
let timer:ReturnType<typeof setInterval>|undefined;
function onVisible(){if(document.visibilityState==="visible"){for(const notify of listeners)notify();if(Date.now()-lastLoaded>=30000)refresh()}}
function subscribe(notify:()=>void){
 listeners.add(notify);
 if(listeners.size===1){onVisible();document.addEventListener("visibilitychange",onVisible);window.addEventListener("neerva-price-changed",refresh);if(typeof BroadcastChannel!=="undefined"){channel=new BroadcastChannel("neerva-public-price");channel.onmessage=()=>refresh()}unsubscribeRefresh=subscribePublicRefresh("catalog",refresh);timer=setInterval(()=>{if(!publicRefreshConnected()||Date.now()-lastLoaded>=60000)refresh()},15000)}
 return ()=>{listeners.delete(notify);if(!listeners.size){clearInterval(timer);timer=undefined;document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("neerva-price-changed",refresh);channel?.close();channel=undefined;unsubscribeRefresh?.();unsubscribeRefresh=undefined}};
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
 if(!rate&&budget)return <span><strong>{budget}</strong><br/>Kanpur planning estimate · {category==="bricks-blocks"?"Aug":"Oct"} 2026 · Get a delivered quote</span>;
 if(quoteOnly||!rate)return <span>{quoteOnly?"Private quotation":"Request today’s rate"} · {category==="bricks-blocks"?"Specify quantity in pieces":category==="cement"?"Specify bag quantity":"Choose your quantity"}</span>;
 return <span><strong>{format.format(rate.paise/100)} / {rate.unit}</strong><br/>{rate.sku} · {rate.city}{rate.prefix?" · PIN starts "+rate.prefix:""} · Min. {rate.min} {rate.unit}{rate.until&&<> · Rate valid until {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(rate.until))} IST</>}</span>;
}
