"use client";
import {useSyncExternalStore} from "react";
import Link from "next/link";
import {installedDisplayMode} from "@/modules/pwa/install-state";
type PromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
type State={ready:boolean;installed:boolean;runningStandalone:boolean;available:boolean;busy:boolean;platform:"ios"|"android"|"desktop"};
const initial:State={ready:false,installed:false,runningStandalone:false,available:false,busy:false,platform:"desktop"};
let state=initial,prompt:PromptEvent|null=null,started=false;
const listeners=new Set<()=>void>(),key="neerva-installed-v1";
// Keep confirmation for this document even if browser storage is blocked.
let confirmedInSession=false;
const media=["standalone","minimal-ui","window-controls-overlay"];
const read=()=>{try{return localStorage.getItem(key)==="1"}catch{return false}};
const remember=(yes:boolean)=>{try{if(yes)localStorage.setItem(key,"1");else localStorage.removeItem(key)}catch{}};
function update(next:Partial<State>){const value={...state,...next};if(Object.keys(value).every(k=>value[k as keyof State]===state[k as keyof State]))return;state=value;listeners.forEach(fn=>fn());}
function displayInstalled(){return installedDisplayMode(media.map(mode=>matchMedia("(display-mode: "+mode+")").matches),Boolean((navigator as Navigator&{standalone?:boolean}).standalone));}
function start(){
 if(started)return;started=true;
 const ua=navigator.userAgent;
 const platform=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)?"ios":/Android/.test(ua)?"android":"desktop";
 const sync=()=>{const standalone=displayInstalled();if(standalone){confirmedInSession=true;remember(true);prompt=null;}const installed=standalone||confirmedInSession||read();update({ready:true,platform,installed,runningStandalone:standalone,available:!!prompt&&!installed});};
 window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();if(displayInstalled())return;confirmedInSession=false;remember(false);prompt=event as PromptEvent;update({installed:false,available:true});});
 window.addEventListener("appinstalled",()=>{confirmedInSession=true;remember(true);prompt=null;update({installed:true,available:false,busy:false});});
 for(const mode of media){const query=matchMedia("(display-mode: "+mode+")");query.addEventListener?.("change",sync);}
 window.addEventListener("pageshow",sync);window.addEventListener("storage",sync);document.addEventListener("visibilitychange",sync);
 sync();
}
function subscribe(fn:()=>void){listeners.add(fn);start();return()=>{listeners.delete(fn)}}
export function usePwaInstall(){return useSyncExternalStore(subscribe,()=>state,()=>initial)}
export async function requestPwaInstall():Promise<"accepted"|"dismissed"|"unavailable">{
 if(!prompt||state.busy||state.installed)return "unavailable";
 const event=prompt;update({busy:true});
 try{await event.prompt();const decision=await event.userChoice;if(decision.outcome==="accepted"){update({available:false});}return decision.outcome;}
 catch{return "unavailable"}
 finally{prompt=null;update({busy:false,available:false});}
}
/** A remembered installation is not permanent proof. In browsers without
 * uninstall signals, the user can explicitly recover installation access. */
export function resetInstallPreference(){
 if(displayInstalled())return false;
 confirmedInSession=false;
 remember(false);
 update({installed:false,runningStandalone:false,available:!!prompt});
 return true;
}
export function InstallLink({children,className,ariaLabel,recoveryLabel}:{children:React.ReactNode;className?:string;ariaLabel?:string;recoveryLabel?:string}){
 const {ready,installed,runningStandalone}=usePwaInstall();
 if(!ready||runningStandalone)return null;
 if(installed)return recoveryLabel?<Link href="/install?recovery=1" prefetch={false}>{recoveryLabel}</Link>:null;
 return <Link href="/install" prefetch={false} className={className} aria-label={ariaLabel}>{children}</Link>;
}

/** One compact app utility outside the business-navigation columns. Never advertise
 * installation while running standalone or after a confirmed install. */
export function FooterAppAccess({language="en"}:{language?:"en"|"hi"}){
 const {ready,installed,runningStandalone}=usePwaInstall(),hi=language==="hi";
 if(!ready||runningStandalone)return null;
 return <div className="unified-footer-app" aria-label={hi?"नीरवा ऐप":"Neerva app access"}>
  <div className="unified-footer-app-copy"><span className="unified-footer-app-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg></span><div><strong>{hi?"नीरवा ऐप":"Neerva on your device"}</strong><span>{installed?(hi?"ऐप की सहायता और दोबारा सेटअप":"App support and setup help"):(hi?"होम स्क्रीन से सीधे खोलें":"Quick access from your home screen")}</span></div></div>
  <Link className="unified-footer-app-link" href={installed?"/install?recovery=1":"/install"} prefetch={false}>{installed?(hi?"ऐप सहायता":"App help"):(hi?"नीरवा इंस्टॉल करें":"Install Neerva")} <span aria-hidden="true">→</span></Link>
 </div>;
}
