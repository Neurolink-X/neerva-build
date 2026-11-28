"use client";
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type ChangeEvent,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {addCorner,emptyMaskHistory,redoCorner,undoCorner,validWallMask,type MaskCorner} from "@/modules/studio/mask-editor";
import {encodedPhotoDimensions,photoDimensionsAllowed,paintPreviewDimensions} from "@/modules/studio/photo-budget";
import {finishes,artworkMotifs,patternGroups,groupForPattern,isRetiredPattern,type PatternGroup,type Pattern} from "@/modules/studio/wall-patterns";
import NextImage from "next/image";
import {motifPigment,motifStops} from "@/modules/studio/wall-pigment";
import {WallArtworkSwatch} from "./studio-wall-artwork-swatch";
import {houseJourneyImageUrl} from "@/modules/studio/house-journey";
import {isSurfaceProfile} from "@/modules/studio/surface-texture";
import {surfaceCanvas,StudioSurfaceSwatch} from "./studio-surface-swatch";
import {isPracticalPaintArt} from "@/modules/studio/practical-paint-art";
import {collectionGuide,isFeatureWall} from "@/modules/studio/wall-design-guide";
import {exteriorCollections,exteriorGuide,exteriorGroupFor,isExteriorPattern} from "@/modules/studio/exterior-wall-art";
import {readableArtworkAccent} from "@/modules/studio/artwork-contrast";
import {designPreviewPalette} from "@/modules/studio/design-preview-palette";
import {paintExecution} from "@/modules/studio/paint-execution";
import {wallProjector} from "@/modules/studio/wall-projective";
import {artworkFrame} from "@/modules/studio/wall-design-layout";
import {shadeArtworkPixels} from "@/modules/studio/artwork-lighting";
import {detailedWallRecipe,wallMaterialDetail} from "@/modules/studio/detailed-wall-recipes";
import {applyMaterialDetail} from "@/modules/studio/material-detail";
import {commitInteriorWall,repaintInteriorWalls,wallDetailCorners,wallContainsPoint,matchingWallCorners,snapshotWalls,changeWallContext,compatibleWallPattern,type InteriorWall} from "@/modules/studio/interior-wall-management";
import {appliedWallTextureKeys,hasWallRaster} from "@/modules/studio/wall-textures";
import {fitFacadeArtwork,managedFacadeStyles,recommendedFacadeZone} from "@/modules/studio/facade-design-management";
import {useWallTextures,colouredTexture,WallTextureSwatch,drawTextureQuad} from "./studio-wall-texture";
import {colourPairings} from "@/modules/studio/colour-families";
import {ShadeReferenceCard} from "./shade-reference-card";
import dynamic from "next/dynamic";
import {cornerRoomAsset,cornerRoomInitialWalls,cornerRoomWalls} from "@/modules/studio/corner-room";
import {facadeSamples,activePattern,shadedPixel,type PhotoMask,type PaintStyle,type FacadeStyles,type FacadeTarget,type FacadeSampleId} from "@/modules/studio/facade-paint";
const StudioPremiumTools=dynamic(()=>import("./studio-premium-tools").then(m=>m.StudioPremiumTools),{loading:()=> <p role="status">Loading report options…</p>});
const roomPhotos={corner:cornerRoomAsset.src,feature:"/images/studio/paint-room.webp",daylight:cornerRoomAsset.src} as const;
type RoomPhoto=keyof typeof roomPhotos;
const roomMask:PhotoMask={outline:[[40,34],[373,37],[373,215],[361,215],[360,188],[354,177],[345,174],[326,175],[332,164],[295,164],[290,169],[151,168],[145,162],[125,164],[95,161],[99,177],[85,178],[72,181],[66,188],[65,215],[40,215]].map(([x,y])=>[x/420,y/280])};
type Wall=InteriorWall;
const fullArtwork=(pattern:Pattern)=>isPracticalPaintArt(pattern)||(["Murals","Nature","Signature","Modern","Geometry"] as const).some(group=>(patternGroups[group] as readonly Pattern[]).includes(pattern));
function drawWall(ctx:CanvasRenderingContext2D,wall:Wall,w:number,h:number,tinted?:HTMLCanvasElement,patternSurface?:HTMLCanvasElement,accentTint?:HTMLCanvasElement,sourceLuma?:Uint8Array|null,texture?:HTMLCanvasElement,flat=false){
 const corners=wall.points.map(p=>({x:p.x*w,y:p.y*h}));
 ctx.save();
 if(wall.mask){
  const trace=(ring:number[][])=>{ring.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();};
  // Clip the outline first, then subtract each exclusion separately. A hole
  // that touches an edge or overlaps another hole must not add paint back.
  ctx.beginPath();trace(wall.mask.outline);ctx.clip();
  for(const hole of wall.mask.holes??[]){ctx.beginPath();ctx.rect(0,0,w,h);trace(hole);ctx.clip("evenodd");}
 }else{
  ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
 }
 // The tint already contains the selected RGB plus source luminance. Do not blend
 // the old wall hue back into a dark shade or apply a second darkening pass.
 if(flat){ctx.fillStyle=wall.colour;ctx.globalAlpha=1;ctx.fillRect(0,0,w,h);}
 else if(tinted){ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;ctx.drawImage(tinted,0,0,w,h);}
 else{ctx.globalCompositeOperation="color";ctx.fillStyle=wall.colour;ctx.globalAlpha=1;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="multiply";ctx.globalAlpha=.35;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}

 if(wall.pattern!=="plain"){
  if(corners.length!==4){ctx.restore();return;}
  const [a,b,c,d]=corners;
  // Image-based finishes wrap the entire wall; the photo mask still protects furniture.
  const focal=!texture&&isFeatureWall(wall.pattern),reference=1.5;
  const frame=wall.mask&&wall.mask!==roomMask&&focal?fitFacadeArtwork(wall.mask,wall.points,corners,reference):artworkFrame(corners,focal,wall.mask===roomMask?.70:1,reference);
  const project=wallProjector(a,b,c,d);
  const at=(x:number,y:number)=>project(frame.u+x*frame.w,frame.v+y*frame.h);
  // Mask an accent tint with the motif: the design inherits the same photographic
  // highlights and shadows as the base paint. One reusable scratch canvas, only for patterns.
  const layer=patternSurface?patternSurface.getContext("2d",{willReadFrequently:true}):null;
  if(layer&&patternSurface){if(patternSurface.width!==w)patternSurface.width=w;if(patternSurface.height!==h)patternSurface.height=h;layer.clearRect(0,0,w,h);}
  const brush=layer??ctx;brush.save();
  brush.globalCompositeOperation="source-over";brush.globalAlpha=wall.opacity??.78;
  brush.strokeStyle=brush.fillStyle=wall.accent;const weight=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)*frame.w*.006);brush.lineCap="round";brush.lineJoin="round";
  // Organic finishes use a continuous material mask rather than stripes or flat line art.
  const tile=layer&&isSurfaceProfile(wall.pattern)?surfaceCanvas(wall.pattern):null;
  if(texture&&layer){brush.globalAlpha=1;drawTextureQuad(brush,texture,at(0,0),at(1,0),at(1,1),at(0,1),fullArtwork(wall.pattern));}
  else if(tile){
   const left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),right=Math.max(...corners.map(p=>p.x)),bottom=Math.max(...corners.map(p=>p.y));
   brush.save();brush.beginPath();corners.forEach((p,i)=>i?brush.lineTo(p.x,p.y):brush.moveTo(p.x,p.y));brush.closePath();brush.clip();
   brush.globalAlpha=wall.opacity??.78;brush.drawImage(tile,left,top,right-left,bottom-top);brush.restore();
  }else{  for(const motif of artworkMotifs(wall.pattern)){
   brush.globalAlpha=layer?(motif.alpha??1):(wall.opacity??.78)*(motif.alpha??1);const pigment=motifPigment(motif,wall.colour,wall.accent);brush.strokeStyle=brush.fillStyle=pigment;
   if(motif.filled&&motif.finish){const xs=motif.points.map(p=>p[0]),ys=motif.points.map(p=>p[1]),a=at(Math.min(...xs),Math.min(...ys)),b=at(Math.max(...xs),Math.max(...ys));if(Math.hypot(a.x-b.x,a.y-b.y)>.01){const g=brush.createLinearGradient(a.x,a.y,b.x,b.y);for(const [offset,color] of motifStops(motif,wall.colour,wall.accent))g.addColorStop(offset,color);brush.fillStyle=g;}}brush.lineWidth=weight*(motif.weight??1);brush.beginPath();
   motif.points.forEach(([u,v],i)=>{const p=at(u,v);if(i===0)brush.moveTo(p.x,p.y);else brush.lineTo(p.x,p.y)});
   if(motif.filled){brush.closePath();brush.fill()}else brush.stroke();
  }
  }
  if(layer&&patternSurface){
   if(tile&&(accentTint||flat)){brush.globalCompositeOperation="source-in";brush.globalAlpha=1;if(accentTint)brush.drawImage(accentTint,0,0,w,h);else{brush.fillStyle=wall.accent;brush.fillRect(0,0,w,h);}}
   else if(flat||sourceLuma?.length===w*h){
    // Apply the original photo luminance once to the finished artwork. Bound
    // readback to the selected wall; leave transparent/protected pixels intact.
    const left=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))),top=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y))));
    const right=Math.min(w,Math.ceil(Math.max(...corners.map(p=>p.x)))),bottom=Math.min(h,Math.ceil(Math.max(...corners.map(p=>p.y))));
    if(right>left&&bottom>top){const pixels=layer.getImageData(left,top,right-left,bottom-top);const material=texture?undefined:wallMaterialDetail(wall.pattern);if(material)applyMaterialDetail(pixels.data,pixels.width,pixels.height,material,left,top);if(sourceLuma?.length===w*h)shadeArtworkPixels(pixels.data,sourceLuma,w,left,top,pixels.width);layer.putImageData(pixels,left,top);}
   }
  }
  brush.restore();
  if(layer&&patternSurface){ctx.globalCompositeOperation="source-over";ctx.globalAlpha=tile?1:wall.opacity??.78;ctx.drawImage(patternSurface,0,0,w,h);}

 }
 ctx.restore();
}
export function StudioPhotoPaint({colour,onColourChange,colourControls,showReport=false}:{colour:string;onColourChange?:(colour:string)=>void;colourControls?:ReactNode;showReport?:boolean}){
 const [walls,setWalls]=useState<Wall[]>([]),[editing,setEditing]=useState<number|null>(null);
 const [pattern,setPattern]=useState<Pattern>("sunDisc"),[accent,setAccent]=useState("#c4925f");
 const [patternGroup,setPatternGroup]=useState<PatternGroup>("Signature");
 const [mode,setMode]=useState<"paint"|"design">("paint"),[opacity,setOpacity]=useState(.78);
 const [scene,setScene]=useState<"room"|"facade"|"custom">("room"),[target,setTarget]=useState<FacadeTarget>("all"),[facadeStyles,setFacadeStyles]=useState<FacadeStyles>({});
 const [roomPhoto,setRoomPhoto]=useState<RoomPhoto>("corner");
 const [sampleId,setSampleId]=useState<FacadeSampleId>("compact-family");
 const sample=facadeSamples.find(s=>s.id===sampleId)??facadeSamples[0];
 const facadeZones=sample.zones;
 const recommendedZone=useMemo(()=>recommendedFacadeZone(facadeZones),[facadeZones]);
 const [originalKey,setOriginalKey]=useState("");
 const [wholeShade,setWholeShade]=useState(colour);

 const [override,setOverride]=useState<{source:string;value:string}|null>(null);
 const base=override?.source===colour?override.value:colour;
 const latestBase=useRef(base);useLayoutEffect(()=>{latestBase.current=base},[base]);
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLCanvasElement|null>(null),url=useRef<string|null>(null),pending=useRef<HTMLImageElement|null>(null),generation=useRef(0),uploadGeneration=useRef(0);
 const photoTimer=useRef<number|null>(null);
 const tintCache=useRef(new Map<string,HTMLCanvasElement>()),patternScratch=useRef<HTMLCanvasElement|null>(null);
 const sourceLuma=useRef<Uint8Array|null>(null),tintPixels=useRef<ImageData|null>(null);
 const paintedTextureCache=useRef(new Map<string,{source:NonNullable<ReturnType<typeof useWallTextures>[Pattern]>;canvas:HTMLCanvasElement}>());
 const [history,setHistory]=useState(emptyMaskHistory),[ready,setReady]=useState(false);
 const [closeUp,setCloseUp]=useState(false);
 const [keepShades,setKeepShades]=useState(false);
 const [reportOpen,setReportOpen]=useState(false);
 const tapStart=useRef<{x:number;y:number;id:number}|null>(null);
 const [pickDesignWall,setPickDesignWall]=useState(false);
 const [allInterior,setAllInterior]=useState(false),[interiorWholeShade,setInteriorWholeShade]=useState(colour);
 const [patchMode,setPatchMode]=useState(false),[extraPaintAreas,setExtraPaintAreas]=useState<MaskCorner[][]>([]);
 const [uploadError,setUploadError]=useState("");
  const [showOriginal,setShowOriginal]=useState(false),[message,setMessage]=useState("Choose a local photo, then mark four corners of one wall clockwise.");
 const points=history.points,valid=validWallMask(points);
 const [customExterior,setCustomExterior]=useState(false);
 const exterior=scene==="facade"||(scene==="custom"&&customExterior);
 const interiorDetail=!exterior&&closeUp&&!allInterior&&valid;
 const selectedPattern:Pattern=exterior?(isExteriorPattern(pattern)?pattern:"facadeTwoTone"):(isExteriorPattern(pattern)?"sunDisc":pattern);
 const exteriorGroup=Object.hasOwn(exteriorCollections,patternGroup)?patternGroup as keyof typeof exteriorCollections:exteriorGroupFor(selectedPattern);
 const activeGroup:PatternGroup=exterior?exteriorGroup:patternGroup;
 const groups=exterior?Object.keys(exteriorCollections) as PatternGroup[]:Object.keys(patternGroups) as PatternGroup[];
 const shownPatterns:readonly Pattern[]=exterior?exteriorCollections[exteriorGroup]:[...patternGroups[activeGroup],...(isRetiredPattern(selectedPattern)&&activeGroup===groupForPattern(selectedPattern)?[selectedPattern]:[])];
 const guide=exterior?exteriorGuide[exteriorGroup]:collectionGuide[activeGroup];
 const effectivePattern=activePattern(mode,selectedPattern);
 const designRecipe=detailedWallRecipe(selectedPattern);
 const execution=exterior?undefined:paintExecution(selectedPattern);
 const appliedTextures=appliedWallTextureKeys({scene,target,facadeStyles,walls,editing,valid,effectivePattern});
 // Independent state for painted walls and background thumbnails: loading a
 // gallery card must not rerasterize the full room or invalidate an export.
 const activeTextureKeys=[...new Set<Pattern>([...(mode==="design"?[effectivePattern]:[]),...appliedTextures])].filter(hasWallRaster).join(",");
 const activeTextures=useWallTextures(activeTextureKeys,2);
 const previewTextureKeys=(mode==="design"?shownPatterns:[]).filter(hasWallRaster).join(",");
 const previewTextures=useWallTextures(previewTextureKeys,1,true);
 const textures={...previewTextures,...activeTextures};
 const awaitingArtwork=appliedTextures.some(key=>activeTextures[key]===undefined);
 const textureStatus=mode==="design"&&hasWallRaster(effectivePattern)?activeTextures[effectivePattern]?"ready":activeTextures[effectivePattern]===null?"fallback":"loading":"none";
 const renderedAccent=!exterior&&mode==="design"?readableArtworkAccent(base,accent):accent;
 const currentStyle:PaintStyle={colour:base,accent,pattern:effectivePattern,opacity};
 const styleKey=JSON.stringify([base,accent,effectivePattern,opacity,target,sampleId,extraPaintAreas,patchMode,wholeShade,walls,editing,points,facadeStyles,allInterior,interiorWholeShade,interiorDetail]);
 const originalVisible=showOriginal&&originalKey===styleKey;

 const focusPoints=scene==="facade"?facadeZones.find(z=>z.id===target)?.points??[]:points;
 const canInspect=focusPoints.length===4&& (scene==="facade"||valid);
 const wallCentre=canInspect?`${focusPoints.reduce((sum,p)=>sum+p.x,0)*25}% ${focusPoints.reduce((sum,p)=>sum+p.y,0)*25}%`:undefined;
 const wallWidth=canInspect?Math.max(...focusPoints.map(p=>p.x))-Math.min(...focusPoints.map(p=>p.x)):1;
 const wallZoom=closeUp&&canInspect&&!interiorDetail?`scale(${Math.min(4,Math.max(1.6,.94/wallWidth))})`:undefined;
 const [preset,setPreset]=useState<{points:MaskCorner[];mask:PhotoMask}|null>(null);
 const markedWall=editing!==null?walls[editing]:preset;
 const currentMask=markedWall&&matchingWallCorners(markedWall.points,points)?markedWall.mask:undefined;
 const wallLabel=(i:number)=>scene==="room"&&roomPhoto==="corner"?cornerRoomWalls[i]?.label??"Wall "+(i+1):"Wall "+(i+1);
 const shadeFacadeStyles=scene==="facade"?managedFacadeStyles(facadeStyles,target,currentStyle,wholeShade,facadeZones):{};
 const committedWalls=snapshotWalls(walls,editing,valid?{points,mask:currentMask,...currentStyle}:null,allInterior?{colour:base,initial:interiorWholeShade}:null);
 const shadeWalls=scene==="facade"?facadeZones.map(z=>({label:z.label,style:shadeFacadeStyles[z.id]})):committedWalls.map((style,i)=>({label:wallLabel(i),style}));
 const shadeEntries=shadeWalls.length?shadeWalls.flatMap(({label,style})=>style?[{label:label+" · base",value:style.colour},...(style.pattern==="plain"?[]:[{label:label+" · "+finishes[style.pattern].name,value:!exterior?readableArtworkAccent(style.colour,style.accent):style.accent}])]:[]):[{label:"Selected shade",value:base}];
 useLayoutEffect(()=>{
  const el=canvas.current,img=image.current;if(!el||!img||!ready)return;
  const ctx=el.getContext("2d");if(!ctx)return;const {width:w,height:h}=el;
  ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  function tint(hex:string){
   const shades=tintCache.current;const cached=shades.get(hex);
   if(cached){shades.delete(hex);shades.set(hex,cached);return cached}
   if(!sourceLuma.current){const original=img!.getContext("2d")?.getImageData(0,0,w,h);if(!original)return;
    const src=original.data,luma=new Uint8Array(w*h);for(let i=0,j=0;j<luma.length;i+=4,j++)luma[j]=Math.round(.2126*src[i]+.7152*src[i+1]+.0722*src[i+2]);sourceLuma.current=luma;
   }
   // Two reusable RGBA surfaces, shared for room/custom/exterior. Source brightness
   // is calculated once per photo, not re-read on every shade or pattern change.
   let surface:HTMLCanvasElement|undefined;
   if(shades.size>=2){const first=shades.keys().next().value;if(first!==undefined){surface=shades.get(first);shades.delete(first)}}
   surface??=document.createElement("canvas");if(surface.width!==w)surface.width=w;if(surface.height!==h)surface.height=h;
   const t=surface.getContext("2d");if(!t)return;
   const pixels=tintPixels.current??(tintPixels.current=t.createImageData(w,h)),data=pixels.data,luma=sourceLuma.current;
   const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),lookup=Array.from({length:256},(_,i)=>shadedPixel(i,i,i,rgb));
   for(let i=0,j=0;j<luma.length;i+=4,j++){const values=lookup[luma[j]];data[i]=values[0];data[i+1]=values[1];data[i+2]=values[2];data[i+3]=255;}
   t.putImageData(pixels,0,0);shades.set(hex,surface);return surface;
  }
  function paintWall(wall:Wall,flat=false){
   if(!exterior&&wall.pattern!=="plain")wall={...wall,accent:readableArtworkAccent(wall.colour,wall.accent)};
   const tinted=flat?undefined:tint(wall.colour);
   if(wall.pattern==="plain"){drawWall(ctx!,wall,w,h,tinted,undefined,undefined,undefined,undefined,flat);return;}
   // Only organic material masks need a full-photo accent tint. Vector and
   // raster artworks already carry their own pigments and source luminance.
   const accentTint=!flat&&isSurfaceProfile(wall.pattern)?tint(wall.accent):undefined;patternScratch.current??=document.createElement("canvas");
   const raw=activeTextures[wall.pattern],xs=wall.points.map(p=>p.x*w),ys=wall.points.map(p=>p.y*h);
   const visibleSide=Math.min(960,Math.max(160,Math.ceil(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)))));
   let texture:HTMLCanvasElement|undefined;
   if(raw){const cache=paintedTextureCache.current,key=[wall.pattern,wall.colour,wall.accent,visibleSide].join("|"),hit=cache.get(key);
    if(hit?.source===raw){texture=hit.canvas;cache.delete(key);cache.set(key,hit);}
    else{if(hit){hit.canvas.width=0;hit.canvas.height=0;cache.delete(key);}texture=colouredTexture(raw,wall.colour,wall.accent,visibleSide);cache.set(key,{source:raw,canvas:texture});
     while(cache.size>3){const oldest=cache.keys().next().value;if(oldest===undefined)break;const entry=cache.get(oldest);if(entry){entry.canvas.width=0;entry.canvas.height=0;}cache.delete(oldest);}}
   }
   drawWall(ctx!,wall,w,h,tinted,patternScratch.current,accentTint,flat?undefined:sourceLuma.current,texture,flat);
  }
  if(interiorDetail){
   ctx.fillStyle="#e8e5df";ctx.fillRect(0,0,w,h);
   const detailPoints=wallDetailCorners(points,w,h);
   paintWall({points:detailPoints,colour:base,accent,pattern:originalVisible?"plain":effectivePattern,opacity},true);
  }else if(!originalVisible){
   if(scene==="facade"){
    const styles=managedFacadeStyles(facadeStyles,target,{colour:base,accent,pattern:effectivePattern,opacity},wholeShade,facadeZones);
    // Group by base shade, so a single whole-exterior selection renders one tint.
    const colours=new Set(facadeZones.map(z=>styles[z.id]?.colour).filter((s):s is string=>!!s));
    for(const colour of colours)for(const zone of facadeZones){const style=styles[zone.id];if(style?.colour===colour)paintWall({...style,points:zone.points,mask:zone.mask});}
    // Explicit user-marked additions use the whole-exterior shade, not an automatic colour flood.
    const whole=target==="all"?base:wholeShade;
    for(const area of extraPaintAreas)drawWall(ctx,{points:area,colour:whole,accent:whole,pattern:"plain"},w,h,tint(whole));
    if(patchMode&&valid)drawWall(ctx,{points,colour:base,accent:base,pattern:"plain"},w,h,tint(base));
   }else{
    const roomWalls=allInterior?repaintInteriorWalls(walls,base,interiorWholeShade):walls;
    roomWalls.forEach((wall,index)=>{if(index!==editing)paintWall(wall)});
    if(valid)paintWall({points,colour:base,accent,pattern:effectivePattern,opacity,mask:currentMask});
   }
  }
  if((scene!=="facade"||patchMode)&&!originalVisible&&points.length>0&&!valid){
   ctx.save();ctx.strokeStyle="#ffe16a";ctx.fillStyle="#ffe16a";ctx.lineWidth=Math.max(2,w/300);
   ctx.beginPath();ctx.moveTo(points[0].x*w,points[0].y*h);
   for(const p of points.slice(1))ctx.lineTo(p.x*w,p.y*h);
   if(points.length===4)ctx.closePath();ctx.stroke();
   for(const [i,p] of points.entries()){
    ctx.beginPath();ctx.arc(p.x*w,p.y*h,Math.max(5,w/130),0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#222";ctx.font="bold "+Math.max(12,w/65)+"px Arial";
    ctx.fillText(String(i+1),p.x*w+9,p.y*h-8);ctx.fillStyle="#ffe16a";
   }ctx.restore();
  }
 },[points,base,accent,effectivePattern,opacity,walls,editing,ready,originalVisible,valid,currentMask,scene,target,facadeStyles,facadeZones,patchMode,extraPaintAreas,wholeShade,activeTextures,allInterior,interiorWholeShade,interiorDetail,exterior]);
 const openPhoto=useCallback((next:string, corners?:MaskCorner[],mask?:PhotoMask,preMarked?:Wall[],crop?:{x:number;y:number;w:number;h:number})=>{
  ++uploadGeneration.current;setUploadError("");
  const ticket=++generation.current;
  if(photoTimer.current!==null){window.clearTimeout(photoTimer.current);photoTimer.current=null;}
  for(const entry of paintedTextureCache.current.values()){entry.canvas.width=0;entry.canvas.height=0;}paintedTextureCache.current.clear();
  for(const surface of tintCache.current.values()){surface.width=0;surface.height=0;}tintCache.current.clear();sourceLuma.current=null;tintPixels.current=null;if(patternScratch.current){patternScratch.current.width=0;patternScratch.current.height=0;patternScratch.current=null;}
  if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}
  if(image.current){image.current.width=0;image.current.height=0;}
  setCloseUp(false);setPickDesignWall(false);setAllInterior(false);setPatchMode(false);setExtraPaintAreas([]);setPreset(corners&&mask?{points:corners,mask}:null);
  if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);
  setWalls([]);setEditing(null);url.current=next;image.current=null;setReady(false);setMessage("Loading photo…");
  setHistory(emptyMaskHistory());setShowOriginal(false);
  const img=new Image();pending.current=img;
  const release=()=>{if(pending.current===img&&photoTimer.current!==null){window.clearTimeout(photoTimer.current);photoTimer.current=null;}img.onload=null;img.onerror=null;img.src="";if(pending.current===img)pending.current=null;if(url.current===next&&next.startsWith("blob:")){URL.revokeObjectURL(next);url.current=null;}};
  img.onload=()=>{
   if(generation.current!==ticket){release();return;}
   const el=canvas.current;if(!el){release();setMessage("Preview not ready. Please retry the sample.");return;}
   if(!photoDimensionsAllowed(img.naturalWidth,img.naturalHeight)){release();setMessage("Photo dimensions are too large. Resize the image before trying again.");return;}
   const nav=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};
   const sw=Math.max(1,Math.round(img.naturalWidth*(crop?.w??1))),sh=Math.max(1,Math.round(img.naturalHeight*(crop?.h??1)));
   const size=paintPreviewDimensions(sw,sh,{memory:nav.deviceMemory,cores:nav.hardwareConcurrency,saveData:nav.connection?.saveData});
   const source=document.createElement("canvas");source.width=size.width;source.height=size.height;
   const context=source.getContext("2d");if(!context){release();setMessage("Photo preview unavailable on this device.");return;}
   try{if(crop)context.drawImage(img,img.naturalWidth*crop.x,img.naturalHeight*crop.y,img.naturalWidth*crop.w,img.naturalHeight*crop.h,0,0,source.width,source.height);else context.drawImage(img,0,0,source.width,source.height);}catch{release();setMessage("Could not prepare this photo. Try a smaller image.");return;}
   el.width=source.width;el.height=source.height;image.current=source;release();setReady(true);
   if(preMarked?.length){setWalls(preMarked);setAllInterior(true);setInteriorWholeShade(preMarked[0].colour);setHistory(emptyMaskHistory());setMessage("Both walls are ready. Change all colours or tap one wall for a design.");return;}
   if(corners){setHistory({points:corners,redo:[]});setMessage("Wall selected. Try a colour or pattern below.");return}
   setMessage("Tap the top-left, top-right, bottom-right and bottom-left corners of a visible wall. Avoid windows, doors and furniture.");
  };
  img.onerror=()=>{if(generation.current!==ticket){release();return;}release();image.current=null;setReady(false);setMessage("Image could not be opened. Try another photo.")};
  img.fetchPriority="high";
  photoTimer.current=window.setTimeout(()=>{if(generation.current!==ticket)return;release();image.current=null;setReady(false);setMessage("Photo loading timed out. Retry the sample or choose another photo.");},15000);
  img.src=next;
 },[setCloseUp,setPreset,setWalls,setEditing,setReady,setHistory,setShowOriginal,setMessage,setPatchMode,setExtraPaintAreas]);
 const openRoom=useCallback((photo:RoomPhoto="corner")=>{setScene("room");setRoomPhoto(photo);setMode("paint");setPattern("sunDisc");setPatternGroup("Signature");
 if(photo==="corner"){openPhoto(roomPhotos.corner,undefined,undefined,cornerRoomInitialWalls(latestBase.current));}else if(photo==="feature"){openPhoto(roomPhotos.feature,[{x:40/420,y:34/280},{x:373/420,y:37/280},{x:373/420,y:215/280},{x:40/420,y:215/280}],roomMask);}else{const crop={x:.60,y:0,w:.40,h:1};const points=cornerRoomWalls[1].points.map(p=>({x:(p.x-crop.x)/crop.w,y:(p.y-crop.y)/crop.h}));openPhoto(roomPhotos.daylight,points,{outline:points.map(p=>[p.x,p.y])},undefined,crop);}
 },[openPhoto,setScene]);
 function openFacade(id:FacadeSampleId=sampleId){
  if(scene==="facade"&&ready&&id===sampleId){++uploadGeneration.current;setUploadError("");return;}
  const next=facadeSamples.find(s=>s.id===id)??facadeSamples[0];
  setWholeShade(base);setScene("facade");setSampleId(next.id);setTarget("all");setFacadeStyles({});setMode("paint");setPattern("facadeTwoTone");setPatternGroup("Modern");openPhoto(houseJourneyImageUrl(next.src));
 }
 function chooseTarget(next:FacadeTarget){
  if(next===target)return;
  if(target==="all")setWholeShade(base);
  setPatchMode(false);setHistory(emptyMaskHistory());
  const saved=managedFacadeStyles(facadeStyles,target,currentStyle,wholeShade,facadeZones);
  setFacadeStyles(saved);setTarget(next);setShowOriginal(false);setCloseUp(false);
  const style=next==="all"?{colour:target==="all"?base:wholeShade,accent,opacity,pattern:"plain" as const}:saved[next];
  if(style){setAccent(style.accent);setOpacity(style.opacity);setMode(style.pattern==="plain"?"paint":"design");if(style.pattern!=="plain"){setPattern(style.pattern);setPatternGroup(isExteriorPattern(style.pattern)?exteriorGroupFor(style.pattern):groupForPattern(style.pattern));}
   if(onColourChange){onColourChange(style.colour);setOverride(null)}else setOverride({source:colour,value:style.colour});}
 }
 function applyInteriorStyle(wall:Wall,index:number){
  setAllInterior(false);setEditing(index);setHistory({points:wall.points,redo:[]});setAccent(wall.accent);setOpacity(wall.opacity??.78);
  setMode(wall.pattern==="plain"?"paint":"design");
  if(wall.pattern!=="plain"){setPattern(wall.pattern);setPatternGroup(isExteriorPattern(wall.pattern)?exteriorGroupFor(wall.pattern):groupForPattern(wall.pattern));}
  if(onColourChange){onColourChange(wall.colour);setOverride(null)}else setOverride({source:colour,value:wall.colour});
  setCloseUp(false);setShowOriginal(false);
 }
 function snapshotInterior(){
  return committedWalls;
 }
 function selectInterior(index:number|"all"|"new"){
  if(index==="all"&&allInterior){setPickDesignWall(false);return;}if(typeof index==="number"&&!allInterior&&editing===index)return;
  if(!allInterior&&points.length>0&&!valid){setMessage("Finish the four corners, or reset the incomplete wall before switching.");return;}
  const saved=snapshotInterior();setWalls(saved);setCloseUp(false);setShowOriginal(false);
  if(index==="all"){setPickDesignWall(false);setAllInterior(true);setInteriorWholeShade(base);setMode("paint");setEditing(null);setHistory(emptyMaskHistory());return;}
  if(index==="new"){setPickDesignWall(false);setAllInterior(false);setEditing(null);setHistory(emptyMaskHistory());setMode("paint");setMessage("Mark four corners of the next visible wall, avoiding openings.");return;}
  if(saved[index]){applyInteriorStyle(saved[index],index);if(pickDesignWall){setMode("design");setPickDesignWall(false);setMessage("Designing "+wallLabel(index)+". Choose an artwork below.");}}
 }
 function switchCustomSurface(outside:boolean){
  if(outside===customExterior)return;
  const next=changeWallContext(snapshotInterior(),outside),selected=allInterior?0:editing??(valid?next.length-1:-1);
  setCustomExterior(outside);setWalls(next);setAllInterior(false);setCloseUp(false);setShowOriginal(false);
  const wall=selected>=0?next[selected]:undefined;
  if(wall){applyInteriorStyle(wall,selected);return;}
  const retained=compatibleWallPattern(effectivePattern,outside);
  setMode(retained==="plain"?"paint":"design");setPattern(retained==="plain"?(outside?"facadeTwoTone":"sunDisc"):retained);
  setPatternGroup(retained==="plain"?(outside?"Modern":"Signature"):outside?exteriorGroupFor(retained):groupForPattern(retained));
 }
 function chooseMode(next:"paint"|"design"){
  if(next==="paint"){setPickDesignWall(false);if(next===mode)return;}
  if(allInterior&&next==="design"){setPickDesignWall(true);setMessage("Choose which wall gets the design. Select a wall button or tap the wall in the room preview.");return;}
  if(next===mode)return;

  setPatchMode(false);if(scene==="facade")setHistory(emptyMaskHistory());
  if(next==="design"&&mode==="paint"&&scene==="facade"&&target==="all"){
   const saved=managedFacadeStyles(facadeStyles,target,currentStyle,wholeShade,facadeZones);
   const selected=recommendedZone??facadeZones[0].id;
   setWholeShade(base);setFacadeStyles(saved);setTarget(selected);setCloseUp(false);
   const style=saved[selected];if(style){if(onColourChange){onColourChange(style.colour);setOverride(null)}else setOverride({source:colour,value:style.colour});}
  }
  setMode(next);setShowOriginal(false);
 }
 function chooseArtwork(key:Pattern){
  if(key===selectedPattern){setShowOriginal(false);return;}
  setPattern(key);setShowOriginal(false);
  if(!exterior&&!keepShades){setOpacity(.95);const [nextBase,nextAccent]=designPreviewPalette(key);if(onColourChange){onColourChange(nextBase);setOverride(null)}else setOverride({source:colour,value:nextBase});setAccent(nextAccent);}
 }
 function toggleOriginal(){setOriginalKey(styleKey);setShowOriginal(!originalVisible);}

 useEffect(()=>{const frame=requestAnimationFrame(()=>openRoom()),shades=tintCache.current,painted=paintedTextureCache.current;const invalidate=()=>{++generation.current;++uploadGeneration.current;};return ()=>{invalidate();cancelAnimationFrame(frame);if(photoTimer.current!==null){window.clearTimeout(photoTimer.current);photoTimer.current=null;}if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);url.current=null;for(const surface of shades.values()){surface.width=0;surface.height=0;}shades.clear();for(const entry of painted.values()){entry.canvas.width=0;entry.canvas.height=0;}painted.clear();sourceLuma.current=null;tintPixels.current=null;if(patternScratch.current){patternScratch.current.width=0;patternScratch.current.height=0;patternScratch.current=null;}if(image.current){image.current.width=0;image.current.height=0;image.current=null;}}},[openRoom]);
 async function load(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];e.target.value="";if(!f)return;setUploadError("");
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>10*1024*1024){
    ++uploadGeneration.current;
    setUploadError("Choose a JPG, PNG or WebP under 10 MB.");return;
  }
  // Validate the new file without cancelling a working or in-flight preview.
  const ticket=++uploadGeneration.current;
  try{
   const dimensions=encodedPhotoDimensions(new Uint8Array(await f.slice(0,1024*1024).arrayBuffer()));
   if(ticket!==uploadGeneration.current)return;
   if(!dimensions||!photoDimensionsAllowed(dimensions.width,dimensions.height)){setUploadError("Choose a still photo up to 16 megapixels. Resize unsupported or larger files first.");return;}
   setScene("custom");setCustomExterior(false);setPattern("sunDisc");setPatternGroup("Signature");setMode("paint");openPhoto(URL.createObjectURL(f));
  }catch{if(ticket===uploadGeneration.current)setUploadError("Could not read this photo. Try another image.");}
 }
 function addPoint(e:ReactPointerEvent<HTMLCanvasElement>){
  const start=tapStart.current;tapStart.current=null;if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>9)return;
  if((scene==="facade"&&!patchMode)||!ready||interiorDetail)return;
  const el=canvas.current;if(!el)return;const r=el.getBoundingClientRect();
  const point:MaskCorner={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
  if(!exterior&&(valid||allInterior)){const saved=snapshotInterior(),hit=saved.findIndex(w=>wallContainsPoint(w.points,point)&&(!w.mask||wallContainsPoint(w.mask.outline.map(([x,y])=>({x,y})),point)&&!(w.mask.holes??[]).some(h=>wallContainsPoint(h.map(([x,y])=>({x,y})),point))));if(hit>=0){if(!allInterior&&((editing!==null&&hit===editing)||(editing===null&&valid&&hit===walls.length)))return;setWalls(saved);applyInteriorStyle(saved[hit],hit);if(pickDesignWall){setMode("design");setPickDesignWall(false);setMessage("Designing "+wallLabel(hit)+". Choose an artwork below.");}}return;}
  if(points.length>=4)return;
  setHistory(prev=>addCorner(prev,point));
 }
 function saveImage(){
  const el=canvas.current;if(!el||!ready||awaitingArtwork||patchMode||(scene!=="facade"&&!valid&&(points.length>0||!walls.length))||originalVisible)return;
  el.toBlob(blob=>{if(!blob){setMessage("Could not export the photo. Try again.");return;}
   const address=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=address;a.download=interiorDetail?"neerva-wall-detail.png":"neerva-wall-colour-concept.png";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(address),2000);
  },"image/png");
 }
 return <section className="nbd-photo" aria-label="Private wall colour preview">
  <div className="paint-source"><button type="button" aria-pressed={scene==="room"} onClick={()=>{if(scene!=="room"||!ready)openRoom()}}>Sample room</button><button type="button" aria-pressed={scene==="facade"} onClick={()=>openFacade()}>Sample house exterior</button><label>Use my home photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={load}/></label></div>
  {scene==="room"&&<label className="paint-room-choice">Room sample <select aria-label="Room sample" value={roomPhoto} onChange={e=>openRoom(e.target.value as RoomPhoto)}><option value="corner">Corner living room · two ready walls</option><option value="feature">Feature wall · ready to paint</option><option value="daylight">Daylight room · ready to paint</option></select></label>}
  {scene==="room"&&roomPhoto==="daylight"&&<p className="paint-reference-note">Daylight photo detail with an unobstructed side wall and a ready paint area. Choose any shade or artwork immediately. Use Mark wall manually for a custom area, or upload your own photo.</p>}
  {scene==="room"&&roomPhoto==="daylight"&&ready&&<button type="button" onClick={()=>{setWalls([]);setPreset(null);setEditing(null);setAllInterior(false);setPickDesignWall(false);setMode("paint");setHistory(emptyMaskHistory());setCloseUp(false);setShowOriginal(false);setMessage("Tap four wall corners clockwise, avoiding doors, windows and furniture.");}}>Mark wall manually</button>}
  {uploadError&&<p role="alert" className="paint-preview-status">{uploadError}</p>}
  {scene==="facade"&&<div className="paint-sample-gallery" data-journey="premium" role="group" aria-label="Choose sample house">{[...facadeSamples].sort((a,b)=>(["compact-family","modern-courtyard","family","contemporary","villa"].indexOf(a.id)-["compact-family","modern-courtyard","family","contemporary","villa"].indexOf(b.id))).map(s=><button key={s.id} data-facade-sample={s.id} type="button" aria-pressed={s.id===sampleId} onClick={()=>openFacade(s.id)}><span className="paint-sample-photo"><NextImage src={houseJourneyImageUrl(s.src)} alt="" fill sizes={s.id==="compact-family"?"(max-width:900px) 90vw, 440px":"(max-width:600px) 46vw, (max-width:1100px) 42vw, 240px"} loading="lazy"/></span><strong>{s.label}</strong><small>{s.description}</small></button>)}</div>}
  {scene==="facade"&&<p className="paint-sample-feedback" role="status">{ready?"Previewing: ":message==="Loading photo…"?"Preparing: ":"Selected: "}<strong>{sample.label}</strong>{ready?" · Try a colour or wall design.":""}</p>}
  {scene==="custom"&&<fieldset className="paint-more"><legend>Photo surface</legend>{([false,true] as const).map(outside=><label key={String(outside)}><input type="radio" name="custom-wall-context" checked={customExterior===outside} onChange={()=>switchCustomSurface(outside)}/>{outside?"Exterior wall":"Interior wall"}</label>)}<small>Switching surface type keeps wall selections and colours; incompatible designs return to plain paint.</small></fieldset>}
  {!exterior&&ready&&(valid||walls.length>0)&&<div className="paint-targets interior-wall-targets" role="group" aria-label="Choose interior wall"><button type="button" aria-pressed={allInterior} onClick={()=>selectInterior("all")}>All walls</button>{walls.map((_,i)=><button type="button" key={i} aria-pressed={!allInterior&&editing===i} onClick={()=>selectInterior(i)}>{wallLabel(i)}</button>)}{valid&&editing===null&&<button type="button" aria-pressed={!allInterior} onClick={()=>selectInterior(walls.length)}>{wallLabel(walls.length)}</button>}{!(scene==="room"&&roomPhoto==="corner")&&<button type="button" disabled={!valid&&!allInterior} onClick={()=>selectInterior("new")}>+ Add wall</button>}</div>}
  {allInterior&&!exterior&&<p className="paint-preview-status">Choose a base colour for all marked walls. Existing designs stay unchanged.{base===interiorWholeShade&&walls.some(w=>w.colour!==base)&&<button type="button" className="paint-quiet" onClick={()=>{setWalls(w=>w.map(wall=>({...wall,colour:base})));setInteriorWholeShade(base);setShowOriginal(false)}}>Apply current colour to all</button>}</p>}
  <div className="paint-mode" role="group" aria-label="Paint preview mode"><button type="button" aria-pressed={mode==="paint"&&!pickDesignWall} onClick={()=>chooseMode("paint")}>Plain paint</button><button type="button" aria-pressed={mode==="design"||pickDesignWall} onClick={()=>chooseMode("design")}>Paint + design</button></div>
  {pickDesignWall&&allInterior&&<div role="group" aria-label="Choose which wall gets the design" className="paint-targets"><strong>Choose which wall gets the design</strong>{walls.map((_,i)=><button type="button" key={i} onClick={()=>selectInterior(i)}>{wallLabel(i)}</button>)}<button type="button" onClick={()=>setPickDesignWall(false)}>Cancel</button></div>}
  {scene==="facade"&&<div className="paint-targets" role="group" aria-label="Choose exterior paint area"><button type="button" aria-pressed={target==="all"} onClick={()=>chooseTarget("all")}>Full exterior</button>{facadeZones.map(z=><button key={z.id} type="button" aria-pressed={target===z.id} onClick={()=>chooseTarget(z.id)}>{z.label}{z.id===recommendedZone?" · Best for design":""}</button>)}</div>}
  <p className="paint-preview-status" role="status">{scene==="facade"&&ready?"Paint marked walls together or select one area. Visible plaster behind transparent railings is included; frames, timber and plants are protected where marked.":points.length===4&&!valid?"Corners cross or cover too little of the wall. Undo a corner and try again.":message}</p>
  <div className="paint-live-workspace"><div className="paint-live-preview" data-can-stick={ready&&(scene==="facade"||valid||walls.length>0)?"true":"false"}>
  {ready&&!exterior&&(valid||walls.length>0)?<div className="paint-mode interior-view-switch" role="group" aria-label="Interior view"><button type="button" aria-pressed={!interiorDetail} onClick={()=>{if(interiorDetail){setCloseUp(false);setShowOriginal(false)}}}>Full Room</button><button type="button" disabled={allInterior||!valid} aria-pressed={interiorDetail} onClick={()=>{if(!interiorDetail){setCloseUp(true);setShowOriginal(false)}}}>Wall Detail</button></div>:ready&&canInspect&&<button type="button" aria-pressed={closeUp} onClick={()=>setCloseUp(v=>!v)}>{closeUp?"See whole scene":"Inspect selected wall"}</button>}
  <div className="paint-canvas-frame" aria-busy={!ready} data-inspecting={closeUp&&canInspect&&!interiorDetail?"true":"false"}>
  {!ready&&scene!=="custom"&&!(scene==="room"&&roomPhoto==="daylight")&&message==="Loading photo…"&&<NextImage src={scene==="room"?roomPhotos[roomPhoto]:houseJourneyImageUrl(sample.src)} alt="Original sample while the colour preview prepares" fill unoptimized loading="eager" className="paint-photo-placeholder"/>}
  <canvas data-wall-texture={textureStatus} data-interior-view={interiorDetail?"detail":"room"} data-room-sample={scene==="room"?roomPhoto:undefined} data-sample={scene==="facade"?sampleId:scene} ref={canvas} role="img" aria-hidden={!ready} aria-label={scene==="facade"?"Live exterior paint preview of the selected facade sections":"Interior wall paint preview. Select a wall or mark four corners in a manual photo."} onPointerDown={e=>{if(e.isPrimary)tapStart.current={x:e.clientX,y:e.clientY,id:e.pointerId}}} onPointerUp={addPoint} onPointerCancel={()=>{tapStart.current=null}}
    style={{transform:wallZoom,transformOrigin:wallCentre,visibility:ready?"visible":"hidden",display:ready?"block":"none",width:"100%",height:"auto",cursor:interiorDetail?"default":!exterior&&(allInterior||valid)?"pointer":(scene!=="facade"||patchMode)&&points.length<4?"crosshair":"default",touchAction:"manipulation",borderRadius:12}}/>
  </div>
  {ready&&scene!=="facade"&&!exterior&&!allInterior&&editing===null&&!valid&&<div className="paint-actions paint-compact-actions" role="group" aria-label="Manual wall marking"><p role="status">Mark four corners clockwise · {points.length}/4</p><button type="button" disabled={!points.length} onClick={()=>setHistory(undoCorner)}>Undo last point</button><button type="button" disabled={!points.length} onClick={()=>setHistory(emptyMaskHistory())}>Reset points</button></div>}
  {ready&&scene!=="facade"&&!exterior&&!allInterior&&editing===null&&valid&&<button type="button" onClick={()=>{const saved=snapshotInterior();setWalls(saved);applyInteriorStyle(saved[saved.length-1],saved.length-1);setMessage("Wall confirmed. Choose paint or artwork.");}}>Confirm wall</button>}
  {interiorDetail&&<p className="paint-reference-note">Unobstructed wall design study · room lighting and furniture are shown in Full Room.</p>}
  {!ready&&message!=="Loading photo…"&&scene!=="custom"&&<button type="button" className="paint-retry" onClick={()=>scene==="room"?openRoom(roomPhoto):openFacade()}>Retry photo</button>}
  {ready&&scene==="facade"&&(sampleId==="compact-family"||sampleId==="modern-courtyard"||sampleId==="family")&&<p className="paint-reference-note">AI-generated architectural concept · full elevation shown. Not an approved construction drawing.</p>}
  {ready&&<div className="paint-actions paint-compact-actions paint-preview-actions" role="group" aria-label="Live preview actions"><button type="button" disabled={scene!=="facade"&&!valid&&!walls.length} aria-pressed={originalVisible} onClick={toggleOriginal}>{interiorDetail?(originalVisible?"Show design":"View plain colour"):originalVisible?(scene==="facade"?"Show new paint":"Show new colour"):"View original"}</button><button type="button" className="paint-primary" disabled={patchMode||originalVisible||awaitingArtwork||(scene!=="facade"&&!valid&&(points.length>0||!walls.length))} onClick={saveImage}>Save colour preview</button></div>}
  </div><div className="paint-live-tools">{colourControls}  {mode==="design"&&<><details className="paint-more"><summary>Curated colour combinations</summary><div className="paint-pairings">{colourPairings.map(pair=><button key={pair.id} type="button" aria-pressed={base===pair.base&&accent===pair.accent} onClick={()=>{if(onColourChange){onColourChange(pair.base);setOverride(null)}else setOverride({source:colour,value:pair.base});setAccent(pair.accent);setShowOriginal(false)}}><span aria-hidden="true"><i style={{background:pair.base}}/><i style={{background:pair.accent}}/></span>{pair.label}</button>)}</div><small>Digital base and pattern colours, not physical shade samples.</small></details><h3 className="paint-pattern-title">{exterior?"Exterior Design Collections":"Interior Wall Design Collections"}</h3><p className="paint-design-hint">{exterior?"Exterior-appropriate paint effects only. Choose one accent surface; use exterior-rated materials.":"Choose a feature-wall design. Pre-marked masks protect furniture; keep manual selections clear of furniture and openings."}</p><div className="paint-pattern-groups" role="group" aria-label="Design collections">{groups.map(group=><button type="button" key={group} aria-pressed={activeGroup===group} onClick={()=>{setPatternGroup(group)}}>{group}</button>)}</div><div className="paint-collection-intro"><strong>{guide.title}</strong><p>{guide.description}</p></div><p className="paint-pattern-current" role="status">{textureStatus==="loading"?"Loading detailed texture · vector preview available. ":textureStatus==="fallback"?"Detailed texture unavailable · vector preview active. ":""}Selected: {finishes[selectedPattern].name}{isRetiredPattern(selectedPattern)?" · previous design preserved":""}</p><div className="wall-pattern-options" role="group" aria-label="Wall design samples">
   {shownPatterns.map(key=>{const [previewBase,chosenAccent]=exterior||keepShades||selectedPattern===key?[base,accent]:designPreviewPalette(key);const previewAccent=exterior?chosenAccent:readableArtworkAccent(previewBase,chosenAccent);const intensity=selectedPattern===key?opacity:1;return <button type="button" key={key} aria-pressed={selectedPattern===key} onClick={()=>chooseArtwork(key)}>
    {textures[key]?<WallTextureSwatch texture={textures[key]} base={previewBase} accent={previewAccent} intensity={intensity} preserveComposition={fullArtwork(key)}/>:isSurfaceProfile(key)?<StudioSurfaceSwatch profile={key} base={previewBase} accent={previewAccent} intensity={intensity}/>:<WallArtworkSwatch pattern={key} base={previewBase} accent={previewAccent} intensity={intensity}/>}<span>{finishes[key].name}</span>{textures[key]===null&&hasWallRaster(key)&&<small aria-hidden="true" className="paint-finish-type">Illustrated fallback</small>}
   </button>})}
  </div>{!exterior&&<label className="paint-keep-shades"><input type="checkbox" checked={keepShades} onChange={e=>setKeepShades(e.target.checked)}/> Keep my current colours when choosing artwork</label>}{designRecipe?<p className="paint-collection-tip"><strong>{designRecipe[1]}:</strong> {designRecipe[2]}</p>:<p className="paint-collection-tip">{guide.tip}</p>}{execution&&<details className="paint-more"><summary>How to paint this design</summary><p><strong>{execution.method}</strong> · {execution.difficulty} · {execution.coverage}</p><p>{execution.finish}</p><p>{execution.execution}</p><small>{execution.maintenance}</small></details>}<label>Pattern colour <input type="color" value={accent} onChange={e=>{setAccent(e.target.value);setShowOriginal(false)}}/></label>{renderedAccent!==accent&&<p className="paint-pattern-current" role="status">Contrast-adjusted preview pigment: <strong>{renderedAccent.toUpperCase()}</strong>. Your chosen base shade is unchanged.</p>}<label>Design intensity · {Math.round(opacity*100)}% <input type="range" min=".2" max="1" step=".05" value={opacity} onChange={e=>{setOpacity(Number(e.target.value));setShowOriginal(false)}}/></label>
  </>}
