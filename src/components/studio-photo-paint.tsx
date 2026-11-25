"use client";
import {useCallback,useEffect,useRef,useState,type ChangeEvent,type PointerEvent as ReactPointerEvent} from "react";
import {addCorner,emptyMaskHistory,redoCorner,undoCorner,validWallMask,type MaskCorner} from "@/modules/studio/mask-editor";
import {encodedPhotoDimensions,photoDimensionsAllowed,maxPreviewSide} from "@/modules/studio/photo-budget";
import {finishes,patternKeys,type Pattern,type Motif} from "@/modules/studio/wall-patterns";
type PhotoMask={outline:number[][];holes?:number[][][]};
const roomMask:PhotoMask={outline:[[40,34],[373,37],[373,215],[361,215],[360,188],[354,177],[345,174],[326,175],[332,164],[295,164],[290,169],[151,168],[145,162],[125,164],[95,161],[99,177],[85,178],[72,181],[66,188],[65,215],[40,215]].map(([x,y])=>[x/420,y/280])};
const facadeMask:PhotoMask={outline:[[474/750,32/250],[598/750,32/250],[598/750,134/250],[571/750,151/250],[571/750,200/250],[475/750,200/250]],holes:[
 [[480/750,57/250],[571/750,57/250],[571/750,120/250],[480/750,120/250]],
 [[480/750,156/250],[571/750,156/250],[571/750,201/250],[480/750,201/250]]
]};
type Wall={mask?:PhotoMask;points:MaskCorner[];colour:string;accent:string;pattern:Pattern};
function drawWall(ctx:CanvasRenderingContext2D,wall:Wall,w:number,h:number){
 const corners=wall.points.map(p=>({x:p.x*w,y:p.y*h}));
 ctx.save();
 ctx.beginPath();
 corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();ctx.clip();
 if(wall.mask){
  ctx.beginPath();
  for(const ring of [wall.mask.outline,...(wall.mask.holes??[])]){
   ring.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();
  }
  ctx.clip("evenodd");
 }
 // Apply the chosen paint hue while retaining the photo’s original light and shadows.
 ctx.globalCompositeOperation="color";ctx.fillStyle=wall.colour;ctx.globalAlpha=1;
 ctx.fillRect(0,0,w,h);
 ctx.globalCompositeOperation="multiply";ctx.globalAlpha=.62;ctx.fillRect(0,0,w,h);
 if(wall.pattern!=="plain"){
  const [a,b,c,d]=corners;
  const at=(u:number,v:number)=>({
   x:(1-v)*(a.x+(b.x-a.x)*u)+v*(d.x+(c.x-d.x)*u),
   y:(1-v)*(a.y+(b.y-a.y)*u)+v*(d.y+(c.y-d.y)*u)
  });
  ctx.globalCompositeOperation="source-over";ctx.globalAlpha=.78;
  ctx.strokeStyle=ctx.fillStyle=wall.accent;ctx.lineWidth=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)*.006);
  for(const motif of finishes[wall.pattern].motifs as Motif[]){
   ctx.beginPath();
   motif.points.forEach(([u,v],i)=>{const p=at(u,v);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
   if(motif.filled){ctx.closePath();ctx.fill()}else ctx.stroke();
  }
 }
 ctx.restore();
}
export function StudioPhotoPaint({colour,onColourChange}:{colour:string;onColourChange?:(colour:string)=>void}){
 const [walls,setWalls]=useState<Wall[]>([]),[editing,setEditing]=useState<number|null>(null);
 const [pattern,setPattern]=useState<Pattern>("plain"),[accent,setAccent]=useState("#c4925f");
 const [override,setOverride]=useState<{source:string;value:string}|null>(null);
 const base=override?.source===colour?override.value:colour;
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLCanvasElement|null>(null),url=useRef<string|null>(null),pending=useRef<HTMLImageElement|null>(null),generation=useRef(0);
 const [history,setHistory]=useState(emptyMaskHistory),[ready,setReady]=useState(false);
 const [closeUp,setCloseUp]=useState(false);
 const [showOriginal,setShowOriginal]=useState(false),[message,setMessage]=useState("Choose a local photo, then mark four corners of one wall clockwise.");
 const points=history.points,valid=validWallMask(points);
 const wallCentre=valid?`${points.reduce((sum,p)=>sum+p.x,0)*25}% ${points.reduce((sum,p)=>sum+p.y,0)*25}%`:undefined;
 const wallWidth=valid?Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)):1;
 const wallZoom=closeUp&&valid?`scale(${Math.min(4,Math.max(1.6,.94/wallWidth))})`:undefined;
 const [preset,setPreset]=useState<{points:MaskCorner[];mask:PhotoMask}|null>(null);
 const currentMask=editing!==null?walls[editing]?.mask:preset?.points===points?preset.mask:undefined;
 useEffect(()=>{
  const el=canvas.current,img=image.current;if(!el||!img||!ready)return;
  const ctx=el.getContext("2d");if(!ctx)return;const {width:w,height:h}=el;
  ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  if(!showOriginal){
   walls.forEach((wall,index)=>{if(index!==editing)drawWall(ctx,wall,w,h)});
   if(valid)drawWall(ctx,{points,colour:base,accent,pattern,mask:currentMask},w,h);
  }
  if(!showOriginal&&points.length>0&&!valid){
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
 },[points,base,accent,pattern,walls,editing,ready,showOriginal,valid,currentMask]);
 const openPhoto=useCallback((next:string, corners?:MaskCorner[],mask?:PhotoMask)=>{
  const ticket=++generation.current;
  if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}
  if(image.current){image.current.width=0;image.current.height=0;}
  setCloseUp(false);setPreset(corners&&mask?{points:corners,mask}:null);
  if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);
  setWalls([]);setEditing(null);url.current=next;image.current=null;setReady(false);
  setHistory(emptyMaskHistory());setShowOriginal(false);
  const img=new Image();pending.current=img;
  const release=()=>{img.onload=null;img.onerror=null;img.src="";if(pending.current===img)pending.current=null;if(url.current===next&&next.startsWith("blob:")){URL.revokeObjectURL(next);url.current=null;}};
  img.onload=()=>{
   if(generation.current!==ticket){release();return;}
   const el=canvas.current;if(!el){release();return;}
   if(!photoDimensionsAllowed(img.naturalWidth,img.naturalHeight)){release();setMessage("Photo dimensions are too large. Resize the image before trying again.");return;}
   const scale=Math.min(1,maxPreviewSide/Math.max(img.naturalWidth,img.naturalHeight));
   const source=document.createElement("canvas");source.width=Math.max(1,Math.round(img.naturalWidth*scale));source.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const context=source.getContext("2d");if(!context){release();setMessage("Photo preview unavailable on this device.");return;}
   try{context.drawImage(img,0,0,source.width,source.height);}catch{release();setMessage("Could not prepare this photo. Try a smaller image.");return;}
   el.width=source.width;el.height=source.height;image.current=source;release();setReady(true);
   if(corners){setHistory({points:corners,redo:[]});setMessage("Wall selected. Try a colour or pattern below.");return}
   setMessage("Tap the top-left corner first, then top-right, bottom-right and bottom-left. Avoid windows or doors if possible.");
  };
  img.onerror=()=>{if(generation.current!==ticket){release();return;}release();image.current=null;setReady(false);setMessage("Image could not be opened. Try another photo.")};
  img.src=next;
 },[]);
 const openRoom=useCallback(()=>{openPhoto("/images/studio/paint-room.webp",[{x:40/420,y:34/280},{x:373/420,y:37/280},{x:373/420,y:215/280},{x:40/420,y:215/280}],roomMask)},[openPhoto]);
 function openFacade(){openPhoto("/images/studio/finished.webp",[{x:474/750,y:32/250},{x:598/750,y:32/250},{x:598/750,y:200/250},{x:474/750,y:200/250}],facadeMask)}
 useEffect(()=>{const frame=requestAnimationFrame(openRoom);return ()=>{++generation.current;cancelAnimationFrame(frame);if(pending.current){pending.current.onload=null;pending.current.onerror=null;pending.current.src="";pending.current=null;}if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);url.current=null;if(image.current){image.current.width=0;image.current.height=0;image.current=null;}}},[openRoom]);
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
   openPhoto(URL.createObjectURL(f));
  }catch{if(ticket===generation.current)setMessage("Could not read this photo. Try another image.");}
 }
 function addPoint(e:ReactPointerEvent<HTMLCanvasElement>){
  if(!ready||points.length>=4)return;
  const el=canvas.current;if(!el)return;const r=el.getBoundingClientRect();
  const point:MaskCorner={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
  setHistory(prev=>addCorner(prev,point));
 }
 function saveImage(){
  const el=canvas.current;if(!el||!ready||(!valid&&(points.length>0||!walls.length))||showOriginal)return;
  el.toBlob(blob=>{if(!blob){setMessage("Could not export the photo. Try again.");return;}
   const address=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=address;a.download="neerva-wall-colour-concept.png";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(address),2000);
  },"image/png");
 }
 return <section className="nbd-photo" aria-label="Private wall colour preview">
  <div className="nbd-buttons"><button type="button" onClick={openRoom}>Sample room</button><button type="button" onClick={openFacade}>Sample house exterior</button><label>Use my home photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={load}/></label></div>
  <p role="status">{points.length===4&&!valid?"Corners cross or cover too little of the wall. Undo a corner and try again.":message}</p>
  {ready&&valid&&<button type="button" aria-pressed={closeUp} onClick={()=>setCloseUp(v=>!v)}>{closeUp?"See whole scene":"Inspect selected wall"}</button>}
  <div style={{overflow:"hidden",borderRadius:12}}>
  <canvas ref={canvas} role="img" aria-label="Photo of your wall. Tap its four corners clockwise, starting top-left, to choose a painting region" onPointerDown={addPoint}
    style={{transform:wallZoom,transformOrigin:wallCentre,display:ready?"block":"none",width:"100%",height:"auto",cursor:points.length<4?"crosshair":"default",touchAction:"manipulation",borderRadius:12}}/>
  </div>
  <label>Wall design <select value={pattern} onChange={e=>setPattern(e.target.value as Pattern)}>
   {patternKeys.map(key=><option key={key} value={key}>{finishes[key].name}</option>)}
  </select></label>
  {pattern!=="plain"&&<label>Pattern colour <input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label>}
  <div className="wall-pattern-options" aria-label="Wall design samples">
   {patternKeys.map(key=><button type="button" key={key} aria-pressed={pattern===key} onClick={()=>setPattern(key)}>
    <svg viewBox="0 0 150 100" aria-hidden="true" style={{background:base}}>
     {(finishes[key].motifs as Motif[]).map((motif,i)=><polyline key={i} points={motif.points.map(([x,y])=>[x*150,y*100].join(",")).join(" ")} fill={motif.filled?accent:"none"} stroke={accent} strokeWidth="1.2"/>)}
    </svg><span>{finishes[key].name}</span>
   </button>)}
  </div>
  {ready&&<div className="nbd-buttons" style={{flexWrap:"wrap"}}>
   <button type="button" disabled={!valid||showOriginal} onClick={()=>{
    const wall={points,colour:base,pattern,accent,mask:currentMask};
    setWalls(current=>editing===null?[...current,wall]:current.map((w,i)=>i===editing?wall:w));
    setHistory(emptyMaskHistory());setEditing(null);setMessage("Wall kept. Mark another wall or edit a saved wall below.");
   }}>Keep wall & select another</button>
   {walls.map((wall,i)=><button type="button" key={i} aria-pressed={editing===i} onClick={()=>{
    setEditing(i);setHistory({points:wall.points,redo:[]});setAccent(wall.accent);setPattern(wall.pattern);
    if(onColourChange){onColourChange(wall.colour);setOverride(null)}else setOverride({source:colour,value:wall.colour});
    setShowOriginal(false);
   }}>Edit wall {i+1}</button>)}
   {editing!==null&&<button type="button" onClick={()=>{
    setWalls(current=>current.filter((_,i)=>i!==editing));setEditing(null);setHistory(emptyMaskHistory());setShowOriginal(false);
   }}>Remove this wall</button>}
   <button type="button" disabled={!points.length} onClick={()=>setHistory(undoCorner)}>Undo corner</button>
   <button type="button" disabled={!history.redo.length} onClick={()=>setHistory(redoCorner)}>Redo corner</button>
   <button type="button" disabled={!valid&&!walls.length} aria-pressed={showOriginal} onClick={()=>setShowOriginal(v=>!v)}>{showOriginal?"Show new colour":"View original"}</button>
   <button type="button" onClick={()=>{setHistory(emptyMaskHistory());setEditing(null);setShowOriginal(false)}}>Reset wall selection ({points.length}/4)</button>
   <button type="button" disabled={(!valid&&(points.length>0||!walls.length))||showOriginal} onClick={saveImage}>Save colour preview</button>
  </div>}
  <p className="nbd-disclaimer">Tip: select a single flat wall rather than the whole house. Manual polygon preview preserves much of the existing light and texture; edge accuracy and screen shades are approximate. Verify physical shade cards and measured wall area before buying.</p>
 </section>;
}


