"use client";
import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {type StudioDesign} from "@/modules/studio/library";
import {buildingWallCells,structuralFootprint} from "@/modules/studio/geometry";
import {DesignPlanArt} from "@/components/studio-design-gallery";
import type {PlanModel} from "@/modules/studio/plan-model";
import {threeRoadRotation} from "@/modules/studio/plan-coordinate";
const FT=.3048;
type Mode="exterior"|"dollhouse"|"walkthrough";
export function StudioBuilding3D({design,colour,planModel,selectedFloor}:{design:StudioDesign;colour:string;planModel?:PlanModel;selectedFloor?:number}){
 const host=useRef<HTMLDivElement>(null),wallMat=useRef<THREE.MeshStandardMaterial|null>(null),refresh=useRef<(()=>void)|null>(null),colourRef=useRef(colour);
 const [mode,setMode]=useState<Mode>(selectedFloor===undefined?"exterior":"dollhouse"),[fallback,setFallback]=useState(false);
 useEffect(()=>{colourRef.current=colour;if(wallMat.current){wallMat.current.color.set(colour);refresh.current?.()}},[colour]);
 useEffect(()=>{
  const target=host.current;if(!target)return;
  let renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,frame=0,failedTimer=0;
  const scene=new THREE.Scene();scene.background=new THREE.Color("#dce6e1");
  const site=new THREE.Group();const angle=planModel?threeRoadRotation(planModel.plot.roadSide):0;site.rotation.y=angle;scene.add(site);
  const shared=new THREE.BoxGeometry(1,1,1),materials:THREE.Material[]=[];
  const material=(hex:string,roughness=.83,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color:hex,roughness,metalness});materials.push(m);return m;};
  try{
   renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:"low-power"});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
   renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   renderer.shadowMap.enabled=window.innerWidth>720;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   target.appendChild(renderer.domElement);
   const height=design.layout.wallHeightFt*FT,wallThickness=design.layout.wallThicknessFt*FT;
   const width=design.plot.widthFt*FT,depth=design.plot.depthFt*FT;
   const foundation=material("#cbc3b2"),concrete=material("#ddd5c3"),roofMat=material(design.elevation.surfaces.accent),gateMat=material(design.elevation.surfaces.gate,.48,.25),floorMat=material("#c9b69d"),railingMat=material(design.elevation.surfaces.railing,.3,.45);
   const wall=material(colourRef.current,.88);wallMat.current=wall;
   const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:THREE.MeshStandardMaterial,cast=true)=>{const mesh=new THREE.Mesh(shared,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=cast;mesh.receiveShadow=true;site.add(mesh);return mesh;};
   const xCoord=(v:number)=>(v-design.plot.widthFt/2)*FT;
   const zCoord=(v:number)=>(v-design.plot.depthFt/2)*FT;
   // Show the actual missing rear L-corner instead of visually claiming that land exists.
   const shape=planModel?.plot.siteShape??{kind:"rectangle"} as const;
   if(shape.kind==="rectangle")box(0,-.13,0,width,.2,depth,foundation,false);
   else {
    const W=design.plot.widthFt,D=design.plot.depthFt,w=shape.notchWidthFt,d=shape.notchDepthFt;
    const groundPart=(x0:number,x1:number,y0:number,y1:number)=>
     box(xCoord((x0+x1)/2),-.13,zCoord((y0+y1)/2),(x1-x0)*FT,.2,(y1-y0)*FT,foundation,false);
    groundPart(0,W,0,D-d);
    if(shape.kind==="rear-left-notch")groundPart(w,W,D-d,D);
    else groundPart(0,W-w,D-d,D);
   }
   const fp=structuralFootprint(design),W=(fp.maxX-fp.minX)*FT,D=(fp.maxZ-fp.minZ)*FT,cx=xCoord((fp.maxX+fp.minX)/2),cz=zCoord((fp.maxZ+fp.minZ)/2);
   // A selected 2D floor is the *only* level in cutaway/eye-level previews.
   // Full-building exterior deliberately shows every storey, with a separate label.
   const visible=(floor:number)=>mode==="exterior"||selectedFloor===undefined||floor===selectedFloor;
   if(planModel){
    // Phase 1 bridge: do not place a giant slab above the open parking bay or rear terrace.
    for(const r of planModel.rooms.filter(r=>visible(r.floor)&&!["parking","verandah"].includes(r.kind))){
     box(xCoord(r.x+r.w/2),r.floor*height,zCoord(r.y+r.d/2),r.w*FT,.14,r.d*FT,concrete,false);
    }
   }else for(let f=0;f<design.floors;f++)box(cx,f*height,cz,W,.14,D,concrete,false);
   const wallCells=buildingWallCells(design).filter(c=>visible(c.floorIndex)),instances=new THREE.InstancedMesh(shared,wall,wallCells.length),dummy=new THREE.Object3D();
   wallCells.forEach((cell,index)=>{const length=(cell.endFt-cell.startFt)*FT,mid=(cell.startFt+cell.endFt)/2;
    dummy.position.set(cell.axis==="x"?xCoord(cell.planeFt):xCoord(mid),cell.floorIndex*height+(cell.bottomFt+cell.topFt)/2*FT,cell.axis==="z"?zCoord(cell.planeFt):zCoord(mid));
    const external=planModel&&(cell.axis==="x"
      ?Math.abs(cell.planeFt-planModel.setbacks.leftFt)<.02||Math.abs(cell.planeFt-(planModel.plot.widthFt-planModel.setbacks.rightFt))<.02
      :Math.abs(cell.planeFt-planModel.setbacks.frontFt)<.02||Math.abs(cell.planeFt-(planModel.plot.depthFt-planModel.setbacks.rearFt))<.02);
    const thickness=planModel?(external?planModel.walls.externalFt:planModel.walls.internalFt)*FT:wallThickness;
    dummy.scale.set(cell.axis==="x"?thickness:length,(cell.topFt-cell.bottomFt)*FT,cell.axis==="z"?thickness:length);dummy.updateMatrix();instances.setMatrixAt(index,dummy.matrix);
   });instances.instanceMatrix.needsUpdate=true;instances.castShadow=true;instances.receiveShadow=true;site.add(instances);
   const glass=material("#88b6c3",.18,.08);glass.transparent=true;glass.opacity=.68;const frameMat=material(design.elevation.surfaces.frame,.35,.3);
   for(const room of design.layout.rooms){if(!visible(room.floorIndex)||room.kind==="open"||room.kind==="parking")continue;
    const base=room.floorIndex*height;for(const o of room.openings){if(o.kind!=="window")continue;
     const vertical=o.wall==="left"||o.wall==="right",plane=vertical?room.xFt+(o.wall==="right"?room.wFt:0):room.yFt+(o.wall==="rear"?room.dFt:0);
     const outside=vertical?(Math.abs(plane-fp.minX)<.02||Math.abs(plane-fp.maxX)<.02):(Math.abs(plane-fp.minZ)<.02||Math.abs(plane-fp.maxZ)<.02);
     if(!outside)continue;
     const middle=(vertical?room.yFt:room.xFt)+o.offsetFt+o.widthFt/2;
     const xpos=vertical?xCoord(plane):xCoord(middle),zpos=vertical?zCoord(middle):zCoord(plane),ypos=base+(o.sillFt+o.heightFt/2)*FT;
     const wi=o.widthFt*FT,he=o.heightFt*FT;
     box(xpos,ypos,zpos,vertical?.055:wi,he,vertical?wi:.055,glass,false);
     box(xpos,ypos+he/2,zpos,vertical?.08:wi+.08,.055,vertical?wi+.08:.08,frameMat);
    }
   }
   for(const r of design.layout.rooms){if(!visible(r.floorIndex)||r.kind==="open"||r.kind==="parking")continue;const surface=r.kind==="bath"?material("#c7d5d6"):floorMat;
    box(xCoord(r.xFt+r.wFt/2),r.floorIndex*height+.09,zCoord(r.yFt+r.dFt/2),r.wFt*FT-.03,.025,r.dFt*FT-.03,surface,false);
   }
   for(const stair of design.layout.rooms.filter(r=>r.kind==="stairs"&&visible(r.floorIndex)&&r.floorIndex<design.floors-1)){for(let i=0;i<12;i++){
    const stepD=stair.dFt*FT/12;box(xCoord(stair.xFt+stair.wFt/2),stair.floorIndex*height+(i+1)*height/12,zCoord(stair.yFt+(i+.5)*stair.dFt/12),stair.wFt*FT*.7,.12,stepD*.95,concrete);
   }}
   for(const r of planModel?.rooms.filter(r=>r.kind==="balcony"&&visible(r.floor))??[]){
    const center=xCoord(r.x+r.w/2),front=zCoord(r.y),y=r.floor*height;
    box(center,y+.5,front,r.w*FT,.85,.05,glass,false);
    box(center,y+.95,front,r.w*FT,.06,.07,railingMat);
    if(planModel?.facade.kit==="pergola"){
     for(let i=0;i<6;i++)box(xCoord(r.x+(i+.5)*r.w/6),y+height-.12,zCoord(r.y+r.d/2),.12,.15,r.d*FT,roofMat);
    }else if(planModel?.facade.kit==="jali-screen"){
     for(let i=0;i<8;i++)box(xCoord(r.x+(i+.5)*r.w/24),y+height/2,front,.08,height,.12,roofMat);
    }
   }
   const roofGroup=new THREE.Group();const roof=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=new THREE.Mesh(shared,roofMat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;roofGroup.add(m)};
   const top=design.floors*height;
   if(planModel){
    for(const r of planModel.rooms.filter(r=>r.floor===design.floors-1&&!["parking","verandah","balcony","terrace"].includes(r.kind))){
     roof(xCoord(r.x+r.w/2),top+.08,zCoord(r.y+r.d/2),r.w*FT+.04,.18,r.d*FT+.04);
    }
   }else roof(cx,top+.08,cz,W+.25,.18,D+.25);
   if(!planModel){
    const parapet=design.layout.parapetHeightFt*FT;
    roof(cx,top+parapet/2+.14,zCoord(fp.minZ),W+.25,parapet,.18);roof(cx,top+parapet/2+.14,zCoord(fp.maxZ),W+.25,parapet,.18);
    roof(xCoord(fp.minX),top+parapet/2+.14,cz,.18,parapet,D+.25);roof(xCoord(fp.maxX),top+parapet/2+.14,cz,.18,parapet,D+.25);
   }
   roofGroup.visible=mode==="exterior";site.add(roofGroup);
   for(const r of design.layout.rooms.filter(r=>r.kind==="parking"&&visible(r.floorIndex))){
    box(xCoord(r.xFt+r.wFt/2),.015,zCoord(r.yFt+r.dFt/2),r.wFt*FT,.03,r.dFt*FT,material("#aaa69a"),false);
    if(planModel){const car=material("#75818b",.7,.1);
      box(xCoord(r.xFt+r.wFt/2),.42,zCoord(r.yFt+r.dFt/2),Math.min(r.wFt*.7,6.5)*FT,.65,Math.min(r.dFt*.65,11)*FT,car,false);
    }
   }
   const fenceH=.85;box(-width/2,-.13+fenceH/2,0,.12,fenceH,depth,concrete);box(width/2,-.13+fenceH/2,0,.12,fenceH,depth,concrete);box(0,-.13+fenceH/2,depth/2,width,fenceH,.12,concrete);
   const gates=planModel?[
    {start:planModel.gate.xFt,width:planModel.gate.widthFt},
    {start:planModel.pedestrianGate.xFt,width:planModel.pedestrianGate.widthFt}
   ].sort((a,b)=>a.start-b.start):[{start:(design.plot.widthFt-Math.min(3,width*.65)/FT)/2,width:Math.min(3,width*.65)/FT}];
   let fenceCursor=0;
   for(const gate of gates){
    if(gate.start>fenceCursor+.01){
     const len=(gate.start-fenceCursor)*FT;
     box(xCoord((fenceCursor+gate.start)/2),fenceH/2,-depth/2,len,fenceH,.14,concrete);
    }
    const gw=gate.width*FT,gx=xCoord(gate.start+gate.width/2);
    box(gx,fenceH*.47,-depth/2,gw,fenceH*.94,.08,gateMat);
    for(let k=0;k<7;k++)box(gx-gw/2+gw*(k+.5)/7,fenceH*.48,-depth/2-.06,.028,fenceH*.86,.04,railingMat);
    fenceCursor=gate.start+gate.width;
   }
   if(fenceCursor<design.plot.widthFt-.01)
    box(xCoord((fenceCursor+design.plot.widthFt)/2),fenceH/2,-depth/2,(design.plot.widthFt-fenceCursor)*FT,fenceH,.14,concrete);
   box(0,-.26,0,width*1.8,.05,depth*1.8,material("#b4c7ad"),false);
   scene.add(new THREE.HemisphereLight("#ffffff","#78816d",2.2));const sun=new THREE.DirectionalLight("#fff1d7",2.4);sun.position.set(width,top+8,depth*.7);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-width*1.8;sun.shadow.camera.right=width*1.8;sun.shadow.camera.top=depth*1.8;sun.shadow.camera.bottom=-depth*1.8;sun.shadow.bias=-.001;scene.add(sun);
   const camera=new THREE.PerspectiveCamera(46,1,.04,300);
   const focusHeight=selectedFloor!==undefined&&mode!=="exterior"?(selectedFloor+.5)*height:Math.min(top,top*.55);
   const cameraPosition=mode==="walkthrough"?new THREE.Vector3(cx,(selectedFloor??0)*height+1.65,cz+Math.min(D*.38,2.4))
     :new THREE.Vector3(width*.92,top+Math.max(3,top*.4),-depth*1.15);
   camera.position.copy(cameraPosition.applyAxisAngle(new THREE.Vector3(0,1,0),angle));
   controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=mode==="walkthrough"?.7:2;controls.maxDistance=Math.max(width,depth)*3;controls.maxPolarAngle=Math.PI*.51;
   controls.target.set(cx,mode==="walkthrough"?(selectedFloor??0)*height+1.55:focusHeight,cz);controls.update();
   function draw(){frame=0;if(!renderer||!controls)return;controls.update();renderer.render(scene,camera)}
   function schedule(){if(!frame)frame=window.requestAnimationFrame(draw)}
   refresh.current=schedule;controls.addEventListener("change",schedule);
   const resize=()=>{if(!renderer)return;const w=Math.max(200,target.clientWidth),h=Math.max(260,Math.min(630,w*.7));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();schedule()};
   observer=new ResizeObserver(resize);observer.observe(target);resize();
  }catch{failedTimer=window.setTimeout(()=>setFallback(true),0)}
  return()=>{window.cancelAnimationFrame(frame);window.clearTimeout(failedTimer);refresh.current=null;wallMat.current=null;observer?.disconnect();controls?.dispose();shared.dispose();for(const m of materials)m.dispose();scene.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose()});renderer?.dispose();renderer?.forceContextLoss();if(renderer?.domElement.parentElement===target)target.removeChild(renderer.domElement)};
 },[design,mode,planModel,selectedFloor]);
 return <section className="nbd-building"><div className="nbd-hrow"><h2>Plan-based 3D house</h2><span>{selectedFloor===undefined?"Full building":mode==="exterior"?"Full building · all floors":`${["Ground floor","First floor","Second floor"][selectedFloor]??`Floor ${selectedFloor+1}`} only`} · touch to rotate</span></div><div className="nbd-buttons">{(["exterior","dollhouse","walkthrough"] as Mode[]).map(option=><button key={option} aria-pressed={mode===option} onClick={()=>setMode(option)}>{option==="walkthrough"?"Eye-level beta":option==="dollhouse"?"Selected floor cutaway":"Full exterior · all floors"}</button>)}</div>{fallback?<div><p role="status">3D unavailable on this device. The 2D plan is still accessible.</p><DesignPlanArt design={design} floor={selectedFloor??0}/></div>:<div ref={host} className="nbd-webgl" aria-label="Interactive 3D building model with touch orbit and zoom"/>}<p className="nbd-disclaimer">{selectedFloor!==undefined?"Floor tabs show that level only by default. Choose Full exterior to inspect all selected storeys. ":""}Parametric study only — not certified structural BIM. Concept walls and actual openings derive from the plan. Slabs and roofs are simplified; parapet details are not modeled for PlanModel mode. HDRI, phototextures and photoreal renders are not yet bundled. Eye-level beta is not a measured walkthrough.</p></section>;
}

