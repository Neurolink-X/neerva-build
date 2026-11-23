"use client";
import {useEffect,useRef,useState,type ChangeEvent,type PointerEvent as ReactPointerEvent} from "react";
import {addCorner,emptyMaskHistory,redoCorner,undoCorner,validWallMask,type MaskCorner} from "@/modules/studio/mask-editor";
import {finishes,patternKeys,type Pattern,type Motif} from "@/modules/studio/wall-patterns";
type Wall={points:MaskCorner[];colour:string;accent:string;pattern:Pattern};
function drawWall(ctx:CanvasRenderingContext2D,wall:Wall,w:number,h:number){
 const corners=wall.points.map(p=>({x:p.x*w,y:p.y*h}));
 ctx.save();
 ctx.beginPath();
 corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();ctx.clip();
 // Apply the chosen paint hue while retaining the photo’s original light and shadows.
 ctx.globalCompositeOperation="color";ctx.fillStyle=wall.colour;ctx.globalAlpha=1;
 ctx.fillRect(0,0,w,h);
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
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLImageElement|null>(null),url=useRef<string|null>(null);
 const [history,setHistory]=useState(emptyMaskHistory),[ready,setReady]=useState(false);
 const [showOriginal,setShowOriginal]=useState(false),[message,setMessage]=useState("Choose a local photo, then mark four corners of one wall clockwise.");
 const points=history.points,valid=validWallMask(points);
 useEffect(()=>()=>{if(url.current)URL.revokeObjectURL(url.current)},[]);
 useEffect(()=>{
  const el=canvas.current,img=image.current;if(!el||!img||!ready)return;
  const ctx=el.getContext("2d");if(!ctx)return;const {width:w,height:h}=el;
  ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  if(!showOriginal){
   walls.forEach((wall,index)=>{if(index!==editing)drawWall(ctx,wall,w,h)});
   if(valid)drawWall(ctx,{points,colour:base,accent,pattern},w,h);
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
 },[points,base,accent,pattern,walls,editing,ready,showOriginal,valid]);
 function load(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];e.target.value="";if(!f)return;
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>10*1024*1024){
    setMessage("Choose a JPG, PNG or WebP under 10 MB.");return;
  }
  openPhoto(URL.createObjectURL(f));
 }
 function openPhoto(next:string){
  if(url.current?.startsWith("blob:"))URL.revokeObjectURL(url.current);
  setWalls([]);setEditing(null);url.current=next;image.current=null;setReady(false);
  setHistory(emptyMaskHistory());setShowOriginal(false);
  const img=new Image();
  img.onload=()=>{
   if(url.current!==next)return;
   const el=canvas.current;if(!el)return;
   const scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
   el.width=Math.max(1,Math.round(img.naturalWidth*scale));
   el.height=Math.max(1,Math.round(img.naturalHeight*scale));
   image.current=img;setReady(true);
   setMessage("Tap the top-left corner first, then top-right, bottom-right and bottom-left. Avoid windows or doors if possible.");
  };
  img.onerror=()=>{if(url.current!==next)return;image.current=null;setReady(false);setMessage("Image could not be opened. Try another photo.")};
  img.src=next;
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
  <h2>Preview colour on your own wall</h2>
  <p>Preview a wall finish below, then mark four corners on a room photo. Keep each wall to see the combination across the room.</p>
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
  <button type="button" onClick={()=>openPhoto("/images/studio/daylight-living-room.webp")}>Try a furnished living room</button>
  <label>Choose a photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={load}/></label>
  <p role="status">{points.length===4&&!valid?"Corners cross or cover too little of the wall. Undo a corner and try again.":message}</p>
  <canvas ref={canvas} role="img" aria-label="Photo of your wall. Tap its four corners clockwise, starting top-left, to choose a painting region" onPointerDown={addPoint}
    style={{display:ready?"block":"none",width:"100%",height:"auto",cursor:points.length<4?"crosshair":"default",touchAction:"manipulation",borderRadius:12}}/>
  {ready&&<div className="nbd-buttons" style={{flexWrap:"wrap"}}>
   <button type="button" disabled={!valid||showOriginal} onClick={()=>{
    const wall={points,colour:base,pattern,accent};
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

