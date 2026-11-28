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
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
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
function landscape(key:GeneratedPattern,x:number,y:number){
 if(key==="desertDunes"){
  let shade=.81-.14*y+.045*Math.sin(x*3+y*2);
  const sun=Math.hypot((x-.75)*1.5,y-.22);shade+=.13*(1-smooth((sun-.105)/.012));
  for(let i=0;i<5;i++){const h=.39+i*.128+.075*Math.sin(x*5+i*1.32)+.032*Math.sin(x*12+i*.9);if(y<h)continue;
   const t=y-h;shade=.68-i*.08+.18*Math.exp(-t*19)-.095*Math.cos(x*8+i*1.17)*Math.exp(-t*7)+.018*Math.sin(t*180+x*21+i)*smooth(t*28);}
  return shade;
 }
 if(key==="oceanCliffs"){
  const coastL=.20+.085*Math.sin(y*9+.4)+.025*Math.sin(y*23)+.009*Math.sin(y*57),coastR=.86+.065*Math.sin(y*8+1.9)+.018*Math.sin(y*24)+.007*Math.cos(y*67);
  if(y<.34){const sun=Math.hypot((x-.61)*1.5,y-.15);return .76-.20*y+.16*(1-smooth((sun-.075)/.02));}
  const depth=(y-.34)/.66,water=.25+.46*(1-depth)+.045*Math.sin(y*90+Math.sin(x*14)*1.8)+.035*Math.cos(x*22-y*24)+.025*Math.sin(y*145+x*31)*Math.sin(x*43-y*12);
  if(x>coastL&&x<coastR){const distance=Math.min(x-coastL,coastR-x);const surf=.23*Math.exp(-distance*100)*(.6+.4*Math.sin(y*105+x*15))+.12*Math.exp(-Math.pow((distance-.028-.008*Math.sin(y*40))/.012,2));return water+surf;}
  const cliff=x<=coastL?coastL-x:x-coastR;return .23+.32*smooth(cliff*11)+.12*Math.sin(y*29+x*21)+.07*Math.sin(y*81+x*38)+.045*Math.cos(x*100-y*23)+.025*Math.sin(x*173+y*137);
 }
 let sky=.73-.22*y+.07*Math.cos(x*3);const moon=Math.hypot((x-.79)*1.5,y-.16);sky+=.19*(1-smooth((moon-.065)/.008));
 for(let row=0;row<3;row++){const n=12-row*2,i=Math.min(n-1,Math.floor(x*n)),u=fract(x*n),seed=fract(Math.sin((i+1)*53.19+row*18.13)*43758.5453);
  const base=.74+row*.085,top=base-(.13+seed*.24+row*.045);if(y<top||y>base+.12||u<.065||u>.935)continue;
  const windowX=fract(u*4),windowY=fract((y-top)*32);const lit=windowX>.18&&windowX<.57&&windowY>.22&&windowY<.59&&fract(Math.sin(i*9+Math.floor(u*4)*7+Math.floor((y-top)*32)*11)*67)>.33;
  sky=.36-row*.075+(u<.2?.11:0)+(lit?.32:0);
 }return sky;
}
export type GeneratedWallRaster={width:number;height:number;values:Uint8Array};
/** Bounded raster and deterministic local directional lighting; no random,
 * remote images, per-frame mesh or runtime graphics dependencies. */
export function generateWallRaster(key:GeneratedPattern,width=600,heightPx=400):GeneratedWallRaster{
 width=Math.max(16,Math.min(720,Math.floor(width)));heightPx=Math.max(16,Math.min(480,Math.floor(heightPx)));const values=new Uint8Array(width*heightPx);
 if(isPracticalPaintArt(key)||isPremiumRaster(key)){const shade=isPracticalPaintArt(key)?(x:number,y:number)=>practicalPaintShade(key,x,y):isPremiumRaster(key)?(x:number,y:number)=>premiumRasterShade(key,x,y):()=>.5;for(let y=0,j=0;y<heightPx;y++)for(let x=0;x<width;x++,j++)values[j]=Math.round(shade(x/(width-1),y/(heightPx-1))*255);return {width,height:heightPx,values};}
 const relief=key.startsWith("sculpt"),heights=relief?new Float32Array(width*heightPx):null;
 if(heights)for(let y=0,j=0;y<heightPx;y++)for(let x=0;x<width;x++,j++)heights[j]=height(key,x/(width-1),y/(heightPx-1));
 for(let y=0,j=0;y<heightPx;y++)for(let x=0;x<width;x++,j++){
  const u=x/(width-1),v=y/(heightPx-1),grain=(((Math.imul(x+1,73856093)^Math.imul(y+1,19349663))>>>0)%257)/128-1;let shade;
  if(heights){const dx=(heights[y*width+Math.min(width-1,x+1)]-heights[y*width+Math.max(0,x-1)])*width*.5,dy=(heights[Math.min(heightPx-1,y+1)*width+x]-heights[Math.max(0,y-1)*width+x])*heightPx*.5;
   const normal=Math.hypot(dx,dy,1),light=clamp((.59*dx+.48*dy+.65)/normal);shade=.23+light*.66+.09*clamp(heights[j]*5);
  }else shade=landscape(key,u,v);
  values[j]=Math.round(clamp(shade+grain*.017)*255);
 }return {width,height:heightPx,values};
}

/** Yield between short row batches on the browser main thread. The output is identical
 * to synchronous generation; callers can keep interactive paint controls responsive. */
export async function generatePracticalRaster(key:Parameters<typeof practicalPaintShade>[0],width:number,heightPx:number,yieldControl:()=>Promise<void>,now:()=>number=()=>performance.now()):Promise<GeneratedWallRaster>{
 width=Math.max(16,Math.min(720,Math.floor(width)));heightPx=Math.max(16,Math.min(480,Math.floor(heightPx)));const values=new Uint8Array(width*heightPx);let start=now();
 for(let y=0,j=0;y<heightPx;y++){for(let x=0;x<width;x++,j++)values[j]=Math.round(practicalPaintShade(key,x/(width-1),y/(heightPx-1))*255);if(y<heightPx-1&&now()-start>=6){await yieldControl();start=now();}}
 return {width,height:heightPx,values};
}
