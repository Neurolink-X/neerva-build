"use client";
import {useEffect,useRef,useState} from "react";
import type {RenderSnapshot,RenderFrame,RenderJob} from "../../public/studio-render-v1";

type Phase="idle"|"working"|"done"|"error"|"cancelled";
export function BrowserArchitectureRender({capture}:{capture:()=>RenderSnapshot|null}){
 const worker=useRef<Worker|null>(null),canvas=useRef<HTMLCanvasElement>(null),timer=useRef<number|null>(null),sequence=useRef(0),visible=useRef(true);
 const [phase,setPhase]=useState<Phase>("idle"),[quality,setQuality]=useState<"quick"|"fine">("quick"),[progress,setProgress]=useState(0),[message,setMessage]=useState(""),[hasFrame,setHasFrame]=useState(false);
 function stop(){sequence.current++;worker.current?.terminate();worker.current=null;if(timer.current!==null)window.clearTimeout(timer.current);timer.current=null;}
 useEffect(()=>{visible.current=true;return()=>{visible.current=false;sequence.current++;worker.current?.terminate();if(timer.current!==null)window.clearTimeout(timer.current)}},[]);
 useEffect(()=>{const pause=()=>{if(document.hidden&&worker.current){stop();setPhase("cancelled");setMessage("Rendering stopped while this tab was hidden. You can restart when ready.");}};document.addEventListener("visibilitychange",pause);return()=>document.removeEventListener("visibilitychange",pause)},[]);
 function start(){
  stop();setHasFrame(false);setProgress(0);
  const snapshot=capture();if(!snapshot||!snapshot.boxes.length){setPhase("error");setMessage("Open your 3D model first, then try again.");return}
  if(typeof Worker==="undefined"){setPhase("error");setMessage("This browser does not support background rendering. Use the interactive 3D preview.");return}
  const longest=quality==="fine"?560:320,aspect=Math.max(.5,Math.min(2,snapshot.camera.aspect??1.5));
  const width=aspect>=1?longest:Math.round(longest*aspect),height=aspect>=1?Math.round(longest/aspect):longest,samples=quality==="fine"?12:4;
  const token=sequence.current;
  const fail=(reason:string)=>{if(token!==sequence.current||!visible.current)return;stop();setPhase("error");setMessage(reason);};
  try{
   const instance=new Worker("/studio-render-v1.js",{type:"module"});worker.current=instance;
   setPhase("working");setMessage("Generating a ray-traced view from your selected 3D geometry…");
   timer.current=window.setTimeout(()=>fail("Rendering reached the device time limit. Try Quick render or use the 3D preview."),90000);
   instance.onerror=()=>fail("Rendering could not start on this device. Try again or use the 3D preview.");
   instance.onmessageerror=()=>fail("Render data could not be read. Please try again.");
   instance.onmessage=(event:MessageEvent<RenderFrame|{error:string}>)=>{
    if(token!==sequence.current||!visible.current)return;
    const frame=event.data;if("error" in frame){fail(frame.error);return;}
    if(frame.width!==width||frame.height!==height||frame.samples!==samples||!Number.isInteger(frame.completed)||frame.completed<1||frame.completed>samples||!(frame.pixels instanceof Uint8ClampedArray)||frame.pixels.length!==width*height*4){fail("The renderer returned an invalid image.");return}
    const el=canvas.current,ctx=el?.getContext("2d");if(!el||!ctx){fail("Image preview is unavailable.");return}
    el.width=width;el.height=height;ctx.putImageData(new ImageData(new Uint8ClampedArray(frame.pixels),width,height),0,0);
    setHasFrame(true);setProgress(Math.round(frame.completed/samples*100));
    if(frame.completed===samples){stop();setPhase("done");setMessage("Render ready. This is a concept visualization of the selected geometry.");}
   };
   const job:RenderJob={...snapshot,width,height,samples};instance.postMessage(job);
  }catch{fail("Rendering is unavailable on this browser. The interactive 3D view remains available.");}
 }
 function cancel(){stop();setPhase("cancelled");setMessage("Rendering cancelled. You can start again at any time.");}
 function save(){canvas.current?.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="neerva-architecture-render.png";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)},"image/png")}
 return <section aria-label="Browser architectural rendering" style={{marginBlock:"16px",minWidth:0}}>
  <h3>Realistic image render (beta)</h3><p>Create a ray-traced concept image of the current camera view. All processing stays on your device; no paid rendering service.</p>
  <div className="nbd-buttons"><button type="button" aria-pressed={quality==="quick"} disabled={phase==="working"} onClick={()=>setQuality("quick")}>Quick render</button><button type="button" aria-pressed={quality==="fine"} disabled={phase==="working"} onClick={()=>setQuality("fine")}>Higher detail</button></div>
  <div className="nbd-buttons"><button type="button" onClick={start} disabled={phase==="working"}>Generate realistic image</button>{phase==="working"&&<button type="button" onClick={cancel}>Cancel render</button>}{phase==="done"&&<button type="button" onClick={save}>Save render (PNG)</button>}</div>
  {phase==="working"&&<progress aria-label="Render progress" max={100} value={progress}/>}
  {message&&<p role="status">{message}</p>}
  <canvas ref={canvas} hidden={!hasFrame} aria-label="Ray-traced architectural concept image" style={{display:hasFrame?"block":"none",maxWidth:"100%",width:"100%",height:"auto",borderRadius:12}}/>
  <p className="nbd-disclaimer">Uses bounded light bounces and simplified scene materials. Not a certified architectural drawing or a photographic-quality guarantee. Camera changes require a new render.</p>
 </section>;
}
