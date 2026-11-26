"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {emptyShortlist,shortlistKey,readShortlist,materialKey,materialHref,visitMaterial,toggleSavedMaterial,type Shortlist} from "@/modules/home/material-shortlist";
const event="neerva-shortlist-change";
const subscribe=(notify:()=>void)=>{window.addEventListener(event,notify);window.addEventListener("storage",notify);return()=>{window.removeEventListener(event,notify);window.removeEventListener("storage",notify)}};
function snapshot(){try{return localStorage.getItem(shortlistKey)??""}catch{return ""}}
function update(fn:(s:Shortlist)=>Shortlist){try{const before=snapshot(),next=JSON.stringify(fn(readShortlist(before)));if(next!==before){localStorage.setItem(shortlistKey,next);window.dispatchEvent(new Event(event))}return true}catch{return false}}
function useShortlist(){const raw=useSyncExternalStore(subscribe,snapshot,()=>null);return {ready:raw!==null,data:raw===null?emptyShortlist:readShortlist(raw)}}
export function SaveMaterial({category,slug,name}:{category:string;slug:string;name:string}){
 const {ready,data}=useShortlist();const [message,setMessage]=useState("");
 const selected=data.saved.some(p=>materialKey(p)===category+"/"+slug);
 useEffect(()=>{update(s=>visitMaterial(s,{category,slug,name}))},[category,slug,name]);
 return <div className="neerva-shortlist-action"><button type="button" className="button button-outline" disabled={!ready} aria-pressed={selected} onClick={()=>{if(!selected&&data.saved.length>=30){setMessage("Saved list is full. Remove an item in My Project.");return}setMessage(update(s=>toggleSavedMaterial(s,{category,slug,name}))?(selected?"Removed from saved materials.":"Saved to My Project on this device."):"Storage unavailable. Material was not saved.")}}>{selected?"Saved ✓":"Save for my project"}</button><Link href="/my-project#saved-materials" prefetch={false}>My saved materials →</Link><small role="status">{message}</small></div>
}
export function MaterialShortlist({compact=false}:{compact?:boolean}){
 const {data,ready}=useShortlist();const [notice,setNotice]=useState("");
 if(!ready||(compact&&!data.saved.length&&!data.recent.length))return null;
 const groups=compact?[{title:"Continue browsing",items:data.recent.length?data.recent:data.saved}]:[{title:"Saved materials",items:data.saved},{title:"Recently viewed",items:data.recent}];
 return <section id={compact?undefined:"saved-materials"} className="neerva-shortlist" aria-label="Your material shortlist"><div className="neerva-shortlist-head"><div><h2>{compact?"Pick up where you left off":"Your material shortlist"}</h2><p>Saved on this browser. Prices and stock are checked again before purchase.</p></div><Link href={compact?"/my-project#saved-materials":"/materials"} prefetch={false}>{compact?"Open My Project →":"Browse materials →"}</Link></div>{groups.map(g=><div key={g.title}><h3>{g.title}</h3>{g.items.length?<ul>{g.items.slice(0,compact?4:30).map(p=><li key={materialKey(p)}><Link href={materialHref(p)} prefetch={false} data-intent-prefetch="">{p.name}</Link>{!compact&&g.title==="Saved materials"&&<button type="button" aria-label={"Remove "+p.name} onClick={()=>setNotice(update(s=>({...s,saved:s.saved.filter(x=>materialKey(x)!==materialKey(p))}))?"Material removed.":"Storage unavailable.")}>Remove</button>}</li>)}</ul>:<p>No items yet.</p>}</div>)}{!compact&&<div className="neerva-shortlist-action"><label><input type="checkbox" checked={data.historyEnabled} onChange={e=>{const enabled=e.target.checked;setNotice(update(s=>({...s,historyEnabled:enabled,recent:enabled?s.recent:[]}))?"Preference saved.":"Storage unavailable.")}}/> Remember recently viewed materials on this device</label><button type="button" className="button button-outline" onClick={()=>setNotice(update(s=>({...s,recent:[]}))?"Browsing history cleared.":"Storage unavailable.")}>Clear browsing history</button><small role="status">{notice}</small></div>}</section>
}
