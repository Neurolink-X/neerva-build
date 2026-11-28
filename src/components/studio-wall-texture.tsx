"use client";
import {wallProjector,wallProjectionGrid} from "@/modules/studio/wall-projective";
import {memo,useEffect,useLayoutEffect,useRef,useState} from "react";
import {textureFor,texturePalette,paintTexturePalette,wallTextureFrame,hasWallRaster} from "@/modules/studio/wall-textures";
import type {Pattern} from "@/modules/studio/wall-patterns";
import {isPracticalPaintArt} from "@/modules/studio/practical-paint-art";
import {generateWallRasterCooperative,isGeneratedWallPattern} from "@/modules/studio/generated-wall-raster";
type Texture={width:number;height:number;values:Uint8Array;paintPigments?:boolean};
type TextureState=Partial<Record<Pattern,Texture|null>>;
// Share one in-flight request per design; keep only recently used decoded rasters.
const pending=new Map<string,Promise<Texture|null>>();
const decoded=new Map<string,Texture>();
const cacheLimit=16;
function loadTexture(key:Pattern,thumbnail=false):Promise<Texture|null>{
 const meta=textureFor(key),cacheKey=key+(thumbnail&&!meta?":thumb":"");
 const cached=decoded.get(cacheKey);
 if(cached){decoded.delete(cacheKey);decoded.set(cacheKey,cached);return Promise.resolve(cached);}
 const old=pending.get(cacheKey);if(old)return old;
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
 else if(isGeneratedWallPattern(key)){
  const compact=window.innerWidth<600||navigator.hardwareConcurrency<=4;
  const width=thumbnail?240:compact?480:600,height=thumbnail?160:compact?320:400;
  promise=generateWallRasterCooperative(key,width,height,()=>new Promise(resolve=>window.setTimeout(resolve,0))).then(r=>({...r,paintPigments:isPracticalPaintArt(key)})).catch(()=>null);
 }
 else return Promise.resolve(null);
 pending.set(cacheKey,promise);
 void promise.then(value=>{
  pending.delete(cacheKey);
  if(value){decoded.set(cacheKey,value);while(decoded.size>cacheLimit){const first=decoded.keys().next().value;if(first===undefined)break;decoded.delete(first);}}
 });
 return promise;
}
/** Selected and applied walls take priority. Only the current category is
 * loaded, with at most three active tasks per view and a bounded shared cache. */
export function useWallTextures(keys:string,concurrency=3,thumbnail=false){
 const [textures,setTextures]=useState<TextureState>({});
 useEffect(()=>{
  let cancelled=false;
  const wanted=(keys.split(",") as Pattern[]).filter(hasWallRaster);
  let cursor=0;
  const worker=async()=>{
   while(!cancelled&&cursor<wanted.length){
    const key=wanted[cursor++],value=await loadTexture(key,thumbnail);
    if(!cancelled)setTextures(old=>old[key]===value?old:{...old,[key]:value});
   }
  };
  void Promise.resolve().then(()=>{
   if(cancelled)return;
   setTextures(old=>{const entries=Object.entries(old);return entries.every(([k])=>wanted.includes(k as Pattern))?old:Object.fromEntries(entries.filter(([k])=>wanted.includes(k as Pattern)));});
   for(let i=0;i<Math.min(concurrency,wanted.length);i++)void worker();
  });
  return()=>{cancelled=true;};
 },[keys,concurrency,thumbnail]);
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
export const WallTextureSwatch=memo(function WallTextureSwatch({texture,base,accent,intensity,detail=false,preserveComposition=false}:{texture:Texture;base:string;accent:string;intensity:number;detail?:boolean;preserveComposition?:boolean}){
 const ref=useRef<SVGImageElement>(null);
 useLayoutEffect(()=>{const c=colouredTexture(texture,base,accent,detail?960:220);
 // Only pigment changes regenerate the small swatch; intensity is SVG opacity.
 const target=ref.current;let cancelled=false,uri:string|undefined; c.toBlob(blob=>{c.width=0;c.height=0;if(cancelled||!blob||!target)return;uri=URL.createObjectURL(blob);target.setAttribute("href",uri);},"image/webp",.82);
 return()=>{cancelled=true;if(uri)URL.revokeObjectURL(uri);};
 },[texture,base,accent,detail]);
 return <svg viewBox="0 0 150 100" className="paint-texture-swatch" aria-hidden="true"><rect width="150" height="100" fill={base}/><image ref={ref} width="150" height="100" preserveAspectRatio={texture.paintPigments||detail||preserveComposition?"none":"xMidYMid slice"} opacity={intensity}/></svg>;
});
type Point={x:number;y:number};
/** Adaptive projective mesh: flat walls stay cheap; oblique walls preserve
 * continuous geometry and avoid the former visible diagonal kink. */
export function drawTextureQuad(ctx:CanvasRenderingContext2D,source:HTMLCanvasElement,a:Point,b:Point,c:Point,d:Point,preserveComposition=false){
 const length=(p:Point,q:Point)=>Math.hypot(p.x-q.x,p.y-q.y);
 const aspect=(length(a,b)+length(d,c))/Math.max(1,length(a,d)+length(b,c));
 const [u,v,cw,ch]=wallTextureFrame(source.width,source.height,aspect,preserveComposition);
 const project=wallProjector(a,b,c,d),n=wallProjectionGrid(a,b,c,d),w=source.width,h=source.height;
 const triangle=(p:Point,q:Point,r:Point,flip:boolean,i:number,j:number)=>{
  // Draw opaque texture into overlapping clips, then the caller applies
  // intensity once. Subpixel overlaps avoid antialiasing hairlines.
  const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};
  const edge=(z:Point)=>{const dx=z.x-center.x,dy=z.y-center.y,len=Math.hypot(dx,dy)||1;return {x:z.x+dx/len*.7,y:z.y+dy/len*.7}};
  const [pp,qq,rr]=[p,q,r].map(edge);
  ctx.save();ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(qq.x,qq.y);ctx.lineTo(rr.x,rr.y);ctx.closePath();ctx.clip();
  const tx=flip?q.x-r.x:q.x-p.x,ty=flip?q.y-r.y:q.y-p.y,ux=flip?r.x-p.x:r.x-q.x,uy=flip?r.y-p.y:r.y-q.y;
  ctx.transform(tx*n/w,ty*n/w,ux*n/h,uy*n/h,p.x-tx*i-ux*j,p.y-ty*i-uy*j);
  ctx.drawImage(source,u*w,v*h,cw*w,ch*h,0,0,w,h);ctx.restore();
 };
 ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.clip();
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=project(i/n,j/n),q=project((i+1)/n,j/n),r=project((i+1)/n,(j+1)/n),s=project(i/n,(j+1)/n);triangle(p,q,r,false,i,j);triangle(p,r,s,true,i,j);}
 ctx.restore();
}
