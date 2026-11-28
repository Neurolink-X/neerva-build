"use client";
import {useState} from "react";
import {shadeReference,shadeBrief} from "@/modules/studio/shade-reference";
import Link from "next/link";
export function ShadeReferenceCard({entries,paint=true,compact=false}:{entries:readonly {label:string;value:string}[];paint?:boolean;compact?:boolean}){
 const [status,setStatus]=useState("");const valid=entries.flatMap(e=>{const ref=shadeReference(e.value);return ref?[{...e,ref}]:[]});if(!valid.length)return null;
 const brief=shadeBrief(entries);
 async function copy(){try{if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");await navigator.clipboard.writeText(brief);setStatus("Shade details copied.");}catch{setStatus("Copy unavailable. Use Save shade details instead.");}}
 function save(){const url=URL.createObjectURL(new Blob([brief],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="neerva-shade-reference.txt";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <details className="neerva-shade-reference" open={compact?undefined:true}><summary>Shade details &amp; purchase reference</summary><div className="neerva-shade-rows">{valid.map(({label,ref},i)=><div key={label+":"+i} className="neerva-shade-row"><i aria-hidden="true" style={{background:ref.hex}}/><span><strong>{label} · {ref.name}</strong><small>{ref.hex} · {ref.code}</small><small>{ref.family} · RGB {ref.rgb}</small></span></div>)}</div><p>Digital shade reference, not a manufacturer code. Match a physical shade card before ordering.</p><div className="neerva-shade-actions"><button type="button" onClick={()=>void copy()}>Copy details</button><button type="button" onClick={save}>Save shade details</button>{paint&&<Link href="/materials/paint" prefetch={false}>Browse paints →</Link>}</div>{status&&<p role="status">{status}</p>}</details>;
}
