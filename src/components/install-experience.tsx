"use client";
import {useEffect,useRef,useState} from "react";
type BeforeInstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
const KEY="neerva-install-dismissed-until-v1",IOS="neerva-ios-hint-seen-v1",INSTALLED="neerva-installed-v1",COOLDOWN=21*24*60*60*1000;
const storage=()=>{try{return window.localStorage}catch{return null}};
const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
export function InstallExperience(){
 const deferred=useRef<BeforeInstallPromptEvent|null>(null);
 const [engaged,setEngaged]=useState(false),[available,setAvailable]=useState(false),[showIOS,setShowIOS]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!("serviceWorker" in navigator)||location.protocol!=="https:"&&location.hostname!=="localhost")return;
  void navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>undefined);
  const saved=storage();
  const eligible=()=>!isStandalone()&&!saved?.getItem(INSTALLED)&&Number(saved?.getItem(KEY)||0)<Date.now();
  const onInstall=(event:Event)=>{
   event.preventDefault();deferred.current=event as BeforeInstallPromptEvent;
   setAvailable(eligible());
  };
  const onInstalled=()=>{saved?.setItem(INSTALLED,"1");deferred.current=null;setAvailable(false);setShowIOS(false)};
  const onEngagement=()=>{
   if(window.scrollY<360)return;
   setEngaged(true);
   if(isIOS()&&eligible()&&!saved?.getItem(IOS)){setShowIOS(true);saved?.setItem(IOS,"1")}
  };
  window.addEventListener("beforeinstallprompt",onInstall);
  window.addEventListener("appinstalled",onInstalled);
  window.addEventListener("scroll",onEngagement,{passive:true});
  return()=>{window.removeEventListener("beforeinstallprompt",onInstall);window.removeEventListener("appinstalled",onInstalled);window.removeEventListener("scroll",onEngagement)};
 },[]);
 const dismiss=()=>{
  storage()?.setItem(KEY,String(Date.now()+COOLDOWN));
  deferred.current=null;setAvailable(false);setShowIOS(false);
 };
 async function promptInstall(){
  const pending=deferred.current;if(!pending||busy)return;
  setBusy(true);
  try{
   await pending.prompt();const result=await pending.userChoice;
   if(result.outcome==="dismissed")dismiss();
   else setAvailable(false);
  }catch{dismiss()}finally{setBusy(false);deferred.current=null}
 }
 if(!engaged||(!available&&!showIOS)||isStandalone())return null;
 return <aside className="neerva-install-banner" aria-label="Install NEERVA BUILD">
  <div><strong>{showIOS?"Add NEERVA BUILD to your Home Screen":"Install NEERVA BUILD"}</strong>
   <p>{showIOS?"In Safari: tap Share, then Add to Home Screen.":"Get quick access to home planning. Quotes still need the internet."}</p></div>
  <div className="neerva-install-actions">
   {!showIOS&&<button type="button" disabled={busy} onClick={()=>void promptInstall()}>{busy?"Opening…":"Install"}</button>}
   <button type="button" className="neerva-install-skip" onClick={dismiss}>Not now</button>
  </div>
 </aside>;
}
