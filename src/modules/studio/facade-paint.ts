import type {MaskCorner} from "./mask-editor.ts";
import type {Pattern} from "./wall-patterns.ts";
export type PhotoMask={outline:number[][];holes?:number[][][]};
export type PaintStyle={colour:string;accent:string;pattern:Pattern;opacity:number};
export type FacadeTarget="all"|"left"|"right"|"balcony"|"entry"|"boundary"|"roof"|"boundary-right"|"upper-recess"|"lower-recess";
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
 zone("left","Left facade",[[360,18],[458,18],[458,413],[387,413],[387,381],[317,381],[317,112],[350,66]], [rect(400,105,58,276),[[317,344],[354,354],[378,374],[387,396],[347,396],[317,381]]]),
 zone("right","Right facade",[[970,61],[1228,61],[1228,282],[1203,282],[1191,307],[1185,340],[1178,359],[1174,391],[1169,412],[983,412],[983,379],[916,379],[900,365],[900,310],[970,285],[970,251],[938,251],[938,193],[958,193],[958,92],[970,79]], [rect(983,116,187,129),rect(983,322,186,90),[[1190,291],[1203,283],[1220,282],[1228,286],[1228,306],[1207,304],[1198,322],[1191,319]] ]),
 zone("balcony","Balcony frame",[[526,46],[972,46],[972,76],[555,76],[555,251],[972,251],[972,286],[526,286]]),
 zone("entry","Entrance and recessed walls",[[526,286],[554,286],[554,310],[648,310],[648,368],[630,368],[614,394],[575,398],[554,413],[526,413]]),
 zone("boundary","Left boundary band",[[244,398],[277,398],[277,412],[630,412],[630,398],[668,398],[668,508],[630,508],[630,433],[277,433],[277,461],[244,478]]),
 zone("roof","Roof trim",[[901,23],[1239,23],[1239,60],[1228,63],[972,62],[972,46],[891,46]]),
 zone("upper-recess","Balcony recessed wall",[[555,79],[580,116],[887,116],[913,92],[958,79],[958,192],[938,192],[938,251],[555,251]],[[[650,132],[850,132],[850,251],[650,251]],[[558,191],[575,177],[575,159],[597,153],[618,162],[641,175],[645,194],[645,251],[558,251]],[[851,166],[864,149],[890,142],[912,156],[915,180],[936,193],[936,251],[851,251]]]),
 zone("lower-recess","Ground floor recessed wall",[[555,288],[578,309],[885,309],[907,288],[971,288],[971,413],[916,413],[916,397],[879,397],[879,413],[850,413],[850,326],[651,326],[651,397],[555,397]],[[[556,383],[575,374],[593,368],[615,374],[641,397],[641,413],[556,413]],[[851,383],[869,371],[886,374],[900,395],[900,413],[851,413]]]),
 zone("boundary-right","Right boundary band",[[879,398],[916,398],[916,414],[1268,414],[1268,399],[1311,399],[1311,457],[1280,444],[1268,433],[916,433],[916,508],[879,508]])
] as const;
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
// Existing local 18×50 ft family-home concept (900 sq ft / 100 sq yd).
// Independent polygons are measured in the original 351×161 pixel reference.
const compactFamilyZones=[
 zone("left","Left upper wall",[[110,0],[162,0],[162,53],[110,53]], [rect(126,31,29,22)],undefined,351,161),
 zone("right","Right upper wall",[[176,0],[296,0],[296,67],[176,67]], [rect(198,26,31,26),rect(238,25,30,27),rect(180,0,14,67),rect(176,52,120,15)],undefined,351,161),
 zone("balcony","Balcony slab",[[100,69],[296,69],[296,88],[100,88]],[],undefined,351,161),
 zone("entry","Ground floor wall",[[100,88],[296,88],[296,129],[100,129]], [rect(123,105,34,24),rect(215,103,55,26),rect(177,88,15,41)],undefined,351,161),
 zone("boundary","Boundary walls",[[0,129],[97,129],[97,161],[0,161]], [rect(7,138,38,23),rect(59,142,25,19)],undefined,351,161),
 zone("boundary-right","Right boundary wall",[[298,129],[351,129],[351,161],[298,161]], [rect(306,140,20,21)],undefined,351,161)
] as const;
export const facadeSamples=[
 {id:"family",label:"Modern family home",description:"Street-facing two-storey home",src:"/images/studio/finished.webp",zones:facadeZones},
 {id:"contemporary",label:"Contemporary home",description:"Clean lines and contrasting cladding",src:"/images/studio/house-3.webp",zones:contemporaryZones},
 {id:"villa",label:"Premium villa",description:"Modern facade with terraces",src:"/images/studio/house-2.webp",zones:villaZones},
 {id:"compact-family",label:"100 gaj family home",description:"18 × 50 ft · G+1 concept reference",src:"/images/studio/family/family-18x50.webp",zones:compactFamilyZones}
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
