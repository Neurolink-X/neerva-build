"use client";
import type {RealtimeChannel,SupabaseClient} from "@supabase/supabase-js";
type Topic="catalog"|"studio";
const listeners:Record<Topic,Set<()=>void>>={catalog:new Set(),studio:new Set()};
let client:SupabaseClient|undefined,channel:RealtimeChannel|undefined,generation=0,starting=false,connected=false;
function emit(topic:Topic){for(const listener of listeners[topic])listener()}
function notifyAll(){emit("catalog");emit("studio")}
function count(){return listeners.catalog.size+listeners.studio.size}
async function start(){
 if(starting||channel||!count()||document.hidden)return;
 starting=true;const id=++generation;
 try{
  const {createNeervaBrowserClient}=await import("@/modules/supabase/browser");
  if(id!==generation||!count()||document.hidden)return;
  const db=createNeervaBrowserClient();if(!db)return;
  client=db as unknown as SupabaseClient;
  channel=client.channel("neerva-public-refresh").on("postgres_changes",{event:"UPDATE",schema:"public",table:"public_refresh_signals"},payload=>{
   if(id!==generation||document.hidden)return;
   const topic=payload.new.topic;if(topic==="catalog"||topic==="studio")emit(topic)
  }).subscribe(status=>{if(id!==generation)return;connected=status==="SUBSCRIBED";if(connected)notifyAll()});
 }catch{/* polling remains available */}finally{if(id===generation)starting=false}
}
function stop(){generation++;starting=false;connected=false;const old=channel;channel=undefined;if(old&&client)void client.removeChannel(old)}
function visibility(){if(document.hidden)stop();else{notifyAll();void start()}}
export function publicRefreshConnected(){return connected}
export function subscribePublicRefresh(topic:Topic,listener:()=>void){
 const first=count()===0;listeners[topic].add(listener);
 if(first)document.addEventListener("visibilitychange",visibility);
 void start();
 return ()=>{listeners[topic].delete(listener);if(!count()){document.removeEventListener("visibilitychange",visibility);stop()}};
}
