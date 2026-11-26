"use client";
import {invalidatePublicFeeds} from "@/modules/catalog/public-feed-client";
type Listener=()=>void;
const listeners=new Set<Listener>();
let stop:(()=>void)|undefined, timer:ReturnType<typeof setTimeout>|undefined, generation=0;
function invalidate(){clearTimeout(timer);timer=setTimeout(()=>{invalidatePublicFeeds();for(const listener of listeners)listener()},250);}
export function subscribeCatalogPriceSignal(listener:Listener){
 listeners.add(listener);
 if(listeners.size===1){
  const current=++generation;
  void import("@/modules/supabase/browser").then(({createNeervaBrowserClient})=>{
   if(current!==generation||!listeners.size)return;
   const client=createNeervaBrowserClient();if(!client)return;
   const channel=client.channel("neerva-catalog-price-invalidation").on("postgres_changes",{event:"UPDATE",schema:"public",table:"public_refresh_signals",filter:"topic=eq.catalog"},()=>{if(current===generation)invalidate()}).subscribe(status=>{if(current===generation&&status==="SUBSCRIBED")invalidate()});
   stop=()=>{void client.removeChannel(channel)};
  }).catch(()=>{/* foreground polling remains available */});
 }
 return()=>{listeners.delete(listener);if(!listeners.size){generation++;clearTimeout(timer);stop?.();stop=undefined}};
}
