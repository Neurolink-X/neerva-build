"use client";
import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {roomModel,baseline,walls,type Shade,type Finish} from "@/modules/studio/room";
import type {Room} from "@/modules/studio/layout";
import {RoomCutaway} from "./room-cutaway";
type Props={room:Room;finish:Finish;shades:Shade[];split?:number};
function colour(id:string,shades:Shade[]){return shades.find(s=>s.id===id)?.hex??"#e9e3d8"}
function pieces(size:number,openings:{offset:number;width:number;sill:number;height:number}[],height:number){
 const x=[0,size,...openings.flatMap(o=>[o.offset,o.offset+o.width])].filter(Number.isFinite).sort((a,b)=>a-b).filter((v,i,a)=>i===0||v>a[i-1]+.1);
 const y=[0,height,...openings.flatMap(o=>[o.sill,o.sill+o.height])].filter(Number.isFinite).sort((a,b)=>a-b).filter((v,i,a)=>i===0||v>a[i-1]+.1);
 const result:{x:number;y:number;width:number;height:number}[]=[];
 for(let i=0;i<x.length-1;i++)for(let j=0;j<y.length-1;j++){
  const mx=(x[i]+x[i+1])/2,my=(y[j]+y[j+1])/2;
  if(openings.some(o=>mx>=o.offset&&mx<=o.offset+o.width&&my>=o.sill&&my<=o.sill+o.height))continue;
  result.push({x:(x[i]+x[i+1])/2,y:(y[j]+y[j+1])/2,width:x[i+1]-x[i],height:y[j+1]-y[j]});
 }
 return result;
}
export default function RoomOrbit({room,finish,shades=baseline,split=.5}:Props){
 const host=useRef<HTMLDivElement>(null),[fallback,setFallback]=useState(false);
 useEffect(()=>{
  const parent=host.current;if(!parent)return;
  let renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,resizer:ResizeObserver|undefined,frame=0,timeout=0;
  const scene=new THREE.Scene(),geo=new THREE.BoxGeometry(1,1,1),allMaterials:THREE.MeshStandardMaterial[]=[];
  scene.background=new THREE.Color("#edf2ee");
  const mat=(hex:string)=>{const m=new THREE.MeshStandardMaterial({color:hex,roughness:.78,metalness:.03});allMaterials.push(m);return m};
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.MeshStandardMaterial)=>{
   const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.receiveShadow=true;scene.add(mesh);return mesh;
  };
  try{
   renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"low-power"});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
   renderer.toneMapping=THREE.ACESFilmicToneMapping;
   parent.appendChild(renderer.domElement);
   const model=roomModel(room),w=model.width/1000,d=model.depth/1000,h=model.height/1000;
   const main=mat(colour(finish.wall,shades)),accent=mat(colour(finish.accent,shades)),floor=mat(finish.floor==="wood"?"#ab8967":finish.floor==="marble"?"#e1e1dc":"#c8beb1");
   const glass=mat("#8bb4c4");glass.transparent=true;glass.opacity=.34;
   box(0,-.055,0,w+.1,.11,d+.1,floor);
   for(const wall of walls){
    if(wall==="front"&&split<.95)continue; // dollhouse cutaway
    const m=wall===finish.accentWall?accent:main;
    const across=wall==="rear"||wall==="front",length=across?model.width:model.depth;
    const holes=model.openings.filter(o=>o.wall===wall);
    for(const tile of pieces(length,holes,model.height)){
     const pos=tile.x/1000-length/2000,py=tile.y/1000;
     box(across?pos:wall==="left"?-w/2:w/2,py,across?wall==="front"?-d/2:d/2:pos,
      across?tile.width/1000:.12,tile.height/1000,across?.12:tile.width/1000,m);
    }
    for(const opening of holes.filter(x=>x.kind==="window")){
     const offset=(opening.offset+opening.width/2)/1000-length/2000;
     box(across?offset:wall==="left"?-w/2:w/2,(opening.sill+opening.height/2)/1000,across?wall==="front"?-d/2:d/2:offset,
      across?opening.width/1000:.025,opening.height/1000,across?.025:opening.width/1000,glass);
    }
   }
   scene.add(new THREE.HemisphereLight("#ffffff","#829081",2.25));const sun=new THREE.DirectionalLight("#fff5df",1.8);sun.position.set(w*2,h*3,d*2);scene.add(sun);
   const camera=new THREE.PerspectiveCamera(48,1,.05,150);camera.position.set(w*1.5,h*1.1,d*1.5);
   controls=new OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;controls.dampingFactor=.08;
   controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.6;controls.maxDistance=Math.max(8,w*4,d*4);
   controls.target.set(0,h*.4,0);controls.update();
   const render=()=>{frame=0;controls?.update();renderer?.render(scene,camera)};
   const schedule=()=>{if(!frame)frame=requestAnimationFrame(render)};
   controls.addEventListener("change",schedule);
   const resize=()=>{if(!renderer)return;const width=Math.max(220,parent.clientWidth),height=Math.max(260,Math.min(500,width*.74));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();schedule()};
   resizer=new ResizeObserver(resize);resizer.observe(parent);resize();
  }catch{timeout=window.setTimeout(()=>setFallback(true),0)}
  return()=>{cancelAnimationFrame(frame);clearTimeout(timeout);resizer?.disconnect();controls?.dispose();geo.dispose();allMaterials.forEach(m=>m.dispose());renderer?.dispose();if(renderer?.domElement.parentElement===parent)parent.removeChild(renderer.domElement)}
 },[room,finish,shades,split]);
 return fallback?<div role="status"><p>3D unavailable on this device. Showing the 2D cutaway instead.</p><RoomCutaway room={room} finish={finish} shades={shades} split={split}/></div>
  :<div ref={host} style={{width:"100%",minHeight:290,borderRadius:12,overflow:"hidden",background:"#edf2ee",touchAction:"none"}} aria-label="Interactive conceptual room with orbit/zoom gestures"/>;
}
