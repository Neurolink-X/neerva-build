"use client";
import {useEffect,useLayoutEffect,useRef,useState} from "react";
import {textureFor,texturePalette} from "@/modules/studio/wall-textures";
import type {Pattern} from "@/modules/studio/wall-patterns";
type Texture={width:number;height:number;values:Uint8Array};
type TextureState=Partial<Record<Pattern,Texture|null>>;
const pending=new Map<Pattern,Promise<Texture|null>>();
function loadTexture(key:Pattern){
 const old=pending.get(key);if(old)return old;
 const meta=textureFor(key);if(!meta)return Promise.resolve(null);
 const promise=new Promise<Texture|null>(resolve=>{
  const img=new Image();let settled=false;
  const done=(value:Texture|null)=>{if(settled)return;settled=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(value);};
  const timer=window.setTimeout(()=>done(null),8000);
  img.onerror=()=>done(null);
  img.onload=()=>{try{
   if(img.naturalWidth!==meta.width||img.naturalHeight!==meta.height){done(null);return;}
   const [u,v,w,h]=meta.crop??[0,0,1,1],c=document.createElement("canvas");
   c.width=Math.round(meta.width*w);c.height=Math.round(meta.height*h);
   const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx){done(null);return;}
   ctx.drawImage(img,u*meta.width,v*meta.height,w*meta.width,h*meta.height,0,0,c.width,c.height);
   const pixels=ctx.getImageData(0,0,c.width,c.height).data,values=new Uint8Array(c.width*c.height);
   for(let j=0;j<values.length;j++)values[j]=pixels[j*4];done({width:c.width,height:c.height,values});
  }catch{done(null);}};
  img.src=meta.src;
 });
 pending.set(key,promise);void promise.then(value=>{if(!value&&pending.get(key)===promise)pending.delete(key);});return promise;
}
/** Only current collection and already applied designs are requested. Eight
 * fixed local assets bound the cache; no stale photo or user data is stored. */
export function useWallTextures(keys:string){
 const [textures,setTextures]=useState<TextureState>({});
 useEffect(()=>{let cancelled=false;for(const key of keys.split(",") as Pattern[]){if(!textureFor(key))continue;void loadTexture(key).then(value=>{if(!cancelled)setTextures(old=>old[key]===value?old:{...old,[key]:value});});}return()=>{cancelled=true};},[keys]);
 return textures;
}
export function colouredTexture(texture:Texture,base:string,accent:string,maxSide=960){
 const canvas=document.createElement("canvas"),scale=Math.min(1,maxSide/Math.max(texture.width,texture.height));canvas.width=Math.max(1,Math.round(texture.width*scale));canvas.height=Math.max(1,Math.round(texture.height*scale));
 const ctx=canvas.getContext("2d");if(!ctx)return canvas;
 const img=ctx.createImageData(canvas.width,canvas.height),palette=texturePalette(base,accent);
 for(let y=0,j=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++,j++){const k=Math.min(texture.height-1,Math.floor(y/scale))*texture.width+Math.min(texture.width-1,Math.floor(x/scale));const rgb=palette[texture.values[k]],i=j*4;img.data[i]=rgb[0];img.data[i+1]=rgb[1];img.data[i+2]=rgb[2];img.data[i+3]=255;}
 ctx.putImageData(img,0,0);return canvas;
}
export function WallTextureSwatch({texture,base,accent,intensity}:{texture:Texture;base:string;accent:string;intensity:number}){
 const ref=useRef<SVGImageElement>(null);
 useLayoutEffect(()=>{const c=colouredTexture(texture,base,accent,280);ref.current?.setAttribute("href",c.toDataURL("image/png"));},[texture,base,accent]);
 return <svg viewBox="0 0 150 100" className="paint-texture-swatch" aria-hidden="true"><rect width="150" height="100" fill={base}/><image ref={ref} width="150" height="100" preserveAspectRatio="xMidYMid meet" opacity={intensity}/></svg>;
}
type Point={x:number;y:number};
/** Two clipped affine triangles share the same wall diagonal. This is a
 * bounded photo projection, not a physical relief mesh or a ray tracer. */
export function drawTextureQuad(ctx:CanvasRenderingContext2D,source:HTMLCanvasElement,a:Point,b:Point,c:Point,d:Point){
 const triangle=(p:Point,q:Point,r:Point,flip:boolean)=>{
  ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.clip();
  const w=source.width,h=source.height;
  if(!flip)ctx.transform((q.x-p.x)/w,(q.y-p.y)/w,(r.x-q.x)/h,(r.y-q.y)/h,p.x,p.y);
  else ctx.transform((q.x-r.x)/w,(q.y-r.y)/w,(r.x-p.x)/h,(r.y-p.y)/h,p.x,p.y);
  ctx.drawImage(source,0,0);ctx.restore();
 };
 triangle(a,b,c,false);triangle(a,c,d,true);
}
