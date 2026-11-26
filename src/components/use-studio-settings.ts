"use client";
import {useSyncExternalStore} from "react";
import {baseStudioConfig,parseStudioConfig,type StudioSetting} from "@/modules/studio/studio-config";
import type {StudioProduct} from "@/modules/studio/paid-products";
type Catalog={ready:boolean;products:StudioSetting[]};
const failed:Catalog={ready:false,products:[baseStudioConfig("home_studio"),baseStudioConfig("colour_studio")]};
let snapshot:Catalog=failed,active:Promise<void>|null=null;
const listeners=new Set<()=>void>();
const notify=()=>{for(const f of listeners)f()};
async function fetchSettings(){
 if(active)return active;
 if(navigator.onLine===false)return;
 const controller=new AbortController();
 const timeout=window.setTimeout(()=>controller.abort(),10000);
 active=fetch("/api/studio/config",{cache:"no-store",signal:controller.signal})
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
  snapshot=payload.ready===true&&products.length===2&&new Set(products.map((p:StudioSetting)=>p.product)).size===2?{ready:true,products}:failed;
 }).catch(()=>{snapshot=failed})
 .finally(()=>{window.clearTimeout(timeout);active=null;notify()});
 return active;
}
function subscribe(listener:()=>void){
 listeners.add(listener);
 if(listeners.size===1){
  void fetchSettings();
  window.addEventListener("focus",refresh);
  window.addEventListener("online",refresh);
  window.addEventListener("studio-config-changed",refresh);
  document.addEventListener("visibilitychange",onVisibility);
  polling=window.setInterval(()=>{if(document.visibilityState==="visible")void fetchSettings()},60000);
 }
 return ()=>{
  listeners.delete(listener);
  if(!listeners.size){
   window.removeEventListener("focus",refresh);
   window.removeEventListener("online",refresh);
   window.removeEventListener("studio-config-changed",refresh);
   document.removeEventListener("visibilitychange",onVisibility);
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
