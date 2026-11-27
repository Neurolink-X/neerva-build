"use client";
import Link from "@/components/intent-link";
import {useSyncExternalStore} from "react";
import {usePathname} from "next/navigation";
import {catalogFeedScope} from "@/modules/catalog/feed-pagination";
import {loadPublicFeed} from "@/modules/catalog/public-feed-client";
import {subscribeCatalogPriceSignal} from "./catalog-price-signal";
import {validPublicOffer,type PublicOffer as Offer} from "@/modules/catalog/public-feed-validation";
const empty:Offer[]=[];
function makeOfferStore(categoryScope?:string){
const listeners=new Set<()=>void>();
let offers:Offer[]=empty,active:Promise<void>|null=null,timer:ReturnType<typeof setInterval>|undefined,expiry:ReturnType<typeof setTimeout>|undefined,lastLoaded=0,lastAttempt=0,invalidated=false,stopSignal:(()=>void)|undefined;
let byProduct=new Map<string,Offer>();
const keyFor=(category:string,slug:string)=>category+"|"+slug;
const notify=()=>{const next=new Map<string,Offer>();for(const o of offers){const key=keyFor(o.category,o.slug);if(!next.has(key))next.set(key,o)}byProduct=next;for(const listener of listeners)listener()};
const valid=validPublicOffer;
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
function refresh(force=false){
 removeExpired();scheduleExpiry();
 if(force){invalidated=true;offers=empty;lastLoaded=0;notify();}
 if(active||!listeners.size||document.visibilityState==="hidden"||navigator.onLine===false||(!invalidated&&Date.now()-lastAttempt<60000))return;
 invalidated=false;
 lastAttempt=Date.now();
 active=loadPublicFeed("offers",categoryScope).then(value=>{
  if(invalidated)return;
  const body=value as {offers:unknown[]};
  lastLoaded=Date.now();
  offers=Array.isArray(body?.offers)?(body.offers as unknown[]).filter((o):o is Offer=>valid(o,lastLoaded)&&(!categoryScope||o.category===categoryScope)):empty;
 }).catch(()=>{offers=empty;lastLoaded=0}).finally(()=>{active=null;notify();scheduleExpiry();if(invalidated)refresh()});
}
function onVisible(){
 clearInterval(timer);timer=undefined;
 if(document.visibilityState!=="visible"){clearTimeout(expiry);return;}
 removeExpired();scheduleExpiry();
 if(Date.now()-lastLoaded>=60000)refresh();
 if(listeners.size)timer=setInterval(()=>refresh(),60000);
}
function subscribe(listener:()=>void){
 listeners.add(listener);
 if(listeners.size===1){lastAttempt=0;onVisible();document.addEventListener("visibilitychange",onVisible);stopSignal=subscribeCatalogPriceSignal(()=>refresh(true))}
 return ()=>{listeners.delete(listener);if(!listeners.size){clearInterval(timer);clearTimeout(expiry);timer=undefined;expiry=undefined;stopSignal?.();stopSignal=undefined;document.removeEventListener("visibilitychange",onVisible);}};
}
return {subscribe,get:(category:string,slug:string)=>{const o=byProduct.get(keyFor(category,slug));return o&&Date.now()-lastLoaded<120000&&Date.parse(o.endsAt)>Date.now()?o:undefined}};
}
const offerStores=new Map<string,ReturnType<typeof makeOfferStore>>();
function offerStore(scope?:string){const key=scope??"all";let store=offerStores.get(key);if(!store){store=makeOfferStore(scope);offerStores.set(key,store)}return store}
const skipSubscribe=()=>()=>{};
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
export function CatalogOffer({category,slug,compact=false}:{category:string;slug:string;compact?:boolean}){
 const path=usePathname(),scope=catalogFeedScope(path??""),store=offerStore(scope===category?scope:undefined);
 const offer=useSyncExternalStore(category==="aggregates"?skipSubscribe:store.subscribe,()=>category==="aggregates"?undefined:store.get(category,slug),()=>undefined);
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
