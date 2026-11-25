
"use client";
import {useEffect,useRef,useState} from "react";
import type {RoomLab} from "@/modules/home/room-lab";
import {buildRoomScene,type RoomScene} from "@/modules/home/room-renderer";
export default function RoomRealView({room}:{room:RoomLab}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<RoomScene|null>(null);
 const [light,setLight]=useState<"day"|"evening">("day"),[angle,setAngle]=useState(42),[error,setError]=useState(false),[zoom,setZoom]=useState(1);
 useEffect(()=>{const el=host.current;if(!el)return;let engine:RoomScene|undefined;try{engine=buildRoomScene(el);scene.current=engine}catch{const t=window.setTimeout(()=>setError(true),0);return()=>clearTimeout(t)}return()=>{engine?.dispose();scene.current=null}},[]);
 useEffect(()=>{scene.current?.update(room,light,angle,zoom)},[room,light,angle,zoom]);
 return <div className="room-real-view"><div ref={host} className="room-webgl" role="img" aria-label="Interactive 3D room concept with furniture and lighting"/>{error&&<p role="status">3D rendering is unavailable on this device. Switch to Room perspective or Edit floor plan; your design is unchanged.</p>}<div className="room-light-controls" role="group" aria-label="Lighting"><button type="button" aria-pressed={light==="day"} onClick={()=>setLight("day")}>Daylight</button><button type="button" aria-pressed={light==="evening"} onClick={()=>setLight("evening")}>Evening</button></div><label>Camera angle <input type="range" min="15" max="75" step="1" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label><label>Zoom <input type="range" min=".8" max="1.4" step=".1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><p>Live rendered concept; furniture proportions are approximate. Lighting and colours are not a physical product simulation.</p></div>
}
