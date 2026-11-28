import {premiumRasterNames,isPremiumRaster,premiumRasterShade,type PremiumRasterPattern} from "./premium-wall-raster.ts";
import {practicalPaintNames,isPracticalPaintArt,practicalPaintShade} from "./practical-paint-art.ts";
import type {Pattern} from "./wall-patterns.ts";
/** Original offline optical material studies. Height-field shading is a
 * two-dimensional preview of relief, not actual sculpted geometry. */
const originalGeneratedWallPatterns=["sculptFlute","sculptDiamond","sculptReed","sculptStone","sculptPrism","oceanCliffs","desertDunes","citySilhouette"] as const satisfies readonly Pattern[];
export const generatedWallPatterns=[...new Set([...originalGeneratedWallPatterns,...Object.keys(premiumRasterNames) as PremiumRasterPattern[],...Object.keys(practicalPaintNames) as (keyof typeof practicalPaintNames)[]])];
type GeneratedPattern=typeof generatedWallPatterns[number];
export function isGeneratedWallPattern(key:Pattern):key is GeneratedPattern{return (generatedWallPatterns as readonly Pattern[]).includes(key);}
const clamp=(v:number,min=0,max=1)=>Math.min(max,Math.max(min,v));
const fract=(v:number)=>v-Math.floor(v);
const tau=Math.PI*2;
function height(key:GeneratedPattern,x:number,y:number){
 const soft=(t:number)=>.5-.5*Math.cos(t*tau),diamond=(a:number,b:number)=>Math.max(0,1-Math.abs(fract(a)-.5)*2-Math.abs(fract(b)-.5)*2);
 switch(key){
 case "sculptFlute":return Math.pow(soft(x*9+.18*Math.sin(y*3)),.62)*.055;
 case "sculptReed":return Math.pow(soft(x*18+.07*Math.sin(y*6)),.85)*.031*(.9+.1*Math.sin(y*9+x*7));
 case "sculptDiamond":return Math.pow(diamond(x*5+y*2.8,x*5-y*2.8),.65)*.13;
 case "sculptPrism":{const u=fract(x*5),v=fract(y*3.3),tip=Math.floor(x*5+y*3.3)%2?.32:.68;return .16*Math.max(0,Math.min(u/tip,(1-u)/(1-tip),v*2,(1-v)*2));}
 case "sculptStone":{const flow=x*6+.40*Math.sin(y*5+x*3)+.17*Math.sin(y*12-x*4);return .13*Math.pow(soft(flow),.63)+.009*Math.sin(x*63+y*26)*Math.sin(y*45-x*17);}
 default:return 0;
 }
}
export type GeneratedWallRaster={width:number;height:number;values:Uint8Array};
/** Bounded raster and deterministic local directional lighting; no random,
 * remote images, per-frame mesh or runtime graphics dependencies. */
function* rasterRows(key:GeneratedPattern,width=600,heightPx=400):Generator<void,GeneratedWallRaster>{
 width=Math.max(16,Math.min(720,Math.floor(width)));heightPx=Math.max(16,Math.min(480,Math.floor(heightPx)));const values=new Uint8Array(width*heightPx);
 if(isPracticalPaintArt(key)||isPremiumRaster(key)){const shade=isPracticalPaintArt(key)?(x:number,y:number)=>practicalPaintShade(key,x,y):isPremiumRaster(key)?(x:number,y:number)=>premiumRasterShade(key,x,y):()=>.5;for(let y=0,j=0;y<heightPx;y++){for(let x=0;x<width;x++,j++)values[j]=Math.round(shade(x/(width-1),y/(heightPx-1))*255);yield;}return {width,height:heightPx,values};}
 const relief=key.startsWith("sculpt"),heights=relief?new Float32Array(width*heightPx):null;
 if(heights)for(let y=0,j=0;y<heightPx;y++){for(let x=0;x<width;x++,j++)heights[j]=height(key,x/(width-1),y/(heightPx-1));yield;}
 for(let y=0,j=0;y<heightPx;y++){for(let x=0;x<width;x++,j++){
  const grain=(((Math.imul(x+1,73856093)^Math.imul(y+1,19349663))>>>0)%257)/128-1;let shade;
  if(heights){const dx=(heights[y*width+Math.min(width-1,x+1)]-heights[y*width+Math.max(0,x-1)])*width*.5,dy=(heights[Math.min(heightPx-1,y+1)*width+x]-heights[Math.max(0,y-1)*width+x])*heightPx*.5;
   const normal=Math.hypot(dx,dy,1),light=clamp((.59*dx+.48*dy+.65)/normal);shade=.23+light*.66+.09*clamp(heights[j]*5);
  }else shade=.5;
  values[j]=Math.round(clamp(shade+grain*.017)*255);
 }yield;}return {width,height:heightPx,values};
}
export function generateWallRaster(key:GeneratedPattern,width=600,heightPx=400):GeneratedWallRaster{const rows=rasterRows(key,width,heightPx);let step=rows.next();while(!step.done)step=rows.next();return step.value;}
export async function generateWallRasterCooperative(key:GeneratedPattern,width:number,heightPx:number,yieldControl:()=>Promise<void>,now:()=>number=()=>performance.now()):Promise<GeneratedWallRaster>{const rows=rasterRows(key,width,heightPx);let start=now(),step=rows.next();while(!step.done){if(now()-start>=5){await yieldControl();start=now();}step=rows.next();}return step.value;}

/** Yield between short row batches on the browser main thread. The output is identical
 * to synchronous generation; callers can keep interactive paint controls responsive. */
export async function generatePracticalRaster(key:Parameters<typeof practicalPaintShade>[0],width:number,heightPx:number,yieldControl:()=>Promise<void>,now:()=>number=()=>performance.now()):Promise<GeneratedWallRaster>{
 width=Math.max(16,Math.min(720,Math.floor(width)));heightPx=Math.max(16,Math.min(480,Math.floor(heightPx)));const values=new Uint8Array(width*heightPx);let start=now();
 for(let y=0,j=0;y<heightPx;y++){for(let x=0;x<width;x++,j++)values[j]=Math.round(practicalPaintShade(key,x/(width-1),y/(heightPx-1))*255);if(y<heightPx-1&&now()-start>=6){await yieldControl();start=now();}}
 return {width,height:heightPx,values};
}
