"use client";
import {useId} from "react";
import {artworkMotifs,type Pattern} from "@/modules/studio/wall-patterns";
import {motifPigment,motifStops} from "@/modules/studio/wall-pigment";
export function WallArtworkSwatch({pattern,base,accent,intensity}:{pattern:Pattern;base:string;accent:string;intensity:number}){
 const id=useId(),motifs=artworkMotifs(pattern);
 // Deduplicate gradients across repeating tiles and stencils.
 const gradients=new Map<string,{id:string;stops:ReturnType<typeof motifStops>}>();
 const items=motifs.map(m=>{const color=motifPigment(m,base,accent);if(!m.filled||!m.finish)return {m,color};
 const stops=motifStops(m,base,accent),key=JSON.stringify(stops);let gradient=gradients.get(key);if(!gradient){gradient={id:id+"-"+gradients.size,stops};gradients.set(key,gradient);}return {m,color:"url(#"+gradient.id+")"};});
 return <svg viewBox="0 0 150 100" aria-hidden="true" style={{background:base}}><defs>{[...gradients.values()].map(g=><linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="100%">{g.stops.map(([offset,color])=><stop key={offset} offset={offset} stopColor={color}/>)}</linearGradient>)}</defs><g opacity={intensity}>{items.map(({m,color},i)=><polyline key={i} points={m.points.map(([x,y])=>[x*150,y*100].join(",")).join(" ")} fill={m.filled?color:"none"} stroke={m.filled?"none":color} opacity={m.alpha??1} strokeWidth={.9*(m.weight??1)} strokeLinecap="round" strokeLinejoin="round"/>)}</g></svg>;
}
