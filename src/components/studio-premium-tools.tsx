"use client";
import {useState} from "react";
import Link from "next/link";
import {createNeervaBrowserClient} from "@/modules/supabase/browser";
import type {PlanBrief} from "@/modules/studio/plan-model";
import "@/app/studio-pricing/pricing.css";
import type {StudioProduct} from "@/modules/studio/paid-products";
const esc=(s:unknown)=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]??ch));
type Props={product:StudioProduct;brief?:PlanBrief;option?:number;base?:string;accent?:string;room?:string};
export function StudioPremiumTools({product,brief,option=0,base="#b6c7a3",accent="#c4925f",room="Home colour concept"}:Props){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function exportReport(){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const client=createNeervaBrowserClient();
   const jwt=(await client?.auth.getSession())?.data.session?.access_token;
   if(!jwt){setMessage("Sign in to use your paid Studio report.");return;}
   const payload=product==="home_studio"?{product,brief,option}:{product,base,accent,room};
   const r=await fetch("/api/studio/premium-report",{method:"POST",
    headers:{Authorization:"Bearer "+jwt,"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await r.json();
   if(!r.ok){setMessage(data.error??"Premium report is unavailable.");return;}
   let body="";
   if(product==="home_studio"){
    body='<h2>Site and room schedule</h2><p>Plot: '+esc(data.plot?.widthFt)+' × '+esc(data.plot?.depthFt)+' ft · '+esc(data.plot?.roadSide)+' road · '+esc(data.floors)+' level(s)</p>';
    body+='<table><thead><tr><th>Floor</th><th>Space</th><th>X (ft)</th><th>Y (ft)</th><th>Width (ft)</th><th>Depth (ft)</th></tr></thead><tbody>';
    for(const room of data.rooms??[])body+='<tr>'+[room.floor,room.room,room.xFt,room.yFt,room.widthFt,room.depthFt].map((x:unknown)=>'<td>'+esc(x)+'</td>').join("")+'</tr>';
    body+='</tbody></table>';
   }else{
    body='<h2>'+esc(data.room)+'</h2><p>Suggested digital palette; physical manufacturer shade matches are not guaranteed.</p><div class="swatches">';
    for(const swatch of data.swatches??[])body+='<div class="swatch"><i style="background:'+esc(swatch.colour)+'"></i><strong>'+esc(swatch.label)+'</strong><p>'+esc(swatch.colour)+'</p></div>';
    body+='</div>';
   }
   const html='<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NEERVA Studio concept report</title><style>body{font:15px/1.6 Arial,sans-serif;padding:25px;max-width:950px;margin:auto;color:#193f30}h1,h2{font-family:Georgia,serif}table{width:100%;border-collapse:collapse}td,th{border:1px solid #b0bcad;padding:7px;text-align:left}.swatches{display:flex;flex-wrap:wrap;gap:12px}.swatch{width:180px}.swatch i{display:block;height:110px;border-radius:9px;border:1px solid #ddd}footer{margin-top:40px;border-top:1px solid #bbb;padding-top:14px;font-size:12px;color:#697369}@media print{body{padding:0}}</style></head><body><h1>NEERVA BUILD — Studio concept report</h1><p>Private, user-requested planning summary. Not a construction approval.</p>'+body+'<footer>'+esc(data.disclaimer)+'</footer></body></html>';
   const blob=new Blob([html],{type:"text/html;charset=utf-8"});
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download=product==="home_studio"?"neerva-room-schedule.html":"neerva-colour-scheme.html";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   setMessage("Report downloaded. Open the HTML document and use Print → Save as PDF if needed.");
  }catch{setMessage("Failed to prepare a verified report. Check account/payment access.")}
  finally{setBusy(false)}
 }
 return <section className="studio-premium-export">
  <h3>Paid Studio — downloadable concept report</h3>
  <p>An optional one-time fee applies when enabled by admin. Your file is generated from the current plan or chosen digital palette; architectural and physical paint accuracy are not certified.</p>
  <button type="button" onClick={()=>void exportReport()} disabled={busy}>{busy?"Verifying access…":"Download my detailed Studio report"}</button>
  <p role="status">{message}</p>
  <Link href={"/studio-pricing?product="+product}>Compare free preview and paid access →</Link>
 </section>;
}
