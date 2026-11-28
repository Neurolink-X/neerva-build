"use client";
import {memo,useEffect,useLayoutEffect,useRef,useState} from "react";
import {textureFor,texturePalette,paintTexturePalette,wallTextureFrame,hasWallRaster} from "@/modules/studio/wall-textures";
import type {Pattern} from "@/modules/studio/wall-patterns";
import {isPracticalPaintArt} from "@/modules/studio/practical-paint-art";
import {isPremiumRaster} from "@/modules/studio/premium-wall-raster";
import {generateWallRaster,isGeneratedWallPattern,generatePracticalRaster} from "@/modules/studio/generated-wall-raster";
type Texture={width:number;height:number;values:Uint8Array;paintPigments?:boolean};
type TextureState=Partial<Record<Pattern,Texture|null>>;
// Share one in-flight request per design; keep only recently used decoded rasters.
const pending=new Map<Pattern,Promise<Texture|null>>();
const decoded=new Map<Pattern,Texture>();
const cacheLimit=16;
function loadTexture(key:Pattern):Promise<Texture|null>{
 const cached=decoded.get(key);
 if(cached){decoded.delete(key);decoded.set(key,cached);return Promise.resolve(cached);}
 const old=pending.get(key);if(old)return old;
 const meta=textureFor(key);
 // A real local image is preferred over its procedural substitute.
 let promise:Promise<Texture|null>;
 if(meta)promise=new Promise<Texture|null>(resolve=>{
  const img=new Image();img.decoding="async";let settled=false;
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
   for(let j=0;j<values.length;j++)values[j]=pixels[j*4];
   const result={width:c.width,height:c.height,values};c.width=0;c.height=0;done(result);
  }catch{done(null);}};
  img.src=meta.src;
 });
 else if(isPracticalPaintArt(key)){
  const compact=window.innerWidth<600||navigator.hardwareConcurrency<=4;
  promise=generatePracticalRaster(key,compact?480:600,compact?320:400,()=>new Promise(resolve=>window.setTimeout(resolve,0))).then(r=>({...r,paintPigments:true})).catch(()=>null);
 }
 else if(isGeneratedWallPattern(key))promise=new Promise(resolve=>{
  window.setTimeout(()=>{try{resolve(generateWallRaster(key,isPremiumRaster(key)?360:600,isPremiumRaster(key)?240:400));}catch{resolve(null);}},0);
 });
 else return Promise.resolve(null);
 pending.set(key,promise);
 void promise.then(value=>{
  pending.delete(key);
  if(value){decoded.set(key,value);while(decoded.size>cacheLimit){const first=decoded.keys().next().value;if(first===undefined)break;decoded.delete(first);}}
 });
 return promise;
}
/** Selected and applied walls take priority. Only the current category is
 * loaded, with at most three active tasks per view and a bounded shared cache. */
export function useWallTextures(keys:string){
 const [textures,setTextures]=useState<TextureState>({});
 useEffect(()=>{
  let cancelled=false;
  const wanted=(keys.split(",") as Pattern[]).filter(hasWallRaster);
  let cursor=0;
  const worker=async()=>{
   while(!cancelled&&cursor<wanted.length){
    const key=wanted[cursor++],value=await loadTexture(key);
    if(!cancelled)setTextures(old=>old[key]===value?old:{...old,[key]:value});
   }
  };
  void Promise.resolve().then(()=>{
   if(cancelled)return;
   setTextures(old=>{const entries=Object.entries(old);return entries.every(([k])=>wanted.includes(k as Pattern))?old:Object.fromEntries(entries.filter(([k])=>wanted.includes(k as Pattern)));});
   for(let i=0;i<Math.min(3,wanted.length);i++)void worker();
  });
  return()=>{cancelled=true;};
 },[keys]);
 return textures;
}
export function colouredTexture(texture:Texture,base:string,accent:string,maxSide=960){
 const canvas=document.createElement("canvas"),scale=Math.min(1,maxSide/Math.max(texture.width,texture.height));canvas.width=Math.max(1,Math.round(texture.width*scale));canvas.height=Math.max(1,Math.round(texture.height*scale));
 const ctx=canvas.getContext("2d");if(!ctx)return canvas;
 const img=ctx.createImageData(canvas.width,canvas.height),palette=(texture.paintPigments?paintTexturePalette:texturePalette)(base,accent);
 const columns=Array.from({length:canvas.width},(_,x)=>Math.min(texture.width-1,Math.floor(x/scale)));
 for(let y=0,j=0;y<canvas.height;y++){const row=Math.min(texture.height-1,Math.floor(y/scale))*texture.width;for(let x=0;x<canvas.width;x++,j++){const k=row+columns[x];const rgb=palette[texture.values[k]],i=j*4;img.data[i]=rgb[0];img.data[i+1]=rgb[1];img.data[i+2]=rgb[2];img.data[i+3]=255;}}
 ctx.putImageData(img,0,0);return canvas;
}
export const WallTextureSwatch=memo(function WallTextureSwatch({texture,base,accent,intensity}:{texture:Texture;base:string;accent:string;intensity:number}){
 const ref=useRef<SVGImageElement>(null);
 useLayoutEffect(()=>{const c=colouredTexture(texture,base,accent,220);
 // Only pigment changes regenerate the small swatch; intensity is SVG opacity.
 ref.current?.setAttribute("href",c.toDataURL("image/webp",.82));c.width=0;c.height=0;
 },[texture,base,accent]);
 return <svg viewBox="0 0 150 100" className="paint-texture-swatch" aria-hidden="true"><rect width="150" height="100" fill={base}/><image ref={ref} width="150" height="100" preserveAspectRatio={texture.paintPigments?"none":"xMidYMid slice"} opacity={intensity}/></svg>;
});
type Point={x:number;y:number};
/** Two clipped affine triangles share the same wall diagonal. This is a
 * bounded photo projection, not a physical relief mesh or a ray tracer. */
export function drawTextureQuad(ctx:CanvasRenderingContext2D,source:HTMLCanvasElement,a:Point,b:Point,c:Point,d:Point,preserveComposition=false){
 const length=(p:Point,q:Point)=>Math.hypot(p.x-q.x,p.y-q.y);
 const aspect=(length(a,b)+length(d,c))/Math.max(1,length(a,d)+length(b,c));
 const [u,v,cw,ch]=wallTextureFrame(source.width,source.height,aspect,preserveComposition);
 const triangle=(p:Point,q:Point,r:Point,flip:boolean)=>{
  ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.clip();
  const w=source.width,h=source.height;
  if(!flip)ctx.transform((q.x-p.x)/w,(q.y-p.y)/w,(r.x-q.x)/h,(r.y-q.y)/h,p.x,p.y);
  else ctx.transform((q.x-r.x)/w,(q.y-r.y)/w,(r.x-p.x)/h,(r.y-p.y)/h,p.x,p.y);
  ctx.drawImage(source,u*w,v*h,cw*w,ch*h,0,0,w,h);ctx.restore();
 };
 triangle(a,b,c,false);triangle(a,c,d,true);
}
