"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {usePwaInstall,requestPwaInstall} from "@/components/pwa-install";
import {showInstallOffer,INSTALL_OFFER_DELAY_MS} from "@/modules/pwa/install-state";

const DISMISS_KEY="neerva-install-dismissed-until-v2";
const COOLDOWN=7*24*60*60*1000;

// Keep the offer non-modal and only show it after uninterrupted browsing time.
function InstallPromotion({busy,onInstall,onDismiss}:{busy:boolean;onInstall:()=>void;onDismiss:()=>void}){
 const [visible,setVisible]=useState(false);
 const [hi,setHi]=useState(false);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const sync=()=>{
   clearTimeout(timer);
   const editing=document.activeElement?.matches("input,textarea,select,[contenteditable=true]");
   if(document.visibilityState!=="visible"||editing){setVisible(false);return;}
   timer=setTimeout(()=>{
    if(document.visibilityState==="visible"&&!document.activeElement?.matches("input,textarea,select,[contenteditable=true]")){
     try{setHi(localStorage.getItem("neerva-home-lang")==="hi")}catch{}
     setVisible(true);
    }
   },INSTALL_OFFER_DELAY_MS);
  };
  sync();
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("focusin",sync);
  document.addEventListener("focusout",sync);
  return()=>{clearTimeout(timer);document.removeEventListener("visibilitychange",sync);document.removeEventListener("focusin",sync);document.removeEventListener("focusout",sync)};
 },[]);
 if(!visible)return null;
 return <aside className="neerva-install-banner" aria-label={hi?"नीरवा ऐप":"Install NEERVA BUILD"} role="region">
  <div className="neerva-install-copy">
   <span className="neerva-install-mark" aria-hidden="true">N</span>
   <div>
    <strong>{hi?"घर बनाने की योजना, एक टैप में":"Your home project, one tap away."}</strong>
    <p>{hi?"सामग्री देखें, घर की योजना बनाएं और अपने प्रोजेक्ट तक सीधे पहुंचें।":"Compare materials, plan your home and manage your project from your home screen."}</p>
   </div>
  </div>
  <div className="neerva-install-actions">
   <button type="button" disabled={busy} onClick={onInstall}>{busy?(hi?"खुल रहा है…":"Opening…"):(hi?"मुफ्त ऐप इंस्टॉल करें":"Install free app")}</button>
   <button type="button" className="neerva-install-skip" disabled={busy} onClick={onDismiss}>{hi?"वेबसाइट पर जारी रखें":"Continue browsing"}</button>
  </div>
 </aside>;
}

export function InstallExperience(){
 const state=usePwaInstall(),path=usePathname();
 const [dismissed,setDismissed]=useState(true);
 const [accepted,setAccepted]=useState(false);
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
  setDismissed(true);
 }
 async function install(){
  const decision=await requestPwaInstall();
  if(decision==="accepted")setAccepted(true);
  else dismiss(); // A browser dismissal also respects the seven-day cooldown.
 }
 if(!showInstallOffer({ready:state.ready,installed:state.installed,dismissed,accepted,path,available:state.available}))return null;
 return <InstallPromotion busy={state.busy} onInstall={()=>void install()} onDismiss={dismiss}/>;
}
