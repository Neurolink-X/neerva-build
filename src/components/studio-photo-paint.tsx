"use client";
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type ChangeEvent,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {addCorner,emptyMaskHistory,redoCorner,undoCorner,validWallMask,type MaskCorner} from "@/modules/studio/mask-editor";
import {encodedPhotoDimensions,photoDimensionsAllowed,maxPreviewSide} from "@/modules/studio/photo-budget";
import {finishes,patternGroups,groupForPattern,isRetiredPattern,type PatternGroup,type Pattern,type Motif} from "@/modules/studio/wall-patterns";
import NextImage from "next/image";
import {isSurfaceProfile} from "@/modules/studio/surface-texture";
import {surfaceCanvas,StudioSurfaceSwatch} from "./studio-surface-swatch";
import {colourPairings} from "@/modules/studio/colour-families";
import {facadeSamples,stylesForTarget,activePattern,shadedPixel,type PhotoMask,type PaintStyle,type FacadeStyles,type FacadeTarget,type FacadeSampleId} from "@/modules/studio/facade-paint";
const roomMask:PhotoMask={outline:[[40,34],[373,37],[373,215],[361,215],[360,188],[354,177],[345,174],[326,175],[332,164],[295,164],[290,169],[151,168],[145,162],[125,164],[95,161],[99,177],[85,178],[72,181],[66,188],[65,215],[40,215]].map(([x,y])=>[x/420,y/280])};
type Wall={mask?:PhotoMask;points:MaskCorner[];colour:string;accent:string;pattern:Pattern;opacity?:number};
function drawWall(ctx:CanvasRenderingContext2D,wall:Wall,w:number,h:number,tinted?:HTMLCanvasElement,patternSurface?:HTMLCanvasElement,accentTint?:HTMLCanvasElement){
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
 if(tinted){ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;ctx.drawImage(tinted,0,0,w,h);}
 else{ctx.globalCompositeOperation="color";ctx.fillStyle=wall.colour;ctx.globalAlpha=1;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation="multiply";ctx.globalAlpha=.35;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}

 if(wall.pattern!=="plain"){
  if(corners.length!==4){ctx.restore();return;}
  const [a,b,c,d]=corners;
  const at=(u:number,v:number)=>({
   x:(1-v)*(a.x+(b.x-a.x)*u)+v*(d.x+(c.x-d.x)*u),
   y:(1-v)*(a.y+(b.y-a.y)*u)+v*(d.y+(c.y-d.y)*u)
  });
  // Mask an accent tint with the motif: the design inherits the same photographic
  // highlights and shadows as the base paint. One reusable scratch canvas, only for patterns.
  const layer=patternSurface&&accentTint?patternSurface.getContext("2d"):null;
  if(layer&&patternSurface){if(patternSurface.width!==w)patternSurface.width=w;if(patternSurface.height!==h)patternSurface.height=h;layer.clearRect(0,0,w,h);}
  const brush=layer??ctx;brush.save();
  brush.globalCompositeOperation="source-over";brush.globalAlpha=wall.opacity??.78;
  brush.strokeStyle=brush.fillStyle=wall.accent;const weight=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)*.006);brush.lineCap="round";brush.lineJoin="round";
  // Organic finishes use a continuous material mask rather than stripes or flat line art.
  const tile=layer&&isSurfaceProfile(wall.pattern)?surfaceCanvas(wall.pattern):null;
  if(tile){
   const left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),right=Math.max(...corners.map(p=>p.x)),bottom=Math.max(...corners.map(p=>p.y));
   brush.save();brush.beginPath();corners.forEach((p,i)=>i?brush.lineTo(p.x,p.y):brush.moveTo(p.x,p.y));brush.closePath();brush.clip();
   brush.globalAlpha=wall.opacity??.78;brush.drawImage(tile,left,top,right-left,bottom-top);brush.restore();
  }else{  for(const motif of finishes[wall.pattern].motifs as Motif[]){
   brush.globalAlpha=(wall.opacity??.78)*(motif.alpha??1);brush.lineWidth=weight*(motif.weight??1);brush.beginPath();
   motif.points.forEach(([u,v],i)=>{const p=at(u,v);if(i===0)brush.moveTo(p.x,p.y);else brush.lineTo(p.x,p.y)});
   if(motif.filled){brush.closePath();brush.fill()}else brush.stroke();
  }
  }
  if(layer&&patternSurface&&accentTint){brush.globalCompositeOperation="source-in";brush.globalAlpha=1;brush.drawImage(accentTint,0,0,w,h);}
  brush.restore();
  if(layer&&patternSurface){ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;ctx.drawImage(patternSurface,0,0,w,h);}
 }
 ctx.restore();
}
export function StudioPhotoPaint({colour,onColourChange,colourControls}:{colour:string;onColourChange?:(colour:string)=>void;colourControls?:ReactNode}){
 const [walls,setWalls]=useState<Wall[]>([]),[editing,setEditing]=useState<number|null>(null);
 const [pattern,setPattern]=useState<Pattern>("sunDisc"),[accent,setAccent]=useState("#c4925f");
 const [patternGroup,setPatternGroup]=useState<PatternGroup>("Signature");
 const [mode,setMode]=useState<"paint"|"design">("paint"),[opacity,setOpacity]=useState(.78);
 const [scene,setScene]=useState<"room"|"facade"|"custom">("room"),[target,setTarget]=useState<FacadeTarget>("all"),[facadeStyles,setFacadeStyles]=useState<FacadeStyles>({});
 const [sampleId,setSampleId]=useState<FacadeSampleId>("family");
 const sample=facadeSamples.find(s=>s.id===sampleId)??facadeSamples[0];
 const facadeZones=sample.zones;
 const [originalKey,setOriginalKey]=useState("");
 const [wholeShade,setWholeShade]=useState(colour);

 const [override,setOverride]=useState<{source:string;value:string}|null>(null);
 const base=override?.source===colour?override.value:colour;
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLCanvasElement|null>(null),url=useRef<string|null>(null),pending=useRef<HTMLImageElement|null>(null),generation=useRef(0);
 const photoTimer=useRef<number|null>(null);
 const tintCache=useRef(new Map<string,HTMLCanvasElement>()),patternScratch=useRef<HTMLCanvasElement|null>(null);
 const sourceLuma=useRef<Uint8Array|null>(null),tintPixels=useRef<ImageData|null>(null);
 const [history,setHistory]=useState(emptyMaskHistory),[ready,setReady]=useState(false);
 const [closeUp,setCloseUp]=useState(false);
 const [patchMode,setPatchMode]=useState(false),[extraPaintAreas,setExtraPaintAreas]=useState<MaskCorner[][]>([]);
 const [showOriginal,setShowOriginal]=useState(false),[message,setMessage]=useState("Choose a local photo, then mark four corners of one wall clockwise.");
 const points=history.points,valid=validWallMask(points);
 const effectivePattern=activePattern(mode,pattern);
 const currentStyle:PaintStyle={colour:base,accent,pattern:effectivePattern,opacity};
 const styleKey=JSON.stringify([base,accent,effectivePattern,opacity,target,sampleId,extraPaintAreas,patchMode,wholeShade,walls,editing,points,facadeStyles]);
 const originalVisible=showOriginal&&originalKey===styleKey;
 const focusPoints=scene==="facade"?facadeZones.find(z=>z.id===target)?.points??[]:points;
 const canInspect=focusPoints.length===4&& (scene==="facade"||valid);
 const wallCentre=canInspect?`${focusPoints.reduce((sum,p)=>sum+p.x,0)*25}% ${focusPoints.reduce((sum,p)=>sum+p.y,0)*25}%`:undefined;
 const wallWidth=canInspect?Math.max(...focusPoints.map(p=>p.x))-Math.min(...focusPoints.map(p=>p.x)):1;
 const wallZoom=closeUp&&canInspect?`scale(${Math.min(4,Math.max(1.6,.94/wallWidth))})`:undefined;
 const [preset,setPreset]=useState<{points:MaskCorner[];mask:PhotoMask}|null>(null);
 const currentMask=editing!==null?walls[editing]?.mask:preset&&preset.points.length===points.length&&preset.points.every((p,i)=>p.x===points[i].x&&p.y===points[i].y)?preset.mask:undefined;
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
  function paintWall(wall:Wall){
   const tinted=tint(wall.colour);
   if(wall.pattern==="plain"){drawWall(ctx!,wall,w,h,tinted);return;}
   const accentTint=tint(wall.accent);patternScratch.current??=document.createElement("canvas");
   drawWall(ctx!,wall,w,h,tinted,patternScratch.current,accentTint);
  }
  if(!originalVisible){
   if(scene==="facade"){
    const styles=stylesForTarget(facadeStyles,target,{colour:base,accent,pattern:effectivePattern,opacity},facadeZones);
    // Group by base shade, so a single whole-exterior selection renders one tint.
    const colours=new Set(facadeZones.map(z=>styles[z.id]?.colour).filter((s):s is string=>!!s));
    for(const colour of colours)for(const zone of facadeZones){const style=styles[zone.id];if(style?.colour===colour)paintWall({...style,points:zone.points,mask:zone.mask});}
    // Explicit user-marked additions use the whole-exterior shade, not an automatic colour flood.
    const whole=target==="all"?base:wholeShade;
    for(const area of extraPaintAreas)drawWall(ctx,{points:area,colour:whole,accent:whole,pattern:"plain"},w,h,tint(whole));
    if(patchMode&&valid)drawWall(ctx,{points,colour:base,accent:base,pattern:"plain"},w,h,tint(base));
   }else{
    walls.forEach((wall,index)=>{if(index!==editing)paintWall(wall)});
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
 },[points,base,accent,effectivePattern,opacity,walls,editing,ready,originalVisible,valid,currentMask,scene,target,facadeStyles,facadeZones,patchMode,extraPaintAreas,wholeShade]);
 const openPhoto=useCallback((next:string, corners?:MaskCorner[],mask?:PhotoMask)=>{
  const ticket=++generation.current;
  if(photoTimer.current!==null){window.clearTimeout(photoTimer.current);photoTimer.current=null;}
  for(const surface of tintCache.current.values()){surface.width=0;surface.height=0;}tintCache.current.clear();sourceLuma.current=null;tintPixels.current=null;if(patternScratch.current){patternScratch.current.width=0;patternScratch.current.height=0;patternScratch.current=null;}
  if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}
  if(image.current){image.current.width=0;image.current.height=0;}
  setCloseUp(false);setPatchMode(false);setExtraPaintAreas([]);setPreset(corners&&mask?{points:corners,mask}:null);
  if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);
  setWalls([]);setEditing(null);url.current=next;image.current=null;setReady(false);setMessage("Loading photo…");
  setHistory(emptyMaskHistory());setShowOriginal(false);
  const img=new Image();pending.current=img;
  const release=()=>{if(pending.current===img&&photoTimer.current!==null){window.clearTimeout(photoTimer.current);photoTimer.current=null;}img.onload=null;img.onerror=null;img.src="";if(pending.current===img)pending.current=null;if(url.current===next&&next.startsWith("blob:")){URL.revokeObjectURL(next);url.current=null;}};
  img.onload=()=>{
   if(generation.current!==ticket){release();return;}
   const el=canvas.current;if(!el){release();setMessage("Preview not ready. Please retry the sample.");return;}
   if(!photoDimensionsAllowed(img.naturalWidth,img.naturalHeight)){release();setMessage("Photo dimensions are too large. Resize the image before trying again.");return;}
   const scale=Math.min(1,maxPreviewSide/Math.max(img.naturalWidth,img.naturalHeight));
   const source=document.createElement("canvas");source.width=Math.max(1,Math.round(img.naturalWidth*scale));source.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const context=source.getContext("2d");if(!context){release();setMessage("Photo preview unavailable on this device.");return;}
   try{context.drawImage(img,0,0,source.width,source.height);}catch{release();setMessage("Could not prepare this photo. Try a smaller image.");return;}
   el.width=source.width;el.height=source.height;image.current=source;release();setReady(true);
   if(corners){setHistory({points:corners,redo:[]});setMessage("Wall selected. Try a colour or pattern below.");return}
   setMessage(next.startsWith("/images/studio/")?"Sample photo ready. Choose a wall or shade.":"Tap the top-left corner first, then top-right, bottom-right and bottom-left. Avoid windows or doors if possible.");
  };
  img.onerror=()=>{if(generation.current!==ticket){release();return;}release();image.current=null;setReady(false);setMessage("Image could not be opened. Try another photo.")};
  img.fetchPriority="high";
  photoTimer.current=window.setTimeout(()=>{if(generation.current!==ticket)return;release();image.current=null;setReady(false);setMessage("Photo loading timed out. Retry the sample or choose another photo.");},15000);
  img.src=next;
 },[setCloseUp,setPreset,setWalls,setEditing,setReady,setHistory,setShowOriginal,setMessage,setPatchMode,setExtraPaintAreas]);
 const openRoom=useCallback(()=>{setScene("room");setMode("paint");openPhoto("/images/studio/paint-room.webp",[{x:40/420,y:34/280},{x:373/420,y:37/280},{x:373/420,y:215/280},{x:40/420,y:215/280}],roomMask)},[openPhoto,setScene]);
 function openFacade(id:FacadeSampleId=sampleId){
  if(scene==="facade"&&ready&&id===sampleId)return;
  const next=facadeSamples.find(s=>s.id===id)??facadeSamples[0];
  setWholeShade(base);setScene("facade");setSampleId(next.id);setTarget("all");setFacadeStyles({});setMode("paint");openPhoto(next.src);
 }
 function chooseTarget(next:FacadeTarget){
  if(next===target)return;
  if(target==="all")setWholeShade(base);
  setPatchMode(false);setHistory(emptyMaskHistory());
  const saved=stylesForTarget(facadeStyles,target,currentStyle,facadeZones);
  setFacadeStyles(saved);setTarget(next);setShowOriginal(false);setCloseUp(false);
  const style=next==="all"?undefined:saved[next];
  if(style){setAccent(style.accent);setOpacity(style.opacity);setMode(style.pattern==="plain"?"paint":"design");if(style.pattern!=="plain"){setPattern(style.pattern);setPatternGroup(groupForPattern(style.pattern));}
   if(onColourChange){onColourChange(style.colour);setOverride(null)}else setOverride({source:colour,value:style.colour});}
 }
 function chooseMode(next:"paint"|"design"){
  setPatchMode(false);if(scene==="facade")setHistory(emptyMaskHistory());
  if(next==="design"&&mode==="paint"&&scene==="facade"&&target==="all"){
   setWholeShade(base);setFacadeStyles(stylesForTarget(facadeStyles,target,currentStyle,facadeZones));setTarget("right");setCloseUp(false);
  }
  setMode(next);setShowOriginal(false);
 }
 function toggleOriginal(){setOriginalKey(styleKey);setShowOriginal(!originalVisible);}

 useEffect(()=>{const frame=requestAnimationFrame(openRoom),shades=tintCache.current;const invalidate=()=>{++generation.current;};return ()=>{invalidate();cancelAnimationFrame(frame);if(photoTimer.current!==null){window.clearTimeout(photoTimer.current);photoTimer.current=null;}if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);url.current=null;for(const surface of shades.values()){surface.width=0;surface.height=0;}shades.clear();sourceLuma.current=null;tintPixels.current=null;if(patternScratch.current){patternScratch.current.width=0;patternScratch.current.height=0;patternScratch.current=null;}if(image.current){image.current.width=0;image.current.height=0;image.current=null;}}},[openRoom]);
 async function load(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];e.target.value="";if(!f)return;
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>10*1024*1024){
    setMessage("Choose a JPG, PNG or WebP under 10 MB.");return;
  }
  const ticket=++generation.current;
  if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}
  if(url.current?.startsWith("blob:")){URL.revokeObjectURL(url.current);url.current=null;}
  try{
   const dimensions=encodedPhotoDimensions(new Uint8Array(await f.slice(0,1024*1024).arrayBuffer()));
   if(ticket!==generation.current)return;
   if(!dimensions||!photoDimensionsAllowed(dimensions.width,dimensions.height)){setMessage("Choose a still photo up to 16 megapixels. Resize unsupported or larger files first.");return;}
   setScene("custom");openPhoto(URL.createObjectURL(f));
  }catch{if(ticket===generation.current)setMessage("Could not read this photo. Try another image.");}
 }
 function addPoint(e:ReactPointerEvent<HTMLCanvasElement>){
  if((scene==="facade"&&!patchMode)||!ready||points.length>=4)return;
  const el=canvas.current;if(!el)return;const r=el.getBoundingClientRect();
  const point:MaskCorner={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
  setHistory(prev=>addCorner(prev,point));
 }
 function saveImage(){
  const el=canvas.current;if(!el||!ready||patchMode||(scene!=="facade"&&!valid&&(points.length>0||!walls.length))||originalVisible)return;
  el.toBlob(blob=>{if(!blob){setMessage("Could not export the photo. Try again.");return;}
   const address=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=address;a.download="neerva-wall-colour-concept.png";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(address),2000);
  },"image/png");
 }
 return <section className="nbd-photo" aria-label="Private wall colour preview">
  <div className="paint-source"><button type="button" aria-pressed={scene==="room"} onClick={openRoom}>Sample room</button><button type="button" aria-pressed={scene==="facade"} onClick={()=>openFacade()}>Sample house exterior</button><label>Use my home photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={load}/></label></div>
  {scene==="facade"&&<div className="paint-sample-gallery" role="group" aria-label="Choose sample house">{facadeSamples.map(s=><button key={s.id} type="button" aria-pressed={s.id===sampleId} onClick={()=>openFacade(s.id)}><span className="paint-sample-photo"><NextImage src={s.src} alt="" fill sizes="(max-width:600px) 46vw, (max-width:900px) 42vw, 240px" loading="lazy"/></span><strong>{s.label}</strong><small>{s.description}</small></button>)}</div>}
  {scene==="facade"&&<p className="paint-sample-feedback" role="status">{ready?"Previewing: ":message==="Loading photo…"?"Preparing: ":"Selected: "}<strong>{sample.label}</strong>{ready?" · Try a colour or wall design.":""}</p>}
  <div className="paint-mode" role="group" aria-label="Paint preview mode"><button type="button" aria-pressed={mode==="paint"} onClick={()=>chooseMode("paint")}>Plain paint</button><button type="button" aria-pressed={mode==="design"} onClick={()=>chooseMode("design")}>Paint + design</button></div>
  {scene==="facade"&&<div className="paint-targets" role="group" aria-label="Choose exterior paint area"><button type="button" aria-pressed={target==="all"} onClick={()=>chooseTarget("all")}>Full exterior</button>{facadeZones.map(z=><button key={z.id} type="button" aria-pressed={target===z.id} onClick={()=>chooseTarget(z.id)}>{z.label}</button>)}</div>}
  <p className="paint-preview-status" role="status">{scene==="facade"&&ready?"Full exterior applies the chosen shade to all marked surfaces. Choose a section for a separate accent or pattern. Windows, timber, plants and neighbouring buildings stay unchanged.":points.length===4&&!valid?"Corners cross or cover too little of the wall. Undo a corner and try again.":message}</p>
  <div className="paint-live-workspace"><div className="paint-live-preview" data-can-stick={ready&&(scene==="facade"||valid)?"true":"false"}>
  {ready&&canInspect&&<button type="button" aria-pressed={closeUp} onClick={()=>setCloseUp(v=>!v)}>{closeUp?"See whole scene":"Inspect selected wall"}</button>}
  <div className="paint-canvas-frame" aria-busy={!ready} data-inspecting={closeUp&&canInspect?"true":"false"}>
  {!ready&&scene!=="custom"&&message==="Loading photo…"&&<NextImage src={scene==="room"?"/images/studio/paint-room.webp":sample.src} alt="Original sample while the colour preview prepares" fill unoptimized loading="eager" className="paint-photo-placeholder"/>}
  <canvas data-sample={scene==="facade"?sampleId:scene} ref={canvas} role="img" aria-hidden={!ready} aria-label={scene==="facade"?"Live exterior paint preview of the selected facade sections":"Photo of your wall. Tap four corners clockwise to choose a painting region"} onPointerDown={addPoint}
    style={{transform:wallZoom,transformOrigin:wallCentre,visibility:ready?"visible":"hidden",display:ready?"block":"none",width:"100%",height:"auto",cursor:(scene!=="facade"||patchMode)&&points.length<4?"crosshair":"default",touchAction:"manipulation",borderRadius:12}}/>
  </div>
  {!ready&&message!=="Loading photo…"&&scene!=="custom"&&<button type="button" className="paint-retry" onClick={()=>scene==="room"?openRoom():openFacade()}>Retry photo</button>}
  {ready&&scene==="facade"&&sampleId==="compact-family"&&<p className="paint-reference-note">AI-generated architectural concept · full elevation shown. Not an approved construction drawing.</p>}
  {ready&&<div className="paint-actions paint-compact-actions paint-preview-actions" role="group" aria-label="Live preview actions"><button type="button" disabled={scene!=="facade"&&!valid&&!walls.length} aria-pressed={originalVisible} onClick={toggleOriginal}>{originalVisible?(scene==="facade"?"Show new paint":"Show new colour"):"View original"}</button><button type="button" className="paint-primary" disabled={patchMode||originalVisible||(scene!=="facade"&&!valid&&(points.length>0||!walls.length))} onClick={saveImage}>Save colour preview</button></div>}
  </div><div className="paint-live-tools">{colourControls}  {mode==="design"&&<><details className="paint-more"><summary>Curated colour combinations</summary><div className="paint-pairings">{colourPairings.map(pair=><button key={pair.id} type="button" aria-pressed={base===pair.base&&accent===pair.accent} onClick={()=>{if(onColourChange){onColourChange(pair.base);setOverride(null)}else setOverride({source:colour,value:pair.base});setAccent(pair.accent);setShowOriginal(false)}}><span aria-hidden="true"><i style={{background:pair.base}}/><i style={{background:pair.accent}}/></span>{pair.label}</button>)}</div><small>Digital base and pattern colours, not physical shade samples.</small></details><h3 className="paint-pattern-title">Signature wall designs</h3><p className="paint-design-hint">Choose a mural, stencil or decorative finish. Your wall colour and accent colour control the palette.</p><div className="paint-pattern-groups" role="group" aria-label="Design collections">{(Object.keys(patternGroups) as PatternGroup[]).map(group=><button type="button" key={group} aria-pressed={patternGroup===group} onClick={()=>setPatternGroup(group)}>{group}</button>)}</div><p className="paint-pattern-current">Applied: {finishes[pattern].name}{isRetiredPattern(pattern)?" · previous design preserved":""}</p><div className="wall-pattern-options" role="group" aria-label="Wall design samples">
   {([...(patternGroups[patternGroup] as readonly Pattern[]),...(isRetiredPattern(pattern)&&patternGroup===groupForPattern(pattern)?[pattern]:[])]).map(key=><button type="button" key={key} aria-pressed={pattern===key} onClick={()=>{setPattern(key);setShowOriginal(false)}}>
    {isSurfaceProfile(key)?<StudioSurfaceSwatch profile={key} base={base} accent={accent}/>:<svg viewBox="0 0 150 100" aria-hidden="true" style={{background:base}}>
     {(finishes[key].motifs as Motif[]).map((motif,i)=><polyline key={i} points={motif.points.map(([x,y])=>[x*150,y*100].join(",")).join(" ")} fill={motif.filled?accent:"none"} stroke={motif.filled?"none":accent} opacity={(motif.alpha??1)*opacity} strokeWidth={.9*(motif.weight??1)} strokeLinecap="round" strokeLinejoin="round"/>)}
    </svg>}<span>{finishes[key].name}</span>
   </button>)}
  </div><label>Pattern colour <input type="color" value={accent} onChange={e=>{setAccent(e.target.value);setShowOriginal(false)}}/></label><label>Design intensity · {Math.round(opacity*100)}% <input type="range" min=".2" max="1" step=".05" value={opacity} onChange={e=>{setOpacity(Number(e.target.value));setShowOriginal(false)}}/></label>
  </>}
