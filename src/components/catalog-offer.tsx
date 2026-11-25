"use client";
import Link from "next/link";
import {useSyncExternalStore} from "react";
type Offer={id:string;title:string;terms:string;category:string;slug:string;sku:string;city:string;
 unit:string;prefix:string|null;min:number;basePaise:number;offerPaise:number;endsAt:string};
const empty:Offer[]=[],listeners=new Set<()=>void>();
let offers:Offer[]=empty,active:Promise<void>|null=null,timer:ReturnType<typeof setInterval>|undefined,expiry:ReturnType<typeof setTimeout>|undefined,lastLoaded=0;
const notify=()=>{for(const listener of listeners)listener()};
const valid=(o:Offer,now:number)=>o.offerPaise>0&&o.basePaise>o.offerPaise&&Date.parse(o.endsAt)>now;
function removeExpired(){
 const now=Date.now();
 const next=offers.filter(o=>valid(o,now)&&now-lastLoaded<120000);
 if(next.length!==offers.length){offers=next.length?next:empty;notify();}
}
function scheduleExpiry(){
 clearTimeout(expiry);
 if(!listeners.size||!offers.length)return;
 const next=Math.min(lastLoaded+120000,...offers.map(o=>Date.parse(o.endsAt)));
 expiry=setTimeout(()=>{removeExpired();scheduleExpiry();},Math.max(1,next-Date.now()));
}
function refresh(){
 removeExpired();scheduleExpiry();
 if(active||!listeners.size||document.visibilityState==="hidden")return;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 active=fetch("/api/catalog/offers",{cache:"no-cache",signal:controller.signal}).then(async response=>{
  if(!response.ok)throw Error("Offer feed unavailable");
  const body=await response.json();
  lastLoaded=Date.now();
  offers=Array.isArray(body?.offers)?body.offers.filter((o:Offer)=>valid(o,lastLoaded)):empty;
 }).catch(()=>{offers=empty;lastLoaded=0}).finally(()=>{clearTimeout(timeout);active=null;notify();scheduleExpiry()});
}
function onVisible(){
 if(document.visibilityState!=="visible")return;
 removeExpired();scheduleExpiry();
 if(Date.now()-lastLoaded>=60000)refresh();
}
function subscribe(listener:()=>void){
 listeners.add(listener);
 if(listeners.size===1){onVisible();document.addEventListener("visibilitychange",onVisible);timer=setInterval(refresh,60000)}
 return ()=>{listeners.delete(listener);if(!listeners.size){clearInterval(timer);clearTimeout(expiry);timer=undefined;expiry=undefined;document.removeEventListener("visibilitychange",onVisible)}};
}
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
export function CatalogOffer({category,slug,compact=false}:{category:string;slug:string;compact?:boolean}){
 const activeOffers=useSyncExternalStore(subscribe,()=>offers,()=>empty);
 const offer=activeOffers.find(o=>o.category===category&&o.slug===slug);
 if(!offer)return null;
 return <aside className={"catalog-offer"+(compact?" compact":"")} aria-label="Verified time-limited published offer">
   <strong>{offer.title}</strong>
   <div className="catalog-offer-prices"><s>{money.format(offer.basePaise/100)}</s><b>{money.format(offer.offerPaise/100)} / {offer.unit}</b></div>
   <small>Save {money.format((offer.basePaise-offer.offerPaise)/100)} / {offer.unit} · {offer.city}{offer.prefix?" · PIN "+offer.prefix+"…":""} · Minimum {offer.min} {offer.unit}</small>
   <small>Published terms valid until {date.format(new Date(offer.endsAt))} IST. {offer.terms}</small>
   {!compact&&<Link href={"/quotes?"+new URLSearchParams({category,material:offer.sku}).toString()}>Prepare a quote with these offer terms →</Link>}
   <small>Written dealer confirmation required. No stock or delivery promise.</small>
  </aside>;
}
