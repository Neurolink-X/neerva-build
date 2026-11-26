"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {usePwaInstall,requestPwaInstall} from "@/components/pwa-install";
import Link from "next/link";
const key="neerva-install-dismissed-until-v2";
export function InstallExperience(){
 const state=usePwaInstall(),path=usePathname(),[dismissed,setDismissed]=useState(true);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{try{setDismissed(Number(localStorage.getItem(key)||0)>Date.now())}catch{setDismissed(false)}});
  let timer:ReturnType<typeof setTimeout>|undefined;
  const register=()=>{timer=setTimeout(()=>{if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))void navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>undefined)},1000)};
  if(document.readyState==="complete")register();else window.addEventListener("load",register,{once:true});
  return()=>{cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener("load",register)};
 },[]);
 if(!state.ready||state.installed||dismissed||path==="/install"||!state.available)return null;
 return <aside className="neerva-install-banner" aria-label="Install NEERVA BUILD"><div><strong>NEERVA BUILD, one tap away</strong><p>Keep materials and home planning handy.</p></div><div className="neerva-install-actions"><button disabled={state.busy} onClick={()=>void requestPwaInstall()}>{state.busy?"Opening…":"Install app"}</button><button className="neerva-install-skip" onClick={()=>{try{localStorage.setItem(key,String(Date.now()+7*86400000))}catch{}setDismissed(true)}}>Not now</button><Link href="/install">Help</Link></div></aside>;
}
