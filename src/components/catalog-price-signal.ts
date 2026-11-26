"use client";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
type Listener=()=>void;
const listeners=new Set<Listener>();
let stop:(()=>void)|undefined, timer:ReturnType<typeof setTimeout>|undefined;
function invalidate(){clearTimeout(timer);timer=setTimeout(()=>{for(const listener of listeners)listener()},250);}
export function subscribeCatalogPriceSignal(listener:Listener){
 listeners.add(listener);
 if(listeners.size===1){
  const client=createNeervaBrowserClient();
  if(client){
   const channel=client.channel("neerva-catalog-price-invalidation").on("postgres_changes",{event:"UPDATE",schema:"public",table:"public_refresh_signals",filter:"topic=eq.catalog"},invalidate).subscribe(status=>{if(status==="SUBSCRIBED")invalidate()});
   stop=()=>{void client.removeChannel(channel)};
  }
 }
 return()=>{listeners.delete(listener);if(!listeners.size){clearTimeout(timer);stop?.();stop=undefined}};
}
