
"use client";
import {useEffect,useState} from "react";
export function HandbookChecklist({id,revision,checks}:{id:string;revision:number;checks:readonly string[]}){
 const key="neerva-handbook-checks-v1:"+id+":"+revision;
 const [checked,setChecked]=useState<number[]>([]),[ready,setReady]=useState(false),[note,setNote]=useState("");
 useEffect(()=>{const t=window.setTimeout(()=>{try{const raw=localStorage.getItem(key);if(raw&&raw.length<1024){const v:unknown=JSON.parse(raw);if(Array.isArray(v))setChecked([...new Set(v.filter((n):n is number=>Number.isInteger(n)&&n>=0&&n<checks.length))])}}catch{setNote("Saved checklist unavailable.")}setReady(true)},0);return()=>clearTimeout(t)},[key,checks.length]);
 function toggle(i:number){const next=checked.includes(i)?checked.filter(n=>n!==i):[...checked,i];setChecked(next);try{localStorage.setItem(key,JSON.stringify(next));setNote("Saved on this device.")}catch{setNote("Changes remain in memory only.")}}
 return <section className="handbook-checks"><h2>Site conversation checklist</h2><p>Mark items you have discussed or documented. A tick is not an inspection approval.</p><progress value={checked.length} max={checks.length} aria-label="Checklist progress"/><p>{checked.length} of {checks.length} items recorded</p>{checks.map((c,i)=><label key={c}><input type="checkbox" checked={checked.includes(i)} disabled={!ready} onChange={()=>toggle(i)}/><span>{c}</span></label>)}<p role="status">{note}</p><button type="button" className="button button-outline" onClick={()=>window.print()}>Print this field guide</button></section>
}
