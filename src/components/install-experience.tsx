"use client";
import {useEffect,useRef,useState} from "react";
type BeforeInstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
const DISMISS_KEY="neerva-install-dismissed-until-v2",INSTALLED="neerva-installed-v1";
const COOLDOWN=7*24*60*60*1000;
const storage=()=>{try{return window.localStorage}catch{return null}};
const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
function os(){
 const ua=navigator.userAgent;
 if(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))return "ios" as const;
 if(/Android/.test(ua))return "android" as const;
 return "desktop" as const;
}
/** Browser-dependent PWA discovery without a fake native-install promise.
 * Accessible from first render even if users never scroll 360px.
 */
export function InstallExperience(){
 const deferred=useRef<BeforeInstallPromptEvent|null>(null);
 const [ready,setReady]=useState(false),[supported,setSupported]=useState(false),[showHelp,setShowHelp]=useState(false),[busy,setBusy]=useState(false);
 const [platform,setPlatform]=useState<"ios"|"android"|"desktop">("desktop");
 useEffect(()=>{
  const store=storage();
  const allowed=()=>location.pathname!=="/install"&&!standalone()&&!store?.getItem(INSTALLED)&&Number(store?.getItem(DISMISS_KEY)||0)<Date.now();
  const frame=window.requestAnimationFrame(()=>{setPlatform(os());setReady(allowed());});
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
   void navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>undefined);
  }
  function installable(event:Event){event.preventDefault();deferred.current=event as BeforeInstallPromptEvent;setSupported(true);}
  function installed(){store?.setItem(INSTALLED,"1");deferred.current=null;setReady(false);setSupported(false);}
  window.addEventListener("beforeinstallprompt",installable);
  window.addEventListener("appinstalled",installed);
  return()=>{window.cancelAnimationFrame(frame);window.removeEventListener("beforeinstallprompt",installable);window.removeEventListener("appinstalled",installed);};
 },[]);
 function dismiss(){storage()?.setItem(DISMISS_KEY,String(Date.now()+COOLDOWN));setReady(false);setShowHelp(false);}
 async function install(){
  if(!deferred.current){setShowHelp(true);return;}
  const event=deferred.current;
  setBusy(true);
  try{
   await event.prompt();
   const decision=await event.userChoice;
   if(decision.outcome==="accepted"){setReady(false);}
   else setShowHelp(true);
  }catch{setShowHelp(true)}
  finally{deferred.current=null;setSupported(false);setBusy(false)}
 }
 if(!ready||standalone())return null;
 const help=platform==="ios"?"Safari: tap Share → Add to Home Screen. On iOS, this cannot trigger a native install dialog.":platform==="android"?"In Chrome, open ⋮ menu and select Install app or Add to Home screen. Some in-app browsers do not support installation.":"In Chrome/Edge, use the install icon in the address bar or browser menu. Your browser may not support installation.";
 return <aside className="neerva-install-banner" aria-label="Install NEERVA BUILD" role="region">
  <div><strong>Install NEERVA BUILD</strong><p>Quick home-screen access · internet is still required for quotes and account actions.</p>
   {showHelp&&<p role="status">{help}</p>}
  </div>
  <div className="neerva-install-actions">
   <button type="button" disabled={busy} onClick={()=>void install()}>{busy?"Opening…":supported?"Install app":"How to install"}</button>
   <button type="button" className="neerva-install-skip" onClick={dismiss}>Not now</button>
  </div>
 </aside>;
}
