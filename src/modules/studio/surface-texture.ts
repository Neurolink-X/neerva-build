import type {Pattern} from "./wall-patterns.ts";
/** Small deterministic alpha maps; paint colour and source-photo lighting are composited separately. */
export const surfaceProfiles=["marble","limewash","travertine","linen","mineral","terracotta","brushed","stonewash","venetian","onyx","suede","microcement"] as const satisfies readonly Pattern[];
export type SurfaceProfile=typeof surfaceProfiles[number];
export const SURFACE_TILE_SIZE=160;
export function isSurfaceProfile(p:Pattern):p is SurfaceProfile{return (surfaceProfiles as readonly Pattern[]).includes(p);}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function hash(x:number,y:number,seed:number){let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(seed,1446648773);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function noise(x:number,y:number,seed:number){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return mix(mix(hash(a,b,seed),hash(a+1,b,seed),s),mix(hash(a,b+1,seed),hash(a+1,b+1,seed),s),t);}
function fbm(x:number,y:number,seed:number){return .55*noise(x,y,seed)+.28*noise(x*2.1,y*2.1,seed+1)+.12*noise(x*4.3,y*4.3,seed+2)+.05*noise(x*9,y*9,seed+3);}
export function surfaceAlpha(profile:SurfaceProfile,u:number,v:number){
 const seed=surfaceProfiles.indexOf(profile)*37+19;
 const cloud=fbm(u*5,v*5,seed),fine=noise(u*110,v*110,seed+7),grain=noise(u*42,v*42,seed+9);
 const warp=fbm(u*3+8,v*4+2,seed+11);
 let a:number;
 switch(profile){
  case "marble":case "onyx":{
   const phase=u*3.1+v*1.7+2.4*warp+.23*fbm(u*15,v*12,seed+12);
   const ridge=Math.abs(Math.sin(Math.PI*phase));
   const vein=Math.pow(1-ridge,12),halo=Math.pow(1-ridge,3);
   a=.035+.11*cloud+vein*(profile==="onyx"?.62:.50)+halo*.17+fine*.035;break;
  }
  case "limewash":a=.04+.49*Math.pow(cloud,1.65)+.06*fine;break;
  case "venetian":{const t=fbm(u*9+warp*2,v*5,seed+6);a=.025+.54*Math.pow(t,1.45)+.065*fine+.08*Math.abs(cloud-t);break;}
  case "travertine":{const strata=fbm(u*4,v*24+warp*.9,seed+5);a=.045+.35*strata+.12*cloud+.14*Math.pow(grain,5);break;}
  case "linen":{const weave=(Math.sin(u*85*Math.PI)**8+Math.sin(v*72*Math.PI)**8)/2;a=.06+.14*weave+.15*grain+.06*cloud;break;}
  case "mineral":a=.045+.20*cloud+.13*grain+.23*Math.pow(fine,9);break;
  case "terracotta":a=.035+.36*fbm(u*6+warp,v*7,seed+2)+.11*grain+.055*fine;break;
  case "brushed":{const strands=fbm(u*4,v*45+warp,seed+8);a=.035+.25*strands+.1*cloud+.07*fine;break;}
  case "stonewash":a=.025+.40*Math.pow(cloud,1.35)+.075*grain+.035*fine;break;
  case "suede":a=.04+.31*fbm(u*14+warp,v*10,seed+5)+.10*cloud+.09*fine;break;
  case "microcement":a=.035+.24*cloud+.12*grain+.12*Math.pow(fine,4);break;
 }
 return clamp(a);
}
export function buildSurfaceTile(profile:SurfaceProfile,size=SURFACE_TILE_SIZE){
 if(!Number.isInteger(size)||size<8||size>256)throw new RangeError("Surface tile must be 8–256 pixels");
 const data=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(surfaceAlpha(profile,x/(size-1),y/(size-1))*255);}
 return data;
}
