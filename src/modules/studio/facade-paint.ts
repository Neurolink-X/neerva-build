import type {MaskCorner} from "./mask-editor.ts";
import type {Pattern} from "./wall-patterns.ts";
export type PhotoMask={outline:number[][];holes?:number[][][]};
export type PaintStyle={colour:string;accent:string;pattern:Pattern;opacity:number};
export type FacadeTarget="all"|"left"|"right"|"balcony"|"entry"|"boundary";
const ring=(p:number[][])=>p.map(([x,y])=>[x/1536,y/512]);
const rect=(x:number,y:number,w:number,h:number)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function zone(id:Exclude<FacadeTarget,"all">,label:string,outline:number[][],holes:number[][][]=[],bounds?:number[][]){
 const mask={outline:ring(outline),holes:holes.map(ring)};
 const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]);
 const box=bounds??rect(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 return {id,label,mask,points:ring(box).map(([x,y]):MaskCorner=>({x,y}))};
}
// These conservative polygons correspond ONLY to the bundled finished.webp
// image (3:1). Windows, timber, glazing, door and foreground plants are excluded.
export const facadeZones=[
 zone("left","Left facade",[[369,18],[457,18],[457,409],[388,409],[388,346],[321,346],[321,118],[369,70]], [rect(399,104,58,279)]),
 zone("right","Right facade",[[972,62],[1226,62],[1226,282],[1172,282],[1172,410],[972,410]], [rect(982,115,189,132),rect(982,319,189,91)]),
 zone("balcony","Balcony frame",[[527,47],[970,47],[970,75],[555,75],[555,251],[970,251],[970,286],[527,286]]),
 zone("entry","Entrance frame",[[527,287],[554,287],[554,396],[527,396]]),
 zone("boundary","Boundary wall",[[281,419],[631,419],[631,432],[281,432]])
] as const;
export type FacadeStyles=Partial<Record<Exclude<FacadeTarget,"all">,PaintStyle>>;
export function stylesForTarget(saved:FacadeStyles,target:FacadeTarget,style:PaintStyle):FacadeStyles{
 const next={...saved};
 for(const zone of facadeZones)if(target==="all"||zone.id===target)next[zone.id]=style;
 return next;
}
export function activePattern(mode:"paint"|"design",pattern:Pattern):Pattern{return mode==="paint"?"plain":pattern;}
/** Target shade with retained luminance variation, rather than darkening paint twice. */
export function shadedPixel(r:number,g:number,b:number,target:readonly number[]):number[]{
 const luminance=.2126*r+.7152*g+.0722*b;
 const factor=Math.max(.35,Math.min(1.35,luminance/190));
 return target.map(v=>Math.max(0,Math.min(255,Math.round(v*factor))));
}
