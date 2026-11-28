"use client";

import {useState} from "react";
import Link from "next/link";
import {StudioPhotoPaint} from "@/components/studio-photo-paint";


import {colourFamilies as families} from "@/modules/studio/colour-families";
import {shadeReference,searchShadeReferences} from "@/modules/studio/shade-reference";

export function ExteriorVisualizer(){
 const [colour,setColour]=useState("#b6c7a3");
 const [family,setFamily]=useState<keyof typeof families>("Greens");
 const [query,setQuery]=useState("");const results=query.trim()?searchShadeReferences(query):[];const shades=query.trim()?results.slice(0,16).map(s=>s.hex.toLowerCase()):families[family];
 return <div className="visualizer-app">
  <header className="visualizer-topbar"><Link href="/design-studio">← Design Studio</Link><strong>Colour Studio</strong></header>
  <div className="visualizer-heading"><h1>Wall colours & signature designs.</h1><p>Explore colours, decorative murals and premium finishes for your walls. Choose a sample room, an exterior section or your own private photo.</p></div>
  <div className="visualizer-layout"><section className="elevation-stage neerva-photo-stage"><StudioPhotoPaint colour={colour} onColourChange={setColour} showReport colourControls={<aside className="visualizer-controls paint-adjacent-controls" aria-label="Live colour controls"><section>
   <h2>Choose your wall colour</h2><p className="paint-pattern-current">{Object.keys(families).length} curated families · {Object.values(families).reduce((n,shades)=>n+shades.length,0)} digital shades</p><label>Find a shade <input className="paint-shade-search" type="search" value={query} maxLength={100} placeholder="Name, HEX or NB code" onChange={e=>setQuery(e.target.value)}/></label><label>Colour family <select value={family} onChange={e=>{setFamily(e.target.value as keyof typeof families);setQuery("")}}>{Object.keys(families).map(name=><option key={name}>{name}</option>)}</select></label>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,margin:"12px 0"}}>{shades.map(hex=><button type="button" key={hex} aria-label={"Select "+hex} title={shadeReference(hex)?.name+" · "+hex.toUpperCase()} aria-pressed={colour===hex} style={{background:hex,minHeight:44,border:colour===hex?"3px solid #254e3d":"1px solid #aaa",borderRadius:8}} onClick={()=>setColour(hex)}/>)}</div>
   {query.trim()&&<p className="paint-pattern-current" role="status">{results.length?results.length>16?"Showing 16 of "+results.length+" matches; refine the search.":results.length+" matching shade(s)":"No curated match. Try an exact HEX or NB code, or use the custom picker."}</p>}
   <label className="paint-custom-shade">Custom shade <span><input type="color" value={colour} onChange={e=>setColour(e.target.value)}/><output>{shadeReference(colour)?.name} · {colour.toUpperCase()}</output></span></label>
   <p className="neerva-tier-note">Choose paint type, sheen and coverage with your dealer; the digital preview is not a verified product finish.</p>
  </section></aside>}/></section></div><section className="paint-next"><div><h2>Ready to compare paint?</h2><p>Explore paint options and request dealer-confirmed pricing and coverage.</p></div><Link href="/materials/paint">Explore paints →</Link></section><section className="paint-next"><div><h2>Planning a commercial building?</h2><p>Choose finishes on your actual generated shop, restaurant, school, mall or rental plan.</p></div><Link href="/design-studio/buildings" prefetch={false}>Building Studio →</Link></section>
 </div>;
}
