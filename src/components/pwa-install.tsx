"use client";
import {useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {installedDisplayMode,installEnvironment,installAction,type InstallBrowser,type InstallPlatform} from "@/modules/pwa/install-state";
type PromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
type State={ready:boolean;installed:boolean;runningStandalone:boolean;available:boolean;busy:boolean;platform:InstallPlatform;browser:InstallBrowser};
const initial:State={ready:false,installed:false,runningStandalone:false,available:false,busy:false,platform:"desktop",browser:"other"};
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
 const {platform,browser}=installEnvironment(navigator.userAgent,navigator.platform,navigator.maxTouchPoints);
 const sync=()=>{const standalone=displayInstalled();if(standalone){confirmedInSession=true;remember(true);prompt=null;}const installed=standalone||confirmedInSession||read();update({ready:true,platform,browser,installed,runningStandalone:standalone,available:!!prompt&&!installed});};
 const capture=(event:Event)=>{const candidate=event as PromptEvent;if(typeof candidate.prompt!=="function"||!candidate.userChoice)return;event.preventDefault();if(displayInstalled())return;confirmedInSession=false;remember(false);prompt=candidate;update({installed:false,available:true});};
 const early=window as Window&{__neervaInstallPrompt?:Event;__neervaReleasePrompt?:()=>void};window.addEventListener("beforeinstallprompt",capture);early.__neervaReleasePrompt?.();const pending=early.__neervaInstallPrompt;delete early.__neervaInstallPrompt;delete early.__neervaReleasePrompt;if(pending)capture(pending);
 window.addEventListener("appinstalled",()=>{confirmedInSession=true;remember(true);prompt=null;update({installed:true,available:false,busy:false});});
 for(const mode of media){const query=matchMedia("(display-mode: "+mode+")");query.addEventListener?.("change",sync);}
 window.addEventListener("pageshow",sync);window.addEventListener("storage",sync);document.addEventListener("visibilitychange",sync);
 sync();
}
function subscribe(fn:()=>void){listeners.add(fn);start();return()=>{listeners.delete(fn)}}
export function usePwaInstall(){return useSyncExternalStore(subscribe,()=>state,()=>initial)}
export async function requestPwaInstall():Promise<"accepted"|"dismissed"|"unavailable">{
 if(!prompt||state.busy||state.installed)return "unavailable";
 const event=prompt;prompt=null;update({busy:true,available:false});
 try{await event.prompt();const decision=await event.userChoice;if(decision.outcome==="accepted"){update({available:false});}return decision.outcome;}
 catch{return "unavailable"}
 finally{update({busy:false,available:!!prompt&&!state.installed});}
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
 const state=usePwaInstall(),{ready,installed,runningStandalone,available,busy}=state,hi=language==="hi";
 const action=installAction(state);
 const [result,setResult]=useState<"accepted"|"dismissed"|"unavailable"|null>(null);
 const pathname=usePathname();
 if(!ready||runningStandalone||pathname==="/install")return null;
 async function install(){setResult(await requestPwaInstall());}

 return <div className="unified-footer-app" aria-label={hi?"नीरवा ऐप":"Neerva app access"}>
  <div className="unified-footer-app-copy"><div><strong>{hi?"नीरवा ऐप":"Neerva on your device"}</strong><span>{installed?(hi?"ऐप की सहायता और दोबारा सेटअप":"App support and setup help"):(hi?"मुफ्त ऐप · होम स्क्रीन से सीधे खोलें":"Free app · Quick home screen access")}</span></div></div>
  {action==="help"?<Link className="unified-footer-app-link" href="/install?recovery=1" prefetch={false}>{hi?"ऐप सहायता":"App help"}</Link>:action!=="native"&&!busy?<Link className="unified-footer-app-link" href="/install" prefetch={false}>{hi?"ऐप कैसे जोड़ें":"Get Neerva app"}</Link>:<button type="button" className="unified-footer-app-link" disabled={busy} onClick={()=>void install()}><svg className="unified-footer-app-mark" aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="22" height="22" rx="5" fill="#263e33"/><rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.6" fill="#8bc5b5"/><rect x="13" y="4.5" width="6.5" height="6.5" rx="1.6" fill="#e4ba91"/><rect x="4.5" y="13" width="6.5" height="6.5" rx="1.6" fill="#b5c6e1"/><path d="M16.25 13.5v5.5m-2.75-2.75H19" stroke="#f5f8f3" strokeWidth="1.9"/></svg><span>{busy?(hi?"खोल रहे हैं…":"Opening…"):(hi?"नीरवा इंस्टॉल करें":"Install Neerva")}</span></button>}
  {!installed&&result&&<p className="unified-footer-install-feedback" role="status">{result==="accepted"?(hi?"इंस्टॉलेशन स्वीकार किया गया। होम स्क्रीन देखें।":"Installation accepted. Check your home screen."):result==="dismissed"?(hi?"इंस्टॉलेशन रद्द हुआ। ब्राउज़र मेनू से फिर कोशिश करें।":"Installation cancelled. Try again from your browser menu."):(hi?"सीधा इंस्टॉल विकल्प अभी उपलब्ध नहीं है।":"Your browser did not open an install prompt.")}{result!=="accepted"&&!available&&<span><Link href="/install" prefetch={false}>{hi?"अपने डिवाइस के लिए सेटअप देखें":"See setup steps for your device"}</Link></span>}</p>}
 </div>;
}
