"use client";
import {subscribePublicRefresh,publicRefreshConnected} from "./public-refresh";
import {useSyncExternalStore} from "react";
import {baseStudioConfig,parseStudioConfig,type StudioSetting} from "@/modules/studio/studio-config";
import type {StudioProduct} from "@/modules/studio/paid-products";
type Catalog={ready:boolean;products:StudioSetting[]};
const failed:Catalog={ready:false,products:[baseStudioConfig("home_studio"),baseStudioConfig("colour_studio")]};
let snapshot:Catalog=failed,active:Promise<void>|null=null,pendingRefresh=false,lastLoaded=0;
let unsubscribeRefresh:(()=>void)|undefined;
const listeners=new Set<()=>void>();
const notify=()=>{for(const f of listeners)f()};
async function fetchSettings(){
 if(document.hidden)return;
 if(active){pendingRefresh=true;return active;}
 active=fetch("/api/studio/config",{cache:"no-store"})
 .then(async r=>{
  if(!r.ok)throw Error("Studio settings temporarily unavailable");
  const payload=await r.json();
  const products=Array.isArray(payload.products)?
   payload.products.map((x:unknown)=>{
    if(typeof x!=="object"||x===null)return null;
    const r=x as Record<string,unknown>;
    return parseStudioConfig({product_code:r.product,access_mode:r.mode,
      price_paise:r.pricePaise,checkout_enabled:r.checkoutEnabled,is_published:r.published,
      free_preview_count:r.freePreviewCount,version:r.version});
   }).filter((x:StudioSetting|null):x is StudioSetting=>x!==null):[];
  snapshot=payload.ready&&products.length===2?{ready:true,products}:failed;lastLoaded=Date.now();
 }).catch(()=>{snapshot=failed})
 .finally(()=>{active=null;notify();if(pendingRefresh){pendingRefresh=false;if(listeners.size)void fetchSettings()}});
 return active;
}
function subscribe(listener:()=>void){
 listeners.add(listener);
 if(listeners.size===1){
  void fetchSettings();
  window.addEventListener("focus",refresh);
  window.addEventListener("studio-config-changed",refresh);
  document.addEventListener("visibilitychange",onVisibility);
  unsubscribeRefresh=subscribePublicRefresh("studio",refresh);
  polling=window.setInterval(()=>{if(!publicRefreshConnected()||Date.now()-lastLoaded>=60000)void fetchSettings()},15000);
 }
 return ()=>{
  listeners.delete(listener);
  if(!listeners.size){
   window.removeEventListener("focus",refresh);
   window.removeEventListener("studio-config-changed",refresh);
   document.removeEventListener("visibilitychange",onVisibility);
   unsubscribeRefresh?.();unsubscribeRefresh=undefined;
   if(polling!==null)window.clearInterval(polling);
   polling=null;
  }
 };
}
let polling:number|null=null;
const refresh=()=>void fetchSettings();
const onVisibility=()=>{if(document.visibilityState==="visible")refresh()};
const getSnapshot=()=>snapshot,getServerSnapshot=()=>failed;
export function useStudioSettings(product:StudioProduct){
 const result=useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot);
 return {ready:result.ready,config:result.products.find(p=>p.product===product)??baseStudioConfig(product)};
}
