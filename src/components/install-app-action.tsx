"use client";
import {useState} from "react";
import Link from "next/link";
import {usePwaInstall,requestPwaInstall,resetInstallPreference} from "@/components/pwa-install";

const guides={
 android:{title:"Android · Chrome",steps:["Open Neerva in Chrome.","Tap the three-dot menu (⋮).","Choose Install app or Add to Home screen."],note:"Some in-app browsers do not support installation. Open Chrome directly."},
 ios:{title:"iPhone / iPad · Safari",steps:["Open Neerva in Safari.","Tap Share.","Choose Add to Home Screen and confirm."],note:"Safari uses its own home-screen flow rather than a Chrome-style install prompt."},
 desktop:{title:"Computer · Chrome or Edge",steps:["Open Neerva in your browser.","Look for the install icon or open the browser menu.","Choose Install when available."],note:"Some browsers only offer a bookmark or shortcut."}
};
export function InstallAppAction(){
 const state=usePwaInstall(),[message,setMessage]=useState("");
 if(!state.ready)return <section className="install-action" aria-busy="true">Checking your device…</section>;
 if(state.installed)return <section className="install-action" aria-labelledby="install-action-title">
  <h2 id="install-action-title">Neerva is ready to use</h2>
  <p role="status">{state.runningStandalone?"Neerva is running as an installed app.":"Neerva was previously installed on this device."}</p>
  <Link className="install-primary" href="/">Open Neerva</Link>
  {!state.runningStandalone&&<p><button type="button" onClick={()=>{if(resetInstallPreference())setMessage("Installation options restored. Follow the steps for your device.");}}>App removed? Set up again</button></p>}
 </section>;
 const guide=guides[state.platform];
 async function begin(){
  const result=await requestPwaInstall();
  setMessage(result==="dismissed"?"Installation cancelled. You can try again from your browser menu.":result==="unavailable"?"The browser could not open an install prompt. Follow the steps below.":"Installation accepted. Check your home screen.");
 }
 return <section className="install-action" aria-labelledby="install-action-title">
  <h2 id="install-action-title">Get Neerva on your device</h2>
  <p>Free home-screen access. Your browser decides which installation options are available.</p>
  {state.available&&<button type="button" disabled={state.busy} onClick={()=>void begin()}>{state.busy?"Opening…":"Install Neerva"}</button>}
  {message&&<p className="install-state" role="status">{message}</p>}
  <h3>{guide.title}</h3>
  <ol>{guide.steps.map(step=><li key={step}>{step}</li>)}</ol>
  <p className="install-how">{guide.note}</p>
  <details>
   <summary>Using another device?</summary>
   {Object.entries(guides).filter(([id])=>id!==state.platform).map(([id,g])=><div key={id}><h3>{g.title}</h3><ol>{g.steps.map(step=><li key={step}>{step}</li>)}</ol><p>{g.note}</p></div>)}
  </details>
 </section>;
}
