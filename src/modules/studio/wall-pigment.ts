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
 if(m.finish==="bevel")return [[0,artworkShade(c,.58)],[.09,artworkShade(c,.39)],[.30,artworkShade(c,.14)],[.56,c],[.78,artworkShade(c,-.24)],[.94,artworkShade(c,-.49)],[1,artworkShade(c,-.34)]];
 return [[0,artworkShade(c,.18)],[.27,artworkShade(c,.07)],[.60,c],[1,artworkShade(c,-.19)]];
}
