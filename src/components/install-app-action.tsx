"use client";
import {useState} from "react";
import {installationGuide} from "@/modules/pwa/install-state";
import Link from "next/link";
import {usePwaInstall,requestPwaInstall,resetInstallPreference} from "@/components/pwa-install";

export function InstallAppAction(){
 const state=usePwaInstall(),[message,setMessage]=useState("");
 if(!state.ready)return <section className="install-action" aria-busy="true">Checking your device…</section>;
 if(state.installed)return <section className="install-action" aria-labelledby="install-action-title">
  <h2 id="install-action-title">Neerva is ready to use</h2>
  <p role="status">{state.runningStandalone?"Neerva is running as an installed app.":"Neerva was previously installed on this device."}</p>
  <Link className="install-primary" href="/">Open Neerva</Link>
  {!state.runningStandalone&&<p><button type="button" onClick={()=>{if(resetInstallPreference())setMessage("Installation options restored. Follow the steps for your device.");}}>App removed? Set up again</button></p>}
 </section>;
 const guide=installationGuide(state.platform,state.browser);
 async function copyLink(){try{await navigator.clipboard.writeText("https://www.neerva.in/");setMessage("Neerva link copied. Paste it into your preferred browser.");}catch{setMessage("Copy the website address shown below manually.");}}
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
  <label>Website address <input type="url" readOnly value="https://www.neerva.in/" onFocus={e=>e.currentTarget.select()} style={{width:"100%",minHeight:44}}/></label>
  <button type="button" onClick={()=>void copyLink()}>Copy Neerva link</button>
  <p><Link href="/">Continue using website →</Link></p>
  <details>
   <summary>Using another device?</summary>
   {(["android","ios","desktop"] as const).filter(id=>id!==state.platform).map(id=>{const g=installationGuide(id,id==="ios"?"safari":"chromium");return <div key={id}><h3>{g.title}</h3><ol>{g.steps.map(step=><li key={step}>{step}</li>)}</ol><p>{g.note}</p></div>})}
  </details>
 </section>;
}
