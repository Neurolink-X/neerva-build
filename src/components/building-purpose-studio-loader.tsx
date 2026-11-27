"use client";
import dynamic from "next/dynamic";
/** The interactive geometry workspace contains browser-specific SVG and form
 * rendering. Keep it in a client-only island while the route, navigation,
 * metadata and meaningful loading shell remain server-rendered. */
const Studio=dynamic(()=>import("./building-purpose-studio").then(m=>m.BuildingPurposeStudio),{ssr:false,loading:()=> <section className="purpose-studio" aria-busy="true" aria-label="Building studio loading"><header><span className="eyebrow">NEERVA BUILDING STUDIO</span><h1>Plan beyond your home.</h1><p role="status">Preparing the interactive building planner…</p></header></section>});
export function BuildingPurposeStudioLoader({cloudEnabled}:{cloudEnabled:boolean}){
 return <Studio cloudEnabled={cloudEnabled}/>;
}
