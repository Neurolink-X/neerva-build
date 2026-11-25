import type {MaskCorner} from "./mask-editor.ts";
import type {Pattern} from "./wall-patterns.ts";
export type PhotoMask={outline:number[][];holes?:number[][][]};
export type PaintStyle={colour:string;accent:string;pattern:Pattern;opacity:number};
export type FacadeTarget="all"|"left"|"right"|"balcony"|"entry"|"boundary";
const ring=(p:number[][],width=1536,height=512)=>p.map(([x,y])=>[x/width,y/height]);
const rect=(x:number,y:number,w:number,h:number)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function zone(id:Exclude<FacadeTarget,"all">,label:string,outline:number[][],holes:number[][][]=[],bounds?:number[][],width=1536,height=512){
 const mask={outline:ring(outline,width,height),holes:holes.map(h=>ring(h,width,height))};
 const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]);
 const box=bounds??rect(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 return {id,label,mask,points:ring(box,width,height).map(([x,y]):MaskCorner=>({x,y}))};
}
// These conservative polygons correspond ONLY to the bundled finished.webp
// image (3:1). Windows, timber, glazing, door and foreground plants are excluded.
export const facadeZones=[
 zone("left","Left facade",[[369,18],[457,18],[457,409],[388,409],[388,346],[321,346],[321,118],[369,70]], [rect(399,104,58,279)]),
 zone("right","Right facade",[[972,62],[1226,62],[1226,282],[1172,282],[1172,410],[972,410]], [rect(982,115,189,132),rect(982,319,189,91)]),
 zone("balcony","Balcony frame",[[527,47],[970,47],[970,75],[555,75],[555,251],[970,251],[970,286],[527,286]]),
 zone("entry","Entrance frame",[[527,287],[554,287],[554,396],[527,396]]),
 zone("boundary","Boundary top band",[[281,419],[631,419],[631,432],[281,432]])
] as const;
// Every photograph owns its mask geometry. Never reuse a polygon from another home.
const villaZones=[
 zone("left","Lower side wall",[[345,282],[452,286],[452,363],[345,363]],[],undefined,880,584),
 zone("right","Upper side facade",[[588,67],[775,137],[775,207],[704,176],[704,158],[672,145],[672,177],[588,142]],[],undefined,880,584),
 zone("balcony","Upper front frame",[[412,166],[582,60],[582,247],[412,276]],[[[422,212],[472,180],[472,255],[422,266]],[[484,174],[561,128],[561,237],[484,257]]],undefined,880,584),
 zone("entry","Lower right wall",[[669,230],[723,224],[723,360],[669,365]],[],undefined,880,584)
] as const;
const contemporaryZones=[
 zone("left","Front wall",[[2,291],[195,333],[195,599],[92,603],[92,385],[2,383]],[],undefined,880,738),
 zone("right","Upper white wall",[[548,240],[602,264],[602,302],[548,280]],[],undefined,880,738),
 zone("balcony","Upper trim",[[2,128],[205,216],[205,250],[2,178]],[],undefined,880,738),
 zone("entry","Entrance column",[[258,370],[300,365],[300,541],[258,548]],[],undefined,880,738)
] as const;
export const facadeSamples=[
 {id:"family",label:"Modern family home",description:"Street-facing two-storey home",src:"/images/studio/finished.webp",zones:facadeZones},
 {id:"contemporary",label:"Contemporary home",description:"Clean lines and contrasting cladding",src:"/images/studio/house-3.webp",zones:contemporaryZones},
 {id:"villa",label:"Premium villa",description:"Modern facade with terraces",src:"/images/studio/house-2.webp",zones:villaZones}
] as const;
export type FacadeSampleId=typeof facadeSamples[number]["id"];
export type FacadeZone=typeof facadeZones[number];
export type FacadeStyles=Partial<Record<Exclude<FacadeTarget,"all">,PaintStyle>>;
export function stylesForTarget(saved:FacadeStyles,target:FacadeTarget,style:PaintStyle,zones:readonly FacadeZone[]=facadeZones):FacadeStyles{
 const next={...saved};
 for(const zone of zones)if(target==="all"||zone.id===target)next[zone.id]=style;
 return next;
}
export function activePattern(mode:"paint"|"design",pattern:Pattern):Pattern{return mode==="paint"?"plain":pattern;}
/** Target shade with retained luminance variation, rather than darkening paint twice. */
export function shadedPixel(r:number,g:number,b:number,target:readonly number[]):number[]{
 const luminance=.2126*r+.7152*g+.0722*b;
 const factor=Math.max(.35,Math.min(1.35,luminance/190));
 return target.map(v=>Math.max(0,Math.min(255,Math.round(v*factor))));
}
