import type {FacadeZone,FacadeTarget,FacadeStyles,PaintStyle,PhotoMask} from "./facade-paint.ts";
import {artworkFrame} from "./wall-design-layout.ts";
import type {MaskCorner} from "./mask-editor.ts";
type Frame={u:number;v:number;w:number;h:number};
const full:Frame={u:0,v:0,w:1,h:1};
const inside=(ring:number[][],x:number,y:number)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [a,b]=ring[i],[c,d]=ring[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;};
const cache=new WeakMap<PhotoMask,Frame>();
/** Bounded conservative placement study. Final canvas clipping still protects
 * exact mask boundaries and excludes openings. A sampled fit is not a survey. */
export function visibleFacadeFrame(mask:PhotoMask,points:readonly MaskCorner[]):Frame{
 const previous=cache.get(mask);if(previous)return previous;
 const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;
 if(w<=0||h<=0)return full;
 const n=24,grid=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>[[.12,.12],[.88,.12],[.12,.88],[.88,.88],[.5,.5]].every(([dx,dy])=>{const px=x+w*(c+dx)/n,py=y+h*(r+dy)/n;return inside(mask.outline,px,py)&&!(mask.holes??[]).some(hole=>inside(hole,px,py));})));
 let best:Frame=full,score=0;
 for(let top=0;top<n;top++){const good=Array<boolean>(n).fill(true);for(let bottom=top;bottom<n;bottom++){let start=0;for(let col=0;col<=n;col++){if(col<n)good[col]=good[col]&&grid[bottom][col];if(col<n&&good[col])continue;const width=col-start,height=bottom-top+1;if(width>=2&&height>=2){const area=width*height;const ratio=(width*w)/(height*h);const value=area*Math.min(1,ratio/.35,3.5/ratio);if(value>score){score=value;best={u:start/n,v:top/n,w:width/n,h:height/n};}}start=col+1;}}}
 cache.set(mask,best);return best;
}
export function recommendedFacadeZone(zones:readonly FacadeZone[]):Exclude<FacadeTarget,"all">|undefined{
 let best:FacadeZone|undefined,score=-1;
 for(const zone of zones){const f=visibleFacadeFrame(zone.mask,zone.points),w=Math.max(...zone.points.map(p=>p.x))-Math.min(...zone.points.map(p=>p.x)),h=Math.max(...zone.points.map(p=>p.y))-Math.min(...zone.points.map(p=>p.y)),ratio=w*f.w/(h*f.h);
 const s=w*h*f.w*f.h*Math.min(1,ratio/.4,4/ratio)*(["roof","balcony"].includes(zone.id)?.45:1);if(s>score){score=s;best=zone;}}
 return best?.id;
}
export function fitFacadeArtwork(mask:PhotoMask,normalized:readonly MaskCorner[],corners:readonly MaskCorner[],reference=1.5){
 const f=visibleFacadeFrame(mask,normalized),[a,b,c,d]=corners;
 if(!a||!b||!c||!d)return full;
 const at=(u:number,v:number)=>({x:(1-v)*(a.x+(b.x-a.x)*u)+v*(d.x+(c.x-d.x)*u),y:(1-v)*(a.y+(b.y-a.y)*u)+v*(d.y+(c.y-d.y)*u)});
 const fit=artworkFrame([at(f.u,f.v),at(f.u+f.w,f.v),at(f.u+f.w,f.v+f.h),at(f.u,f.v+f.h)],true,1,reference);
 return {u:f.u+fit.u*f.w,v:f.v+fit.v*f.h,w:fit.w*f.w,h:fit.h*f.h};
}
/** Entering full-exterior view must not erase individually saved wall designs.
 * A deliberate whole-house shade change updates base paint, not pattern/accents. */
export function managedFacadeStyles(saved:FacadeStyles,target:FacadeTarget,style:PaintStyle,wholeShade:string,zones:readonly FacadeZone[]):FacadeStyles{
 const out={...saved};
 for(const zone of zones){if(target===zone.id)out[zone.id]=style;else if(target==="all"){const prior=out[zone.id];out[zone.id]=prior?(style.colour===wholeShade?prior:{...prior,colour:style.colour}):{...style,pattern:"plain"};}}
 return out;
}
