"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {type StudioDesign} from "@/modules/studio/library";
import {buildingWallCells,structuralFootprint} from "@/modules/studio/geometry";
import {PlanAxonometric} from "./plan-axonometric";
import {DesignPlanArt} from "@/components/studio-design-gallery";
import type {PlanModel} from "@/modules/studio/plan-model";
import {threeRoadRotation} from "@/modules/studio/plan-coordinate";
import {nonRoadBoundaryEdges} from "@/modules/studio/site-shape";
const FT=.3048;
type Mode="exterior"|"dollhouse"|"walkthrough";
type CameraView="front"|"rear"|"left"|"right"|"top";
export function StudioBuilding3D({design,colour,planModel,selectedFloor}:{design:StudioDesign;colour:string;planModel?:PlanModel;selectedFloor?:number}){
 const host=useRef<HTMLDivElement>(null),wallMat=useRef<THREE.MeshStandardMaterial|null>(null),refresh=useRef<(()=>void)|null>(null),colourRef=useRef(colour);
 const cameraView=useRef<((view:CameraView)=>void)|null>(null);
 const [quality,setQuality]=useState<"balanced"|"detail">("balanced");
 const [mode,setMode]=useState<Mode>(selectedFloor===undefined?"exterior":"dollhouse"),[fallback,setFallback]=useState(false);
 // The same wall cells feed the WebGL meshes and the cross-view regression contract.
 const wallCells=useMemo(()=>buildingWallCells(design).filter(c=>mode==="exterior"||selectedFloor===undefined||c.floorIndex===selectedFloor),[design,mode,selectedFloor]);
 useEffect(()=>{colourRef.current=colour;if(wallMat.current){wallMat.current.color.set(colour);refresh.current?.()}},[colour]);
 useEffect(()=>{
  const target=host.current;if(!target)return;
  let renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,frame=0,failedTimer=0;
  let resumeDrawing:(()=>void)|undefined;
  const scene=new THREE.Scene();scene.background=new THREE.Color("#dce6e1");
  const site=new THREE.Group();const angle=planModel?threeRoadRotation(planModel.plot.roadSide):0;site.rotation.y=angle;scene.add(site);
  const shared=new THREE.BoxGeometry(1,1,1),materials:THREE.Material[]=[];
  const material=(hex:string,roughness=.83,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color:hex,roughness,metalness});materials.push(m);return m;};
  try{
   renderer=new THREE.WebGLRenderer({antialias:quality==="detail",alpha:false,powerPreference:quality==="detail"?"high-performance":"low-power"});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality==="detail"?1.75:1.35));
   renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   renderer.shadowMap.enabled=quality==="detail"||window.innerWidth>720;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
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
   const showSite=mode==="exterior"||selectedFloor===undefined||selectedFloor===0;
   if(showSite&&shape.kind==="rectangle")box(0,-.13,0,width,.2,depth,foundation,false);
   else if(showSite&&shape.kind!=="rectangle") {
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
   }else for(let f=0;f<design.floors;f++)if(visible(f))box(cx,f*height,cz,W,.14,D,concrete,false);
   const instances=new THREE.InstancedMesh(shared,wall,wallCells.length),dummy=new THREE.Object3D();
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
     // All actual windows, including stepped upper floors, use their plan coordinates.
     const middle=(vertical?room.yFt:room.xFt)+o.offsetFt+o.widthFt/2;
     const xpos=vertical?xCoord(plane):xCoord(middle),zpos=vertical?zCoord(middle):zCoord(plane),ypos=base+(o.sillFt+o.heightFt/2)*FT;
     const wi=o.widthFt*FT,he=o.heightFt*FT;
     box(xpos,ypos,zpos,vertical?.055:wi,he,vertical?wi:.055,glass,false);
     const trim=Math.min(.055,wi*.08,he*.08);
     for(const offset of [-1,1]){
      box(xpos,ypos+offset*(he-trim)/2,zpos,vertical?.08:wi,trim,vertical?wi:.08,frameMat);
      box(xpos+(vertical?0:offset*(wi-trim)/2),ypos,zpos+(vertical?offset*(wi-trim)/2:0),vertical?.08:trim,he,vertical?trim:.08,frameMat);
     }
     if(wi>.8)box(xpos,ypos,zpos,vertical?.06:trim*.7,he,vertical?trim*.7:.06,frameMat);
    }
   }
   const floorSurfaces={bath:material("#c7d5d6"),bedroom:material("#dbc7aa"),kitchen:material("#d7d9cf"),stairs:concrete};
   for(const r of design.layout.rooms){if(!visible(r.floorIndex)||r.kind==="open"||r.kind==="parking")continue;const surface=r.kind==="bath"||r.kind==="bedroom"||r.kind==="kitchen"||r.kind==="stairs"?floorSurfaces[r.kind]:floorMat;
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
     roof(xCoord(r.x+r.w/2),top+.08,zCoord(r.y+r.d/2),r.w*FT,.18,r.d*FT);
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
   if(showSite){
    const fenceH=.85;
    for(const {start,end} of nonRoadBoundaryEdges(design.plot.widthFt,design.plot.depthFt,shape)){
     const dx=Math.abs(end.x-start.x)*FT,dz=Math.abs(end.y-start.y)*FT;
     box(xCoord((start.x+end.x)/2),-.13+fenceH/2,zCoord((start.y+end.y)/2),dx||.12,fenceH,dz||.12,concrete);
    }
    const gates=planModel?[
     {start:planModel.gate.xFt,width:planModel.gate.widthFt},
     {start:planModel.pedestrianGate.xFt,width:planModel.pedestrianGate.widthFt}
    ].filter(g=>g.width>0).sort((a,b)=>a.start-b.start):[{start:(design.plot.widthFt-Math.min(3,width*.65)/FT)/2,width:Math.min(3,width*.65)/FT}];
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
   }
   scene.add(new THREE.HemisphereLight("#ffffff","#78816d",2.2));const sun=new THREE.DirectionalLight("#fff1d7",2.4);sun.position.set(-width*.8,top+8,-depth*.85).applyAxisAngle(new THREE.Vector3(0,1,0),angle);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(quality==="detail"?1536:1024,quality==="detail"?1536:1024);sun.shadow.camera.left=-width*1.8;sun.shadow.camera.right=width*1.8;sun.shadow.camera.top=depth*1.8;sun.shadow.camera.bottom=-depth*1.8;sun.shadow.bias=-.001;scene.add(sun);
   const camera=new THREE.PerspectiveCamera(46,1,.04,300);
   const focusHeight=selectedFloor!==undefined&&mode!=="exterior"?(selectedFloor+.5)*height:Math.min(top,top*.55);
   const up=new THREE.Vector3(0,1,0);
   const focus=new THREE.Vector3(cx,mode==="walkthrough"?(selectedFloor??0)*height+1.55:focusHeight,cz).applyAxisAngle(up,angle);
   const direction=new THREE.Vector3(.74,mode==="dollhouse"?1.85:.48,-1).normalize().applyAxisAngle(up,angle);
   controls=new OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;
   controls.dampingFactor=.075;
   controls.minDistance=mode==="walkthrough"?.7:2;
   controls.maxPolarAngle=Math.PI*.51;
   controls.target.copy(focus);
   camera.position.copy(focus).add(mode==="walkthrough"
    ?new THREE.Vector3(0,.1,Math.min(D*.38,2.4)).applyAxisAngle(up,angle)
    :direction);
   let activeDirection=direction.clone();
   const corners:THREE.Vector3[]=[];
   const low=showSite?-.3:(selectedFloor??0)*height-.1;
   const high=mode==="exterior"||selectedFloor===undefined?top+1:(selectedFloor+1)*height;
   for(const x of [-width/2,width/2])for(const y of [low,high])for(const z of [-depth/2,depth/2]){
    corners.push(new THREE.Vector3(x,y,z).applyAxisAngle(up,angle).sub(focus));
   }
   let previousFit=0;
   function draw(){frame=0;if(!renderer||!controls||document.hidden)return;controls.update();renderer.render(scene,camera)}
   function schedule(){if(!frame&&!document.hidden)frame=window.requestAnimationFrame(draw)}
   resumeDrawing=()=>{if(document.hidden){window.cancelAnimationFrame(frame);frame=0}else schedule()};document.addEventListener("visibilitychange",resumeDrawing);
   refresh.current=schedule;controls.addEventListener("change",schedule);
   let lastWidth=0,lastHeight=0;
   const resize=()=>{
    if(!renderer||!controls||target.clientWidth<1)return;
    const w=target.clientWidth,h=Math.max(260,Math.min(630,Math.round(w*.78)));
    if(w===lastWidth&&h===lastHeight)return;
    lastWidth=w;lastHeight=h;renderer.setSize(w,h);
    camera.aspect=w/h;
    if(mode!=="walkthrough"){
     const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
     const currentDirection=camera.position.clone().sub(controls.target).normalize();
     if(currentDirection.lengthSq()>.1&&Math.abs(currentDirection.dot(up))<.999999)activeDirection=currentDirection;
     const right=new THREE.Vector3().crossVectors(up,activeDirection).normalize(),screenUp=new THREE.Vector3().crossVectors(activeDirection,right);
     const fit=Math.max(...corners.map(point=>point.dot(activeDirection)+1.12*Math.max(
      Math.abs(point.dot(right))/(tanY*camera.aspect),Math.abs(point.dot(screenUp))/tanY)));
     const offset=previousFit?camera.position.clone().sub(controls.target).multiplyScalar(fit/previousFit):activeDirection.clone().multiplyScalar(fit);
     controls.maxDistance=fit*3;
     camera.far=Math.max(300,fit*5);
     camera.position.copy(controls.target).add(offset);
     previousFit=fit;
    }
    camera.updateProjectionMatrix();
    controls.update();
    schedule();
   };
   cameraView.current=(view)=>{
    if(!controls||mode==="walkthrough")return;
    const v=({front:[0,.18,-1],rear:[0,.18,1],left:[-1,.25,0],right:[1,.25,0],top:[0,1,-.001]} as const)[view];
    const dir=new THREE.Vector3(v[0],v[1],v[2]).normalize().applyAxisAngle(up,angle);
    const rightVector=new THREE.Vector3().crossVectors(up,dir).normalize(),upVector=new THREE.Vector3().crossVectors(dir,rightVector);
    const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const fit=Math.max(...corners.map(p=>p.dot(dir)+1.18*Math.max(Math.abs(p.dot(rightVector))/(tanY*camera.aspect),Math.abs(p.dot(upVector))/tanY)));
    activeDirection=dir;previousFit=fit;controls.target.copy(focus);controls.maxDistance=Math.max(fit*3,10);camera.far=Math.max(300,fit*5);camera.updateProjectionMatrix();
    camera.position.copy(focus).addScaledVector(dir,fit);controls.update();schedule();
   };
   observer=new ResizeObserver(resize);observer.observe(target);resize();
  }catch{failedTimer=window.setTimeout(()=>setFallback(true),0)}
  return()=>{if(resumeDrawing)document.removeEventListener("visibilitychange",resumeDrawing);window.cancelAnimationFrame(frame);window.clearTimeout(failedTimer);refresh.current=null;cameraView.current=null;wallMat.current=null;observer?.disconnect();controls?.dispose();shared.dispose();for(const m of materials)m.dispose();scene.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();if(o instanceof THREE.DirectionalLight)o.shadow.dispose()});renderer?.dispose();renderer?.forceContextLoss();if(renderer?.domElement.parentElement===target)target.removeChild(renderer.domElement)};
 },[design,mode,planModel,selectedFloor,wallCells,quality]);
 return <section className="nbd-building" data-plan-id={design.id} data-selected-floor={mode==="exterior"?"all":selectedFloor??"all"} data-wall-cells={wallCells.length}><div className="nbd-hrow"><h2>Plan-based 3D house</h2><span>{selectedFloor===undefined?"Full building":mode==="exterior"?"Full building · all floors":`${["Ground floor","First floor","Second floor"][selectedFloor]??`Floor ${selectedFloor+1}`} only`} · touch to rotate</span></div>{fallback?<div><p role="status">Interactive rotation is unavailable on this device.</p>{planModel?<PlanAxonometric plan={planModel} design={design} floor={mode==="exterior"?undefined:selectedFloor}/>:<DesignPlanArt design={design} floor={selectedFloor??0}/>}</div>:<div ref={host} className="nbd-webgl" aria-label="Interactive 3D building model with touch orbit and zoom"/>}{!fallback&&<>{mode!=="walkthrough"&&<div className="nbd-buttons" role="group" aria-label="3D camera views">{(["front","rear","left","right","top"] as CameraView[]).map(view=><button type="button" key={view} onClick={()=>cameraView.current?.(view)}>{({front:"Front view",rear:"Rear view",left:"Left view",right:"Right view",top:"Top view"} as const)[view]}</button>)}</div>}</>}<div className="nbd-buttons nbd-mode-controls" role="group" aria-label="3D display mode">{(["exterior","dollhouse","walkthrough"] as Mode[]).map(option=><button key={option} aria-pressed={mode===option} onClick={()=>setMode(option)}>{option==="walkthrough"?"Eye-level beta":option==="dollhouse"?"Selected floor cutaway":"Full exterior · all floors"}</button>)}</div>{!fallback&&<details className="nbd-quality-options"><summary>Rendering quality</summary><div className="nbd-buttons" role="group" aria-label="3D rendering quality"><button type="button" aria-pressed={quality==="balanced"} onClick={()=>setQuality("balanced")}>Smooth preview</button><button type="button" aria-pressed={quality==="detail"} onClick={()=>setQuality("detail")}>Enhanced detail</button></div></details>}<p className="nbd-disclaimer">{selectedFloor!==undefined?"Floor tabs show that level only by default. Choose Full exterior to inspect all selected storeys. ":""}Parametric study only — not certified structural BIM. Concept walls and actual openings derive from the plan. Slabs and roofs are simplified; parapet details are not modeled for PlanModel mode. Enhanced detail improves edge smoothing, shadows and opening finishes; it is not a photoreal render. Eye-level beta is not a measured walkthrough.</p></section>;
}

