"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {usePwaInstall,requestPwaInstall} from "@/components/pwa-install";
import {showInstallOffer} from "@/modules/pwa/install-state";
import Link from "next/link";

const DISMISS_KEY="neerva-install-dismissed-until-v2";
const COOLDOWN=7*24*60*60*1000;

export function InstallExperience(){
 const state=usePwaInstall(),path=usePathname();
 const [dismissed,setDismissed]=useState(true);
 const [accepted,setAccepted]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   try{setDismissed(Number(localStorage.getItem(DISMISS_KEY)||0)>Date.now())}
   catch{setDismissed(false)}
  });
  let disposed=false,registration:ReturnType<typeof setTimeout>|undefined;
  const register=()=>{
   if(disposed||registration!==undefined)return;
   registration=setTimeout(()=>{
    if(!disposed&&"serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){
     void navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>undefined);
    }
   },1000);
  };
  if(document.readyState==="complete")register();
  else window.addEventListener("load",register,{once:true});
  return()=>{
   disposed=true;
   clearTimeout(registration);
   cancelAnimationFrame(frame);
   window.removeEventListener("load",register);
  };
 },[]);
 function dismiss(){
  try{localStorage.setItem(DISMISS_KEY,String(Date.now()+COOLDOWN))}catch{/* Storage is optional. */}
  setDismissed(true);setMessage("");
 }
 async function install(){
  const decision=await requestPwaInstall();
  if(decision==="accepted")setAccepted(true);
  else setMessage(decision==="dismissed"?"Installation cancelled. You can install later from your browser.":"The browser could not open the install prompt. Use the installation guide.");
 }
 if(!showInstallOffer({ready:state.ready,installed:state.installed,dismissed,accepted,path}))return null;
 return <aside className="neerva-install-banner" aria-label="Install NEERVA BUILD" role="region">
  <div>
   <strong>NEERVA BUILD, one tap away</strong>
   <p>Quick access to materials and home planning. Live quotes and account actions require internet.</p>
   {message&&<p role="status">{message}</p>}
  </div>
  <div className="neerva-install-actions">
   {state.available?<button type="button" disabled={state.busy} onClick={()=>void install()}>{state.busy?"Opening…":"Install app"}</button>:<Link className="button button-dark" href="/install">How to install</Link>}
   <button type="button" className="neerva-install-skip" onClick={dismiss}>Not now</button>
  </div>
 </aside>;
}
