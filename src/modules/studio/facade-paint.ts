import {houseJourney} from "./house-journey.ts";
import type {MaskCorner} from "./mask-editor.ts";
import type {Pattern} from "./wall-patterns.ts";
export type PhotoMask={outline:number[][];holes?:number[][][]};
export type PaintStyle={colour:string;accent:string;pattern:Pattern;opacity:number};
export type FacadeTarget="all"|"left"|"right"|"balcony"|"entry"|"boundary"|"roof"|"boundary-right"|"upper-recess"|"lower-recess"|"garden-left"|"garden-right";
const ring=(p:number[][],width=1536,height=512)=>p.map(([x,y])=>[x/width,y/height]);
const rect=(x:number,y:number,w:number,h:number)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function zone(id:Exclude<FacadeTarget,"all">,label:string,outline:number[][],holes:number[][][]=[],bounds?:number[][],width=1536,height=512){
 const mask={outline:ring(outline,width,height),holes:holes.map(h=>ring(h,width,height))};
 const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]);
 const box=bounds??rect(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 return {id,label,mask,points:ring(box,width,height).map(([x,y]):MaskCorner=>({x,y}))};
}
// Every photograph owns its mask geometry. Never reuse a polygon from another home.
const villaZones=[
 zone("left","Lower front wall",[[231,291],[259,249],[413,258],[457,279],[457,366],[342,366],[342,296],[265,296],[265,343],[242,344],[242,307],[231,316]],[],undefined,880,584),
 zone("right","Upper side facade",[[586,57],[647,78],[655,69],[677,77],[677,90],[773,126],[789,121],[789,205],[698,181],[698,163],[674,152],[674,175],[640,194],[640,233],[606,255],[586,251]],[[[776,136],[785,140],[785,166],[776,161]]],undefined,880,584),
 zone("balcony","Upper front frame",[[412,165],[586,57],[586,251],[448,279],[412,276]],[[[420,211],[475,178],[475,251],[420,270]],[[485,172],[562,130],[562,231],[485,252]]],undefined,880,584),
 zone("entry","Lower right facade",[[668,224],[714,222],[821,258],[821,387],[774,389],[774,301],[729,286],[729,389],[668,391]],[],undefined,880,584),
 zone("boundary","Lower centre wall",[[458,286],[612,264],[612,297],[458,315]],[],undefined,880,584),
 zone("roof","Terrace column and return",[[613,265],[668,224],[668,370],[612,370],[612,298]],[],undefined,880,584)
] as const;
const contemporaryZones=[
 zone("left","Front wall",[[0,289],[137,317],[200,298],[200,606],[92,608],[92,395],[0,383]],[],undefined,880,738),
 zone("right","Right facade",[[547,240],[603,264],[603,529],[547,535]],[[[548,302],[599,327],[599,404],[548,381]],[[548,432],[599,441],[599,521],[548,527]]],undefined,880,738),
 zone("balcony","Upper trim",[[0,122],[207,192],[207,250],[170,249],[0,178]],[],undefined,880,738),
 zone("entry","Entrance recess",[[200,355],[244,365],[282,357],[438,381],[438,397],[302,378],[302,545],[244,551],[244,383],[200,383]],[],undefined,880,738),
 zone("roof","Entrance frame",[[170,245],[484,349],[484,551],[466,555],[466,388],[170,325]],[],undefined,880,738)
] as const;
// Dedicated masks measured against the 1536×1024 generated source; the local
// 1200×800 WebP preserves the same aspect ratio. Conservative exclusions protect
// glazing, railings, fixtures, timber, stone and foliage, including thin leaves.
const compactFamilyZones=[
 zone("left","Left facade wall",[[383,105],[423,105],[423,543],[622,543],[622,576],[383,576]],[],undefined,1536,1024),
 zone("roof","Roof and upper trim",[[383,95],[1116,95],[1116,52],[1178,52],[1178,185],[631,185],[631,129],[423,129],[423,105],[383,105]],[],undefined,1536,1024),
 zone("right","Right balcony wall",[[831,278],[1116,278],[1158,219],[1158,349],[1137,349],[1125,346],[1109,350],[1090,343],[1064,350],[1046,369],[1037,399],[831,399]],[rect(869,332,204,67),rect(843,333,15,24)],undefined,1536,1024),
 zone("upper-recess","Left balcony recess",rect(650,270,162,130),[rect(648,313,123,90)],undefined,1536,1024),
 zone("balcony","Balcony slab",rect(642,510,524,66),[],undefined,1536,1024),
 zone("entry","Ground floor entrance wall",[[380,580],[421,580],[421,601],[500,655],[640,655],[640,650],[760,650],[760,781],[408,781],[408,755],[380,755]],[rect(506,701,109,82),rect(639,691,126,93)],undefined,1536,1024),
 zone("lower-recess","Right ground floor wall",[[767,609],[1115,609],[1152,581],[1152,770],[1059,770],[1059,673],[861,673],[861,770],[828,770],[828,755],[777,755],[767,770]],[rect(815,679,16,25)],undefined,1536,1024),
 zone("boundary","Left boundary wall",[[200,775],[355,775],[355,765],[402,765],[402,968],[200,968]],[rect(255,804,63,132),[[200,832],[230,828],[276,835],[310,860],[332,920],[335,968],[200,968]],rect(362,785,31,30)],undefined,1536,1024),
 zone("boundary-right","Right boundary wall",[[784,767],[823,767],[823,775],[1265,775],[1265,974],[784,974]],[rect(790,786,27,30),rect(864,804,55,140),rect(1050,805,169,136),[[850,912],[865,861],[885,824],[888,790],[902,770],[927,764],[950,755],[986,754],[1017,770],[1048,801],[1050,862],[1036,911],[1020,974],[850,974]],[[1017,940],[1060,932],[1120,921],[1170,922],[1225,913],[1250,937],[1250,974],[1017,974]]],undefined,1536,1024)
] as const;
// Dedicated 1200×600 paint geometry for the reviewed premium house asset.
export const facadeZones=[
 zone("roof","Roof plaster band",[[243,37],[573,50],[573,80],[243,73]],[],undefined,1200,600),
 zone("right","Right facade frame",[[925,22],[1062,24],[1062,269],[1032,269],[1032,43],[925,38]],[],undefined,1200,600),
 zone("left","Left upper column",rect(244,98,26,158),[],undefined,1200,600),
 zone("upper-recess","Centre balcony column",rect(550,123,30,85),[],undefined,1200,600),
 zone("balcony","Front balcony plaster",rect(240,266,611,39),[],undefined,1200,600),
 zone("entry","Ground floor centre column",rect(551,317,28,67),[],undefined,1200,600),
 zone("lower-recess","Ground floor right wall",rect(1030,325,28,79),[],undefined,1200,600),
 zone("boundary","Left boundary plaster",rect(82,410,122,18),[],undefined,1200,600)
] as const;
export const facadeSamples=[
 {id:"family",label:"Modern family home",description:"Premium two-storey family residence",src:houseJourney.finished.src,zones:facadeZones},
 {id:"contemporary",label:"Contemporary home",description:"Clean lines and contrasting cladding",src:"/images/studio/house-3.webp",zones:contemporaryZones},
 {id:"villa",label:"Premium villa",description:"Modern facade with terraces",src:"/images/studio/house-2.webp",zones:villaZones},
 {id:"compact-family",label:"100 gaj family home",description:"18 × 50 ft · G+1 photorealistic concept",src:"/images/studio/family/neerva-100gaj-photorealistic.webp",zones:compactFamilyZones}
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
