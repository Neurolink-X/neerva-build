"use client";

import {useState} from "react";
import Link from "next/link";
import {StudioPhotoPaint} from "@/components/studio-photo-paint";
import {StudioPremiumTools} from "@/components/studio-premium-tools";

import {colourFamilies as families} from "@/modules/studio/colour-families";

export function ExteriorVisualizer(){
 const [colour,setColour]=useState("#b6c7a3");
 const [family,setFamily]=useState<keyof typeof families>("Greens");
 return <div className="visualizer-app">
  <header className="visualizer-topbar"><Link href="/design-studio">← Design Studio</Link><strong>Colour Studio</strong></header>
  <div className="visualizer-heading"><h1>Wall colours & signature designs.</h1><p>Explore colours, decorative murals and premium finishes for your walls. Choose a sample room, an exterior section or your own private photo.</p></div>
  <div className="visualizer-layout"><section className="elevation-stage neerva-photo-stage"><StudioPhotoPaint colour={colour} onColourChange={setColour} colourControls={<aside className="visualizer-controls paint-adjacent-controls" aria-label="Live colour controls"><section>
   <h2>Choose your wall colour</h2><p className="paint-pattern-current">{Object.keys(families).length} curated families · {Object.values(families).reduce((n,shades)=>n+shades.length,0)} digital shades</p><label>Colour family <select value={family} onChange={e=>setFamily(e.target.value as keyof typeof families)}>{Object.keys(families).map(name=><option key={name}>{name}</option>)}</select></label>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,margin:"12px 0"}}>{families[family].map(hex=><button type="button" key={hex} aria-label={"Select "+hex} aria-pressed={colour===hex} style={{background:hex,minHeight:44,border:colour===hex?"3px solid #254e3d":"1px solid #aaa",borderRadius:8}} onClick={()=>setColour(hex)}/>)}</div>
   <label className="paint-custom-shade">Custom shade <span><input type="color" value={colour} onChange={e=>setColour(e.target.value)}/><output>{colour.toUpperCase()}</output></span></label>
   <label className="paint-quality">Paint quality <select defaultValue="Emulsion"><option>Distemper</option><option>Emulsion</option><option>Premium emulsion</option></select></label><p className="neerva-tier-note">Paint quality is a buying preference; digital colour is a shade preview, not a verified product finish.</p>
  </section></aside>}/></section></div><section className="paint-next"><div><h2>Ready to compare paint?</h2><p>Explore paint options and request dealer-confirmed pricing and coverage.</p></div><Link href="/materials/paint">Explore paints →</Link></section><StudioPremiumTools product="colour_studio" base={colour} accent="#c4925f" room="Home colour concept"/><section className="paint-next"><div><h2>Planning a commercial building?</h2><p>Choose finishes on your actual generated shop, restaurant, school, mall or rental plan.</p></div><Link href="/design-studio/buildings" prefetch={false}>Building Studio →</Link></section>
 </div>;
}
