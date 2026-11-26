"use client";
import {invalidatePublicFeeds} from "@/modules/catalog/public-feed-client";
type Listener=()=>void;
const listeners=new Set<Listener>();
let stop:(()=>void)|undefined,timer:ReturnType<typeof setTimeout>|undefined,startTimer:ReturnType<typeof setTimeout>|undefined,generation=0,starting=false;
function invalidateNow(){clearTimeout(timer);invalidatePublicFeeds();for(const listener of listeners)listener();}
function invalidate(){clearTimeout(timer);timer=setTimeout(invalidateNow,250);}
function schedule(){
 if(!listeners.size||stop||starting||startTimer!==undefined||document.visibilityState!=="visible"||navigator.onLine===false)return;
 // HTTP feeds can render immediately. Start the optional realtime transport
 // after the initial page load, keeping the existing reconnect invalidation.
 const current=generation;
 startTimer=setTimeout(()=>{
  startTimer=undefined;if(current!==generation||!listeners.size||document.visibilityState!=="visible"||navigator.onLine===false)return;
  starting=true;
  void import("@/modules/supabase/browser").then(({createNeervaBrowserClient})=>{
   if(current!==generation||!listeners.size||document.visibilityState!=="visible"||navigator.onLine===false)return;
   const client=createNeervaBrowserClient();if(!client)return;
   const channel=client.channel("neerva-catalog-price-invalidation").on("postgres_changes",{event:"UPDATE",schema:"public",table:"public_refresh_signals",filter:"topic=eq.catalog"},()=>{if(current===generation)invalidate()}).subscribe(status=>{if(current===generation&&status==="SUBSCRIBED")invalidate()});
   stop=()=>{void client.removeChannel(channel)};
  }).catch(()=>{/* foreground polling remains available */}).finally(()=>{if(current===generation)starting=false});
 },2500);
}
function onNetwork(event:Event){
 if(event.type==="offline"){
  generation++;starting=false;clearTimeout(startTimer);startTimer=undefined;stop?.();stop=undefined;
  invalidateNow();return;
 }
 if(event.type==="online")invalidateNow();
 if(document.visibilityState!=="visible"){clearTimeout(startTimer);startTimer=undefined;return;}schedule();
}
export function subscribeCatalogPriceSignal(listener:Listener){
 listeners.add(listener);
 if(listeners.size===1){generation++;schedule();window.addEventListener("online",onNetwork);window.addEventListener("offline",onNetwork);document.addEventListener("visibilitychange",onNetwork);}
 return()=>{listeners.delete(listener);if(!listeners.size){generation++;starting=false;clearTimeout(timer);clearTimeout(startTimer);startTimer=undefined;stop?.();stop=undefined;window.removeEventListener("online",onNetwork);window.removeEventListener("offline",onNetwork);document.removeEventListener("visibilitychange",onNetwork)}};
}
