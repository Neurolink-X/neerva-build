"use client";
import {useId,useLayoutEffect,useRef} from "react";
import {buildSurfaceTile,SURFACE_TILE_SIZE,type SurfaceProfile} from "@/modules/studio/surface-texture";
type Tile={canvas:HTMLCanvasElement;url?:string};
const cache=new Map<SurfaceProfile,Tile>();
/** The same alpha map is used in the swatch and wall preview. The bounded cache
 * stores only 160px local textures, never a user's photo. */
export function surfaceCanvas(profile:SurfaceProfile){
 const hit=cache.get(profile);if(hit)return hit.canvas;
 const canvas=document.createElement("canvas");canvas.width=canvas.height=SURFACE_TILE_SIZE;
 const ctx=canvas.getContext("2d");if(!ctx)return null;
 const pixels=ctx.createImageData(SURFACE_TILE_SIZE,SURFACE_TILE_SIZE);pixels.data.set(buildSurfaceTile(profile));ctx.putImageData(pixels,0,0);
 if(cache.size>=12){const first=cache.keys().next().value;if(first!==undefined)cache.delete(first);}
 cache.set(profile,{canvas});return canvas;
}
export function StudioSurfaceSwatch({profile,base,accent}:{profile:SurfaceProfile;base:string;accent:string}){
 const id=useId(),image=useRef<SVGImageElement>(null);
 useLayoutEffect(()=>{const tile=surfaceCanvas(profile),cached=cache.get(profile);if(!tile||!cached||!image.current)return;cached.url??=tile.toDataURL("image/png");image.current.setAttribute("href",cached.url);},[profile]);
 return <svg viewBox="0 0 150 100" aria-hidden="true" className="paint-surface-swatch" data-surface-profile={profile}>
  <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="150" height="100" style={{maskType:"alpha"}}><image ref={image} x="0" y="0" width="150" height="100" preserveAspectRatio="none"/></mask></defs>
  <rect width="150" height="100" fill={base}/><rect width="150" height="100" fill={accent} mask={"url(#"+id+")"}/>
 </svg>;
}
