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
 zone("boundary-right","Right boundary band",[[879,398],[916,398],[916,414],[1268,414],[1268,399],[1311,399],[1311,457],[1280,444],[1268,433],[916,433],[916,508],[879,508]]),
 // The garden-facing panels were previously excluded wholesale. Trace the
 // exposed plaster and keep conservative holes around leaves and wall lights.
 zone("garden-left","Left garden wall",rect(278,434,351,64),[
  [[278,452],[302,448],[322,438],[350,439],[373,451],[388,465],[391,498],[278,498]],
  [[377,474],[400,468],[429,469],[447,478],[452,498],[377,498]],
  [[444,467],[461,451],[476,438],[508,438],[532,452],[543,470],[543,498],[444,498]],
  [[535,476],[554,467],[581,464],[597,455],[620,449],[629,451],[629,498],[535,498]],rect(417,441,12,25),rect(565,441,13,25)]),
 zone("garden-right","Right garden wall",rect(917,434,350,64),[
  [[927,477],[944,458],[966,443],[991,445],[1005,465],[1020,476],[1023,498],[927,498]],
  [[1013,480],[1035,470],[1052,461],[1061,437],[1080,437],[1096,449],[1109,474],[1117,498],[1013,498]],
  [[1104,481],[1133,467],[1153,457],[1184,459],[1201,476],[1201,498],[1104,498]],
  [[1197,434],[1267,434],[1267,498],[1197,498]],rect(1125,441,14,25)])
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
export const facadeSamples=[
 {id:"family",label:"Modern family home",description:"Street-facing two-storey home",src:"/images/studio/finished.webp",zones:facadeZones},
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
