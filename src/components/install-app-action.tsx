"use client";
import {useState} from "react";
import Link from "next/link";
import {usePwaInstall,requestPwaInstall} from "@/components/pwa-install";
const guides={android:{title:"Android · Chrome",steps:["Open Neerva in Chrome.","Tap the three-dot menu.","Choose Install app or Add to Home screen."]},ios:{title:"iPhone / iPad · Safari",steps:["Open Neerva in Safari.","Tap Share.","Choose Add to Home Screen and confirm."]},desktop:{title:"Computer · Chrome or Edge",steps:["Open Neerva in your browser.","Look for the install icon or open the browser menu.","Choose Install when available."]}};
export function InstallAppAction(){
 const state=usePwaInstall(),[message,setMessage]=useState("");
 if(!state.ready)return <section className="install-action" aria-busy="true">Checking your device…</section>;
 if(state.installed)return <section className="install-action"><h2>Neerva is ready to use</h2><p role="status">The app is already installed on this device.</p><Link className="install-primary" href="/">Open Neerva</Link></section>;
 const guide=guides[state.platform];
 return <section className="install-action"><h2>Get Neerva on your device</h2><p>Free home-screen access. No app-store download needed.</p>{state.available&&<button disabled={state.busy} onClick={async()=>{const result=await requestPwaInstall();setMessage(result==="dismissed"?"Installation cancelled. You can try again from your browser menu.":result==="unavailable"?"Use the steps below to install.":"Installation accepted.");}}>{state.busy?"Opening…":"Install Neerva"}</button>}<h3>{guide.title}</h3><ol>{guide.steps.map(step=><li key={step}>{step}</li>)}</ol><details><summary>Using another device?</summary>{Object.entries(guides).filter(([id])=>id!==state.platform).map(([id,g])=><div key={id}><h3>{g.title}</h3><ol>{g.steps.map(step=><li key={step}>{step}</li>)}</ol></div>)}</details>{message&&<p role="status">{message}</p>}</section>;
}
