"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import {DirectOrdersPanel} from "./direct-orders-panel";
import {OrderList} from "./order-list";
const client=createNeervaBrowserClient();
export function CustomerOrdersWorkspace(){
 const [session,setSession]=useState<{id:string;verified:boolean}|null|undefined>(undefined);
 const [tab,setTab]=useState<"direct"|"dealer">("direct");
 useEffect(()=>{
  let active=true;
  if(!client){const timer=setTimeout(()=>{if(active)setSession(null)},0);return()=>{active=false;clearTimeout(timer)}}
  const {data:listener}=client.auth.onAuthStateChange((_event,s)=>{if(active)setSession(s?.user?{id:s.user.id,verified:Boolean(s.user.email_confirmed_at)}:null)});
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 if(session===undefined)return <p role="status">Checking your secure account…</p>;
 if(!session||!session.verified)return <section style={{padding:24,border:"1px solid #d5e0d4",borderRadius:14}}><h2>{session?"Verify your email to view orders":"Your orders are private"}</h2><p>{session?"Confirm your email before accessing your material orders.":"Sign in to track deliveries, review prices and manage previous orders."}</p><Link className="button button-dark" href="/account?next=%2Faccount%2Forders">{session?"Open account verification":"Sign in to view orders"} →</Link> <Link className="button button-outline" href="/materials">Browse materials</Link></section>;
 return <section key={session.id} aria-label="Customer order workspace"><div role="group" aria-label="Choose order source" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBlock:20}}>{(["direct","dealer"] as const).map(value=><button key={value} type="button" className={tab===value?"button button-dark":"button button-outline"} aria-pressed={tab===value} onClick={()=>setTab(value)}>{value==="direct"?"Neerva orders":"Dealer orders"}</button>)}</div>{tab==="direct"?<DirectOrdersPanel role="customer"/>:<><h2>Dealer orders</h2><OrderList/></>}</section>;
}
