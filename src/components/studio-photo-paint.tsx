"use client";
import {useEffect,useRef,useState,type ChangeEvent,type PointerEvent as ReactPointerEvent} from "react";
import {addCorner,emptyMaskHistory,redoCorner,undoCorner,validWallMask,type MaskCorner} from "@/modules/studio/mask-editor";
export function StudioPhotoPaint({colour}:{colour:string}){
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLImageElement|null>(null),url=useRef<string|null>(null);
 const [history,setHistory]=useState(emptyMaskHistory),[ready,setReady]=useState(false);
 const [showOriginal,setShowOriginal]=useState(false),[message,setMessage]=useState("Choose a local photo, then mark four corners of one wall clockwise.");
 const points=history.points,valid=validWallMask(points);
 useEffect(()=>()=>{if(url.current)URL.revokeObjectURL(url.current)},[]);
 useEffect(()=>{
  const el=canvas.current,img=image.current;if(!el||!img||!ready)return;
  const ctx=el.getContext("2d");if(!ctx)return;const {width:w,height:h}=el;
  ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  if(valid&&!showOriginal){
   ctx.save();ctx.beginPath();ctx.moveTo(points[0].x*w,points[0].y*h);
   for(const p of points.slice(1))ctx.lineTo(p.x*w,p.y*h);
   ctx.closePath();ctx.clip();ctx.globalCompositeOperation="color";ctx.fillStyle=colour;ctx.fillRect(0,0,w,h);ctx.restore();
  }
  if(points.length>0&&!valid){
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
 },[points,colour,ready,showOriginal,valid]);
 function load(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];e.target.value="";if(!f)return;
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>10*1024*1024){
    setMessage("Choose a JPG, PNG or WebP under 10 MB.");return;
  }
  if(url.current)URL.revokeObjectURL(url.current);
  const next=URL.createObjectURL(f);url.current=next;image.current=null;setReady(false);
  setHistory(emptyMaskHistory());setShowOriginal(false);
  const img=new Image();
  img.onload=()=>{
   if(url.current!==next)return;
   const el=canvas.current;if(!el)return;
   const scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
   el.width=Math.max(1,Math.round(img.naturalWidth*scale));
   el.height=Math.max(1,Math.round(img.naturalHeight*scale));
   image.current=img;setReady(true);
   setMessage("Tap four wall corners in order. Undo if a corner was misplaced.");
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
  const el=canvas.current;if(!el||!ready||!valid)return;
  el.toBlob(blob=>{if(!blob){setMessage("Could not export the photo. Try again.");return;}
   const address=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=address;a.download="neerva-wall-colour-concept.png";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(address),2000);
  },"image/png");
 }
 return <section className="nbd-photo" aria-label="Private wall colour preview">
  <h2>Paint your own wall photograph</h2>
  <p>Your photo stays in this browser. No upload or AI segmentation occurs.</p>
  <label>Choose a photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={load}/></label>
  <p role="status">{points.length===4&&!valid?"Corners cross or cover too little of the wall. Undo a corner and try again.":message}</p>
  <canvas ref={canvas} role="img" aria-label="Local house photograph; tap four wall corners to recolour" onPointerDown={addPoint}
    style={{display:ready?"block":"none",width:"100%",height:"auto",cursor:points.length<4?"crosshair":"default",touchAction:"manipulation",borderRadius:12}}/>
  {ready&&<div className="nbd-buttons" style={{flexWrap:"wrap"}}>
   <button type="button" disabled={!points.length} onClick={()=>setHistory(undoCorner)}>Undo corner</button>
   <button type="button" disabled={!history.redo.length} onClick={()=>setHistory(redoCorner)}>Redo corner</button>
   <button type="button" disabled={!valid} aria-pressed={showOriginal} onClick={()=>setShowOriginal(v=>!v)}>{showOriginal?"Show new colour":"View original"}</button>
   <button type="button" onClick={()=>{setHistory(emptyMaskHistory());setShowOriginal(false)}}>Select wall again ({points.length}/4)</button>
   <button type="button" disabled={!valid} onClick={saveImage}>Save colour preview</button>
  </div>}
  <p className="nbd-disclaimer">Manual polygon preview preserves much of the existing light and texture; edge accuracy and screen shades are approximate. Verify physical shade cards and measured wall area before buying.</p>
 </section>;
}
