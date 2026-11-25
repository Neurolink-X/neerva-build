"use client";

import {useState} from "react";
import Link from "next/link";
import {StudioPhotoPaint} from "@/components/studio-photo-paint";
import {StudioPremiumTools} from "@/components/studio-premium-tools";

const families = {
  Neutrals: ["#fffaf0","#f4eee5","#e9e5dc","#dfd6c7","#cec3af","#ad9e8b","#827869","#514c47"],
  Greens: ["#edf2db","#d5e1c6","#b6c7a3","#9caf91","#7a917f","#547463","#385446","#293f36"],
  Blues: ["#e0edf1","#c7dce7","#a4c5d0","#86a9c1","#698fa5","#536d8a","#35586d","#263c55"],
  Earth: ["#f5e8cf","#edd2ac","#dfb88d","#ca986f","#b97654","#ad634b","#895644","#704438"],
  Rose: ["#f8ebe7","#ecd3cf","#dcb8b2","#c89999","#b17d86","#946477","#755264","#5c4354"]
};

export function ExteriorVisualizer(){
 const [colour,setColour]=useState("#b6c7a3");
 const [family,setFamily]=useState<keyof typeof families>("Greens");
 return <main className="visualizer-app">
  <header className="visualizer-topbar"><a href="/design-studio">← Design Studio</a><strong>Paint studio</strong></header>
  <div className="visualizer-heading"><h1>Find your home’s next colour.</h1><p>Preview plain paint or add a wall design. Try an entire sample exterior, a selected facade section, or a private photo of your own home.</p></div>
  <div className="visualizer-layout"><section className="elevation-stage neerva-photo-stage"><StudioPhotoPaint colour={colour} onColourChange={setColour} colourControls={<aside className="visualizer-controls paint-adjacent-controls" aria-label="Live colour controls"><section>
   <h2>Choose a colour</h2><label>Colour family <select value={family} onChange={e=>setFamily(e.target.value as keyof typeof families)}>{Object.keys(families).map(name=><option key={name}>{name}</option>)}</select></label>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,margin:"12px 0"}}>{families[family].map(hex=><button type="button" key={hex} aria-label={"Select "+hex} aria-pressed={colour===hex} style={{background:hex,minHeight:44,border:colour===hex?"3px solid #254e3d":"1px solid #aaa",borderRadius:8}} onClick={()=>setColour(hex)}/>)}</div>
   <label className="paint-custom-shade">Custom shade <span><input type="color" value={colour} onChange={e=>setColour(e.target.value)}/><output>{colour.toUpperCase()}</output></span></label>
   <label className="paint-quality">Paint quality <select defaultValue="Emulsion"><option>Distemper</option><option>Emulsion</option><option>Premium emulsion</option></select></label><p className="neerva-tier-note">Paint quality is a buying preference; digital colour is a shade preview, not a verified product finish.</p>
  </section></aside>}/></section></div><section className="paint-next"><div><h2>Ready to compare paint?</h2><p>Explore paint options and request dealer-confirmed pricing and coverage.</p></div><Link href="/materials/paint">Explore paints →</Link></section><StudioPremiumTools product="colour_studio" base={colour} accent="#c4925f" room="Home colour concept"/>
 </main>;
}
