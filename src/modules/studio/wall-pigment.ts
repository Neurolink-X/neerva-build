import type {Motif} from "./wall-patterns.ts";
import {artworkShade} from "./premium-wall-art.ts";
const rgb=(s:string)=>/^#[0-9a-f]{6}$/i.test(s)?[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)):[160,160,160];
/** One pigment recipe for both SVG swatches and the photo canvas. */
export function motifPigment(m:Motif,base:string,accent:string){
 const b=rgb(base),a=rgb(accent),p=Math.max(0,Math.min(1,m.pigment??1));
 const c="#"+b.map((v,i)=>Math.round(v+(a[i]-v)*p).toString(16).padStart(2,"0")).join("");
 return artworkShade(c,m.tone??0);
}
export function motifStops(m:Motif,base:string,accent:string):readonly [number,string][]{
 const c=motifPigment(m,base,accent);
 if(m.finish==="metal")return [[0,artworkShade(c,-.35)],[.30,artworkShade(c,.46)],[.52,c],[.80,artworkShade(c,-.30)],[1,artworkShade(c,.22)]];
 if(m.finish==="bevel")return [[0,artworkShade(c,.38)],[.22,artworkShade(c,.13)],[.65,c],[1,artworkShade(c,-.37)]];
 return [[0,artworkShade(c,.11)],[.54,c],[1,artworkShade(c,-.14)]];
}
