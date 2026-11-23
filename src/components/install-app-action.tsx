"use client";
import {useEffect,useRef,useState} from "react";
type PromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
function browserHelp(){
 const ua=navigator.userAgent;
 if(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))
  return "iPhone / iPad: open this page in Safari, tap Share, then Add to Home Screen. Apple browsers do not offer the Chrome install dialog.";
 if(/Android/.test(ua))return "Android: open in Chrome, tap ⋮ menu, then Install app or Add to Home screen. Some in-app browsers do not offer installation.";
 return "Desktop: in Chrome or Edge, use the install icon near the address bar or the browser menu. Some browsers only support bookmarks.";
}
export function InstallAppAction(){
 const prompt=useRef<PromptEvent|null>(null);
 const [installable,setInstallable]=useState(false);
 const [alreadyInstalled,setAlreadyInstalled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [help,setHelp]=useState("Open the site in your browser; exact installation steps depend on your device.");
 const [status,setStatus]=useState("");
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   setAlreadyInstalled(matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
   setHelp(browserHelp());
  });
  const available=(event:Event)=>{event.preventDefault();prompt.current=event as PromptEvent;setInstallable(true)};
  const installed=()=>{prompt.current=null;setInstallable(false);setAlreadyInstalled(true);setStatus("NEERVA BUILD was installed or added to the home screen.")};
  window.addEventListener("beforeinstallprompt",available);
  window.addEventListener("appinstalled",installed);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("beforeinstallprompt",available);window.removeEventListener("appinstalled",installed)};
 },[]);
 async function begin(){
  if(!prompt.current){setStatus("Use the browser instructions below; an install prompt is not currently available.");return;}
  setBusy(true);
  try{
   await prompt.current.prompt();
   const answer=await prompt.current.userChoice;
   setStatus(answer.outcome==="accepted"?"Installation was accepted. Check your home screen.":"Installation was dismissed. You can use your browser menu later.");
  }catch{setStatus("The browser could not open an install prompt. Follow the instructions below.")}
  finally{prompt.current=null;setInstallable(false);setBusy(false)}
 }
 return <section className="install-action" aria-labelledby="install-action-title">
  <h2 id="install-action-title">Install on this device</h2>
  <p>Installation is a browser feature, not a paid app-store download. Your browser decides whether an install button is available.</p>
  {alreadyInstalled?<strong role="status">App is already running from your home screen.</strong>:
   <button type="button" onClick={()=>void begin()} disabled={busy}>{busy?"Opening browser prompt…":installable?"Install NEERVA BUILD now":"How to install on this browser"}</button>}
  <p className="install-how" role="status">{help}</p>
  {status&&<p className="install-state" role="status">{status}</p>}
 </section>;
}