</div></div>
  {ready&&scene==="facade"&&<div className="paint-actions paint-compact-actions" role="group" aria-label="Exterior editing options"><details className="paint-more"><summary>More exterior options</summary><button type="button" onClick={()=>{if(target!=="all")chooseTarget("all");setMode("paint");setCloseUp(false);setHistory(emptyMaskHistory());setShowOriginal(false);setPatchMode(v=>!v)}}>{patchMode?"Cancel wall correction":"Correct a missed wall area"}</button>{patchMode&&<><p role="status">Tap four corners of the exposed wall clockwise. Avoid windows, doors and plants.</p><button type="button" disabled={!valid||extraPaintAreas.length>=8} onClick={()=>{setExtraPaintAreas(a=>[...a,points]);setHistory(emptyMaskHistory());setPatchMode(false)}}>Apply wall correction</button><button type="button" onClick={()=>setHistory(undoCorner)}>Undo corner</button></>}{extraPaintAreas.length>0&&<button type="button" onClick={()=>setExtraPaintAreas(a=>a.slice(0,-1))}>Undo last wall correction</button>}<button type="button" onClick={()=>{setFacadeStyles({});setTarget("all");setMode("paint");setCloseUp(false);setShowOriginal(false);setPatchMode(false);setExtraPaintAreas([]);setHistory(emptyMaskHistory())}}>Reset exterior sections</button></details></div>}
  {ready&&scene!=="facade"&&<div className="paint-actions paint-wall-actions paint-compact-actions" role="group" aria-label="Wall preview actions">
      <button className="paint-quiet" type="button" disabled={!valid||originalVisible} onClick={()=>{
    const wall={points,colour:base,pattern:effectivePattern,accent,opacity,mask:currentMask};
    setWalls(current=>editing===null?[...current,wall]:current.map((w,i)=>i===editing?wall:w));
    setHistory(emptyMaskHistory());setEditing(null);setMessage("Wall kept. Mark another wall or edit a saved wall below.");
   }}>Keep wall & select another</button>

   <details className="paint-more" open={!valid&&points.length>0?true:undefined}><summary>Wall selection tools</summary><div className="paint-edit-grid">
      {walls.map((wall,i)=><button type="button" key={i} aria-pressed={editing===i} onClick={()=>{
    setEditing(i);setHistory({points:wall.points,redo:[]});setAccent(wall.accent);setMode(wall.pattern==="plain"?"paint":"design");if(wall.pattern!=="plain"){setPattern(wall.pattern);setPatternGroup(groupForPattern(wall.pattern));}setOpacity(wall.opacity??.78);
    if(onColourChange){onColourChange(wall.colour);setOverride(null)}else setOverride({source:colour,value:wall.colour});
    setShowOriginal(false);
   }}>Edit wall {i+1}</button>)}
   {editing!==null&&<button type="button" onClick={()=>{
    setWalls(current=>current.filter((_,i)=>i!==editing));setEditing(null);setHistory(emptyMaskHistory());setShowOriginal(false);
   }}>Remove this wall</button>}

   <button type="button" disabled={!points.length} onClick={()=>{setCloseUp(false);setHistory(undoCorner)}}>Undo corner</button>
   <button type="button" disabled={!history.redo.length} onClick={()=>setHistory(redoCorner)}>Redo corner</button>
   <button type="button" className="paint-quiet" onClick={()=>{setCloseUp(false);setHistory(emptyMaskHistory());setEditing(null);setShowOriginal(false)}}>Reset wall selection ({points.length}/4)</button>
   </div></details>
  </div>}
  <p className="nbd-disclaimer">Sample photos and architectural concepts have pre-marked paintable surfaces. The 100 gaj sample is design inspiration, not a verified construction drawing. Full exterior colours all marked areas, not glass, timber, plants or neighbouring buildings. For your own photo, mark a flat wall and avoid openings. Preview shades retain lighting; edges and colours are approximate. Verify physical shade cards and measured wall area before buying.</p>
 </section>;
}


