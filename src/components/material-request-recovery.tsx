"use client";
import {useState} from "react";
import Link from "next/link";
type Material={productName:string;quantity:number;unit:string};
export function materialRequestText(items:readonly Material[],city="",pin=""){
 return ["NEERVA BUILD · Material request draft (NOT submitted)",...items.map(i=>i.productName+" — "+i.quantity+" "+i.unit),...(city.trim()?["Delivery city: "+city.trim()]:[]),...(/^[1-9][0-9]{5}$/.test(pin)?["Pincode: "+pin]:[]),"Stock, GST, delivery charges and price require confirmation. No payment or reservation has been made."].join("\n");
}
export function MaterialRequestRecovery({getDraft}:{getDraft:()=>string}){
 const [message,setMessage]=useState("");
 async function copy(){try{await navigator.clipboard.writeText(getDraft());setMessage("Draft copied. No request has been submitted.")}catch{setMessage("Clipboard unavailable. Use Download draft instead.")}}
 function download(){try{const url=URL.createObjectURL(new Blob([getDraft()],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="neerva-material-request.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage("Draft download requested. No request has been submitted.")}catch{setMessage("Download unavailable. Copy your material list manually.")}}
 return <section className="category-guidance" aria-label="Keep your material request"><h3>Keep your material request</h3><p>Save a material-only draft if the connection is interrupted. Contact details, address and payment information are not included.</p><div className="admin-inline"><button type="button" className="button button-outline" onClick={()=>void copy()}>Copy material draft</button><button type="button" className="button button-outline" onClick={download}>Download draft</button><Link href="/support" target="_blank" rel="noopener">Get order help</Link></div>{message&&<p role="status">{message}</p>}</section>
}