</div></div>
  <ShadeReferenceCard entries={shadeEntries} compact quoteValue={base} application={exterior?"exterior":"interior"}/>
  {ready&&scene==="facade"&&<div className="paint-actions paint-compact-actions" role="group" aria-label="Exterior editing options"><details className="paint-more"><summary>More exterior options</summary><button type="button" onClick={()=>{if(target!=="all")chooseTarget("all");setMode("paint");setCloseUp(false);setHistory(emptyMaskHistory());setShowOriginal(false);setPatchMode(v=>!v)}}>{patchMode?"Cancel wall correction":"Correct a missed wall area"}</button>{patchMode&&<><p role="status">Tap four corners of the exposed wall clockwise. Avoid windows, doors and plants.</p><button type="button" disabled={!valid||extraPaintAreas.length>=8} onClick={()=>{setExtraPaintAreas(a=>[...a,points]);setHistory(emptyMaskHistory());setPatchMode(false)}}>Apply wall correction</button><button type="button" onClick={()=>setHistory(undoCorner)}>Undo corner</button></>}{extraPaintAreas.length>0&&<button type="button" onClick={()=>setExtraPaintAreas(a=>a.slice(0,-1))}>Undo last wall correction</button>}<button type="button" onClick={()=>{setFacadeStyles({});setTarget("all");setMode("paint");setCloseUp(false);setShowOriginal(false);setPatchMode(false);setExtraPaintAreas([]);setHistory(emptyMaskHistory())}}>Reset exterior sections</button></details></div>}
  {ready&&scene!=="facade"&&!allInterior&&!(scene==="room"&&roomPhoto==="corner")&&<div className="paint-actions paint-wall-actions paint-compact-actions" role="group" aria-label="Wall preview actions">
      <button className="paint-quiet" type="button" disabled={!valid||originalVisible} onClick={()=>{
    const wall={points,colour:base,pattern:effectivePattern,accent,opacity,mask:currentMask};
    setWalls(current=>commitInteriorWall(current,editing,wall));setAllInterior(false);
    setCloseUp(false);setHistory(emptyMaskHistory());setEditing(null);setMessage("Wall kept. Mark another wall or edit a saved wall below.");
   }}>Keep wall & select another</button>

   <details className="paint-more" open={!valid&&points.length>0?true:undefined}><summary>Wall selection tools</summary><div className="paint-edit-grid">
      {walls.map((_,i)=><button type="button" key={i} aria-pressed={editing===i} onClick={()=>{
    selectInterior(i);
   }}>Edit wall {i+1}</button>)}
   {editing!==null&&<button type="button" onClick={()=>{
    setWalls(current=>current.filter((_,i)=>i!==editing));setEditing(null);setHistory(emptyMaskHistory());setShowOriginal(false);
   }}>Remove this wall</button>}

   <button type="button" disabled={!points.length} onClick={()=>{setCloseUp(false);setHistory(undoCorner)}}>Undo corner</button>
   <button type="button" disabled={!history.redo.length} onClick={()=>setHistory(redoCorner)}>Redo corner</button>
   <button type="button" className="paint-quiet" onClick={()=>{setAllInterior(false);setCloseUp(false);setHistory(emptyMaskHistory());setEditing(null);setShowOriginal(false)}}>Reset wall selection ({points.length}/4)</button>
   </div></details>
  </div>}
  {showReport&&<details className="paint-more" onToggle={e=>setReportOpen(e.currentTarget.open)}><summary>Detailed Studio report</summary>{reportOpen&&<StudioPremiumTools product="colour_studio" base={base} accent={mode==="design"?renderedAccent:base} room={exterior?"Selected exterior colour":scene==="room"&&roomPhoto==="corner"&&!allInterior&&editing!==null?wallLabel(editing) :"Selected interior colour"}/>}</details>}
  <p className="nbd-disclaimer">Corner, feature-wall and exterior samples have pre-marked surfaces. Other photos require manual wall selection. The 100 gaj sample is design inspiration, not a verified construction drawing. Full exterior colours all marked areas, not glass, timber, plants or neighbouring buildings. For your own photo, mark a flat wall and avoid openings. Preview shades retain lighting; edges and colours are approximate. Verify physical shade cards and measured wall area before buying.</p>
 </section>;
}


