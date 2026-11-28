"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";
import {BrowserArchitectureRender} from "./browser-architecture-render";
import type {RenderBox,RenderSnapshot} from "../../public/studio-render-v1";
import {type StudioDesign} from "@/modules/studio/library";
import {visibleWallCells,structuralFootprint,CUTAWAY_WALL_RATIO} from "@/modules/studio/geometry";
import {PlanAxonometric} from "./plan-axonometric";
import {DesignPlanArt} from "@/components/studio-design-gallery";
import {finishSpaces,wallFaceOwners,wallShade,type FinishScheme,type FinishMaterial,type FinishSurface} from "@/modules/studio/finish-model";
import type {Side} from "@/modules/studio/plan-model";
import {isOtsRoom,type PlanModel} from "@/modules/studio/plan-model";
import {otsGrilleBars} from "@/modules/studio/ots-ventilation";
import {modeledWindowGeometry,ventilationGeometrySummary,windowGeometryKey} from "@/modules/studio/ventilation-geometry";
import {threeRoadRotation} from "@/modules/studio/plan-coordinate";
import {residentialStairStudies,stairFloorPatches,stairStepDepthFt} from "@/modules/studio/stair-study";
import {planFurniture} from "@/modules/studio/furniture";
import {facadeAccents,frontageSignature} from "@/modules/studio/frontage";
import {exposedRoofPatches} from "@/modules/studio/plan-surfaces";
import {nonRoadBoundaryEdges} from "@/modules/studio/site-shape";
import {studioDevice,configureStudioRenderer,releaseStudioRenderer,studioMaterialTexture,plasterTexture,projectedFit} from "@/modules/studio/core/render-core";
import {browserFrameScheduler} from "@/modules/studio/core/frame-scheduler";
import {FEET_TO_METRES as FT} from "@/modules/studio/core/geometry-primitives";
type Mode="exterior"|"dollhouse"|"floor"|"walkthrough";
type CameraView="front"|"rear"|"left"|"right"|"top"|"fit";
export function StudioBuilding3D({design,colour,planModel,selectedFloor,scheme}:{design:StudioDesign;colour:string;planModel?:PlanModel;selectedFloor?:number;scheme?:FinishScheme}){
 const host=useRef<HTMLDivElement>(null),wallMat=useRef<THREE.MeshStandardMaterial|null>(null),refresh=useRef<(()=>void)|null>(null),colourRef=useRef(colour);
 const schemeRef=useRef(scheme),updateFinish=useRef<((next:FinishScheme|undefined)=>void)|null>(null);
 useEffect(()=>{schemeRef.current=scheme;updateFinish.current?.(scheme)},[scheme]);
 const cameraView=useRef<((view:CameraView)=>void)|null>(null);
 const exportScene=useRef<(()=>Promise<void>)|null>(null);
 const captureRender=useRef<(()=>RenderSnapshot)|null>(null);
 const [exportStatus,setExportStatus]=useState(""),[exporting,setExporting]=useState(false);
 const [showFurniture,setShowFurniture]=useState(false);
 const [showAir,setShowAir]=useState(false);
 const [lighting,setLighting]=useState<"day"|"evening">("day");
 const [quality,setQuality]=useState<"balanced"|"detail">("balanced");
 const [mode,setMode]=useState<Mode>(selectedFloor===undefined?"exterior":"dollhouse"),[fallback,setFallback]=useState(false);
 // The same wall cells feed the WebGL meshes and the cross-view regression contract.
 const stairReview=useMemo(()=>planModel?residentialStairStudies(planModel):null,[planModel]);
 const wallCells=useMemo(()=>visibleWallCells(design,mode==="exterior"?undefined:selectedFloor,mode==="dollhouse"),[design,mode,selectedFloor]);
 const airSummary=useMemo(()=>planModel?ventilationGeometrySummary(planModel,mode==="exterior"?undefined:selectedFloor,mode==="dollhouse"?planModel.walls.heightFt*CUTAWAY_WALL_RATIO:planModel.walls.heightFt):null,[planModel,mode,selectedFloor]);
 useEffect(()=>{colourRef.current=colour;if(wallMat.current){wallMat.current.color.set(colour);refresh.current?.()}},[colour]);
 useEffect(()=>{
  const target=host.current;if(!target||fallback)return;
  let renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,failedTimer=0;
  let scheduler:ReturnType<typeof browserFrameScheduler>|undefined;
  let environmentTarget:THREE.WebGLRenderTarget|undefined;
  let disposed=false;
  const {constrained}=studioDevice();
  const contextLost=(event:Event)=>{event.preventDefault();if(!disposed)setFallback(true);};
  const scene=new THREE.Scene();scene.background=new THREE.Color(lighting==="day"?"#dce6e1":"#8e9fb6");
  const site=new THREE.Group();const angle=planModel?threeRoadRotation(planModel.plot.roadSide):0;site.rotation.y=angle;scene.add(site);
  const shared=new THREE.BoxGeometry(1,1,1),materials:THREE.Material[]=[],textures:THREE.Texture[]=[];
  const material=(hex:string,roughness=.83,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color:hex,roughness,metalness});materials.push(m);return m;};
  try{
   renderer=new THREE.WebGLRenderer({antialias:!constrained,alpha:false,powerPreference:quality==="detail"&&!constrained?"high-performance":"low-power"});
   configureStudioRenderer(renderer,{constrained,pixelRatio:quality==="detail"?1.75:1.35,shadows:true,exposure:lighting==="day"?1.08:1.25});
   renderer.domElement.addEventListener("webglcontextlost",contextLost);target.appendChild(renderer.domElement);
   if(quality==="detail"&&!constrained){
    const env=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
    try{environmentTarget=pmrem.fromScene(env,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=lighting==="day"?.65:.38;}
    finally{env.dispose();pmrem.dispose();}
   }
   const height=design.layout.wallHeightFt*FT,wallThickness=design.layout.wallThicknessFt*FT;
   const width=design.plot.widthFt*FT,depth=design.plot.depthFt*FT;
   const foundation=material("#cbc3b2"),concrete=material("#ddd5c3"),roofMat=material(design.elevation.surfaces.accent),gateMat=material(design.elevation.surfaces.gate,.48,.25),floorMat=material("#c9b69d"),railingMat=material(design.elevation.surfaces.railing,.3,.45);
   const wall=material(colourRef.current,.88);wallMat.current=wall;
   const finishBindings:{mat:THREE.MeshStandardMaterial;id:string;surface:FinishSurface;side?:Side;fallback:string}[]=[];
   const textureCache=new Map<FinishMaterial,THREE.DataTexture>(),finishMaterialCache=new Map<string,THREE.MeshStandardMaterial>();
   let plaster:THREE.DataTexture|undefined;
   function texture(kind:FinishMaterial){
    if(kind==="plain")return null;
    const cached=textureCache.get(kind);if(cached)return cached;
    const t=studioMaterialTexture(kind,"residential");textures.push(t);textureCache.set(kind,t);return t;
   }
   function bindFinish(id:string,surface:FinishSurface,fallback:string,side?:Side){
    const key=[id,surface,side??""].join(":");const existing=finishMaterialCache.get(key);if(existing)return existing;
    const mat=material(fallback);if(surface==="wall"&&plaster){mat.bumpMap=plaster;mat.bumpScale=.009;}finishMaterialCache.set(key,mat);finishBindings.push({mat,id,surface,side,fallback});return mat;
   }
   // Local procedural plaster microtexture: no external asset, paid renderer or network request.
   {
    const texture=plasterTexture(7183);textures.push(texture);
    plaster=texture;wall.bumpMap=texture;wall.bumpScale=.009;concrete.bumpMap=texture;concrete.bumpScale=.006;
   }
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
    for(const r of planModel.rooms.filter(r=>visible(r.floor)&&!["parking","verandah"].includes(r.kind)&&(!isOtsRoom(r)||r.floor===0))){
     for(const patch of stairFloorPatches(r,stairReview?.studies??[]))box(xCoord(patch.x+patch.w/2),r.floor*height,zCoord(patch.y+patch.d/2),patch.w*FT,.14,patch.d*FT,concrete,false);
    }
   }else for(let f=0;f<design.floors;f++)if(visible(f))box(cx,f*height,cz,W,.14,D,concrete,false);
   const instances=new THREE.InstancedMesh(shared,wall,wallCells.length),dummy=new THREE.Object3D();
   const finishRooms=planModel?finishSpaces({kind:"residential",plan:planModel}):[];
   wallCells.forEach((cell,index)=>{const length=(cell.endFt-cell.startFt)*FT,mid=(cell.startFt+cell.endFt)/2;
    dummy.position.set(cell.axis==="x"?xCoord(cell.planeFt):xCoord(mid),cell.floorIndex*height+(cell.bottomFt+cell.topFt)/2*FT,cell.axis==="z"?zCoord(cell.planeFt):zCoord(mid));
    const external=planModel&&(cell.axis==="x"
      ?Math.abs(cell.planeFt-planModel.setbacks.leftFt)<.02||Math.abs(cell.planeFt-(planModel.plot.widthFt-planModel.setbacks.rightFt))<.02
      :Math.abs(cell.planeFt-planModel.setbacks.frontFt)<.02||Math.abs(cell.planeFt-(planModel.plot.depthFt-planModel.setbacks.rearFt))<.02);
    const thickness=planModel?(external?planModel.walls.externalFt:planModel.walls.internalFt)*FT:wallThickness;
    dummy.scale.set(cell.axis==="x"?thickness:length,(cell.topFt-cell.bottomFt)*FT,cell.axis==="z"?thickness:length);dummy.updateMatrix();instances.setMatrixAt(index,dummy.matrix);
    if(mode!=="exterior"&&planModel){
     for(const face of wallFaceOwners(finishRooms,cell)){
      const mat=bindFinish(face.id,"wall",colourRef.current,face.side),offset=face.inward*(thickness/2+.002);
      box(dummy.position.x+(cell.axis==="x"?offset:0),dummy.position.y,dummy.position.z+(cell.axis==="z"?offset:0),cell.axis==="x"?.003:length,(cell.topFt-cell.bottomFt)*FT,cell.axis==="z"?.003:length,mat,false);
     }
    }
   });instances.instanceMatrix.needsUpdate=true;instances.castShadow=true;instances.receiveShadow=true;site.add(instances);
   const glass=new THREE.MeshPhysicalMaterial({color:"#9ebdc5",roughness:.16,metalness:.12,transparent:true,opacity:.72,clearcoat:.65,clearcoatRoughness:.16,envMapIntensity:1.1});materials.push(glass);const frameMat=material(design.elevation.surfaces.frame,.35,.3);
   const airGreen=material("#16865d",.5),airAmber=material("#b47825",.6);
   const airWindows=new Map((planModel?modeledWindowGeometry(planModel,mode==="exterior"?undefined:selectedFloor,mode==="dollhouse"?planModel.walls.heightFt*CUTAWAY_WALL_RATIO:planModel.walls.heightFt):[]).map(o=>[windowGeometryKey(o.roomId,o.side,o.atFt,o.widthFt),o]));
   for(const room of design.layout.rooms){if(!visible(room.floorIndex)||room.kind==="open"||room.kind==="parking")continue;
    const base=room.floorIndex*height;for(const o of room.openings){if(o.kind!=="window")continue;
     const openingHeight=Math.min(o.heightFt,(mode==="dollhouse"?design.layout.wallHeightFt*CUTAWAY_WALL_RATIO:design.layout.wallHeightFt)-o.sillFt);if(openingHeight<=.01)continue;
     const vertical=o.wall==="left"||o.wall==="right",plane=vertical?room.xFt+(o.wall==="right"?room.wFt:0):room.yFt+(o.wall==="rear"?room.dFt:0);
     // All actual windows, including stepped upper floors, use their plan coordinates.
     const middle=(vertical?room.yFt:room.xFt)+o.offsetFt+o.widthFt/2;
     const xpos=vertical?xCoord(plane):xCoord(middle),zpos=vertical?zCoord(middle):zCoord(plane),ypos=base+(o.sillFt+openingHeight/2)*FT;
     const wi=o.widthFt*FT,he=openingHeight*FT;
     const air=airWindows.get(windowGeometryKey(room.id,o.wall,o.offsetFt,o.widthFt));const openingFrame=showAir&&air?(air.exposure==="review"?airAmber:airGreen):frameMat;
     box(xpos,ypos,zpos,vertical?.055:wi,he,vertical?wi:.055,glass,false);
     const trim=Math.min(.055,wi*.08,he*.08);
     for(const offset of [-1,1]){
      box(xpos,ypos+offset*(he-trim)/2,zpos,vertical?.08:wi,trim,vertical?wi:.08,openingFrame);
      box(xpos+(vertical?0:offset*(wi-trim)/2),ypos,zpos+(vertical?offset*(wi-trim)/2:0),vertical?.08:trim,he,vertical?trim:.08,openingFrame);
     }
     if(wi>.8)box(xpos,ypos,zpos,vertical?.06:trim*.7,he,vertical?trim*.7:.06,openingFrame);
    }
   }
   const floorSurfaces={bath:material("#c7d5d6"),bedroom:material("#dbc7aa"),kitchen:material("#d7d9cf"),stairs:concrete};
   for(const r of design.layout.rooms){if(!visible(r.floorIndex)||r.kind==="open"||r.kind==="parking")continue;const surface=planModel?bindFinish(r.id,"floor","#c9b69d"):r.kind==="bath"||r.kind==="bedroom"||r.kind==="kitchen"||r.kind==="stairs"?floorSurfaces[r.kind]:floorMat;
    const sourceRoom=planModel?.rooms.find(room=>room.id===r.id);
    const patches=sourceRoom?stairFloorPatches(sourceRoom,stairReview?.studies??[]):[{x:r.xFt,y:r.yFt,w:r.wFt,d:r.dFt}];
    for(const patch of patches)if(patch.w*FT>.03&&patch.d*FT>.03)box(xCoord(patch.x+patch.w/2),r.floorIndex*height+.09,zCoord(patch.y+patch.d/2),patch.w*FT-.03,.025,patch.d*FT-.03,surface,false);
    if(mode==="walkthrough"&&r.kind!=="stairs"&&planModel)box(xCoord(r.xFt+r.wFt/2),(r.floorIndex+1)*height-.08,zCoord(r.yFt+r.dFt/2),r.wFt*FT-.03,.02,r.dFt*FT-.03,bindFinish(r.id,"ceiling","#ffffff"),false);
   }
   if(showFurniture&&planModel&&mode!=="exterior"){
    const timber=material("#a4896d"),upholstery=material("#c4c7ba"),linen=material("#eee9df"),worktop=material("#777d78");
    for(const p of planFurniture(planModel).filter(p=>visible(p.floor))){
     const x=xCoord(p.x+p.w/2),z=zCoord(p.y+p.d/2),base=p.floor*height+.11,h=p.heightFt*FT,w=p.w*FT,d=p.d*FT;
     const capped=mode==="dollhouse"?Math.min(h,height*CUTAWAY_WALL_RATIO-.12):h;
     if(p.kind==="table"){
      const leg=Math.min(.065,w*.13,d*.13),top=Math.min(.06,capped*.2);
      box(x,base+capped-top/2,z,w,top,d,timber,false);
      for(const dx of [-1,1])for(const dz of [-1,1])box(x+dx*(w/2-leg),base+(capped-top)/2,z+dz*(d/2-leg),leg,capped-top,leg,timber,false);
     }else if(p.kind==="sofa"){
      box(x,base+.20,z,w,.40,d,upholstery,false);
      box(x,base+capped/2,z+d*.4,w,capped,d*.20,upholstery,false);
      for(const dx of [-1,1])box(x+dx*w*.45,base+.36,z,w*.10,.42,d,upholstery,false);
     }else{
      if(p.kind==="bed"){
       const frameH=capped*.48,mattress=capped-frameH;
       box(x,base+frameH/2,z,w,frameH,d,timber,false);
       box(x,base+frameH+mattress/2,z,w*.96,mattress,d*.97,linen,false);
       box(x,base+capped+.035,z-d*.32,w*.75,.07,d*.19,upholstery,false);
       box(x,base+frameH,z-d*.47,w,.32,d*.06,timber,false);
      }else if(p.kind==="counter"){
       const slab=Math.min(.045,capped*.1);box(x,base+(capped-slab)/2,z,w,capped-slab,d,timber,false);
       box(x,base+capped-slab/2,z,w,slab,d,worktop,false);
       for(const q of [-.3,0,.3])box(x+w*q,base+capped*.66,z+d*.49,w*.12,.025,.018,railingMat,false);
      }else{
       box(x,base+capped/2,z,w,capped,d,timber,false);
       for(const q of [-.1,.1])box(x+w*q,base+capped*.55,z+d*.49,.025,.16,.018,railingMat,false);
      }
     }
    }
   }
   // A bay is not a staircase. Render only checked flights and landings.
   // Adjacent tread envelopes overlap vertically; no solid blocks filling the headroom beneath the next flight. No invented flight in a narrow reserve.
   for(const stair of stairReview?.studies.filter(s=>visible(s.floor))??[]){
    for(const step of stair.steps){const thickness=stairStepDepthFt(stair,step.topFt)*FT;box(xCoord(step.x+step.w/2),stair.floor*height+step.topFt*FT-thickness/2,zCoord(step.y+step.d/2),step.w*FT,thickness,step.d*FT,concrete);}
    for(const landing of stair.landings.filter(l=>l.topFt>0)){const thickness=.14;box(xCoord(landing.x+landing.w/2),stair.floor*height+landing.topFt*FT-thickness/2,zCoord(landing.y+landing.d/2),landing.w*FT,thickness,landing.d*FT,concrete);}
   }
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
   if(planModel&&mode==="exterior")for(const a of facadeAccents(planModel))box(xCoord(a.x+a.w/2),(a.y+a.h/2)*FT,zCoord(a.z-a.d/2),a.w*FT,a.h*FT,a.d*FT,roofMat);
   const roofGroup=new THREE.Group();const roof=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=new THREE.Mesh(shared,roofMat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;roofGroup.add(m)};
   const top=design.floors*height,parapet=design.layout.parapetHeightFt*FT;
   if(planModel){
    for(const r of exposedRoofPatches(planModel).filter(r=>r.floor<design.floors))roof(xCoord(r.x+r.w/2),r.floor*height+.08,zCoord(r.y+r.d/2),r.w*FT,.18,r.d*FT);
    const enclosed=planModel.rooms.filter(r=>r.floor===design.floors-1&&!["parking","verandah","balcony","terrace"].includes(r.kind));
    for(const r of enclosed){
     roof(xCoord(r.x+r.w/2),top+.08,zCoord(r.y+r.d/2),r.w*FT,.18,r.d*FT);
     // Split each roof edge at neighboring spans, retaining only its exposed perimeter.
     for(const side of ["front","rear","left","right"] as const){
      const horizontal=side==="front"||side==="rear",plane=horizontal?r.y+(side==="rear"?r.d:0):r.x+(side==="right"?r.w:0);
      const start=horizontal?r.x:r.y,end=start+(horizontal?r.w:r.d);
      const adjacent=enclosed.filter(s=>s.id!==r.id&&Math.abs((horizontal?s.y+(side==="front"?s.d:0):s.x+(side==="left"?s.w:0))-plane)<.001).map(s=>[horizontal?s.x:s.y,(horizontal?s.x+s.w:s.y+s.d)] as const);
      const cuts=[start,end,...adjacent.flatMap(([a,b])=>[Math.max(start,a),Math.min(end,b)]).filter(v=>v>start&&v<end)].sort((a,b)=>a-b);
      for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i],mid=(a+b)/2;if(b-a<.001||adjacent.some(([lo,hi])=>mid>lo&&mid<hi))continue;
       const x=xCoord(horizontal?mid:plane),z=zCoord(horizontal?plane:mid),span=(b-a)*FT;
       roof(x,top+.16+parapet/2,z,horizontal?span:.15,parapet,horizontal?.15:span);
       if(quality==="detail")roof(x,top+.16+parapet+.035,z,horizontal?span:.21,.07,horizontal?.21:span);
      }
     }
    }
   }else roof(cx,top+.08,cz,W+.25,.18,D+.25);
   if(!planModel){
    roof(cx,top+parapet/2+.14,zCoord(fp.minZ),W+.25,parapet,.18);roof(cx,top+parapet/2+.14,zCoord(fp.maxZ),W+.25,parapet,.18);
    roof(xCoord(fp.minX),top+parapet/2+.14,cz,.18,parapet,D+.25);roof(xCoord(fp.maxX),top+parapet/2+.14,cz,.18,parapet,D+.25);
   }
   if(planModel)for(const r of otsGrilleBars(planModel)){const m=new THREE.Mesh(shared,showAir?airGreen:railingMat);m.name="Concept roof ventilation grille";m.position.set(xCoord(r.x+r.w/2),top+.17,zCoord(r.y+r.d/2));m.scale.set(r.w*FT,.045,r.d*FT);roofGroup.add(m);}
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
    if(quality==="detail"){const road=material("#62696b",.95),paving=material("#b8b3a6",.94);box(0,-.19,-depth/2-2.2,width*1.6,.06,3.5,road,false);box(0,-.15,-depth/2-.35,width*1.6,.08,.7,paving,false);}
   }
   scene.add(new THREE.HemisphereLight(lighting==="day"?"#edf5ff":"#a8bce6","#78816d",quality==="detail"?1.2:1.45));const sun=new THREE.DirectionalLight(lighting==="day"?"#fff1d7":"#ffba83",lighting==="day"?2.6:1.6);sun.position.set(-width*.8,top+(lighting==="day"?8:1.8),-depth*.85).applyAxisAngle(new THREE.Vector3(0,1,0),angle);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(quality==="detail"?1536:512,quality==="detail"?1536:512);sun.shadow.camera.left=-width*1.8;sun.shadow.camera.right=width*1.8;sun.shadow.camera.top=depth*1.8;sun.shadow.camera.bottom=-depth*1.8;sun.shadow.bias=-.001;sun.shadow.normalBias=.025;scene.add(sun);
   const camera=new THREE.PerspectiveCamera(46,1,.04,300);
   const focusHeight=selectedFloor!==undefined&&mode!=="exterior"?(selectedFloor+.5)*height:Math.min(top,top*.55);
   const up=new THREE.Vector3(0,1,0);
   const focus=new THREE.Vector3(cx,mode==="walkthrough"?(selectedFloor??0)*height+1.55:focusHeight,cz).applyAxisAngle(up,angle);
   const direction=new THREE.Vector3(.74,mode==="dollhouse"||mode==="floor"?1.85:.48,-1).normalize().applyAxisAngle(up,angle);
   controls=new OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;
   controls.enablePan=mode==="walkthrough";
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
   const high=mode==="exterior"||selectedFloor===undefined?top+parapet+.3:(selectedFloor+((mode==="dollhouse"&&!stairReview?.studies.some(s=>s.floor===selectedFloor))?CUTAWAY_WALL_RATIO:1))*height;
   for(const x of [-width/2,width/2])for(const y of [low,high])for(const z of [-depth/2,depth/2]){
    corners.push(new THREE.Vector3(x,y,z).applyAxisAngle(up,angle).sub(focus));
   }
   const radius=Math.max(...corners.map(p=>p.length()));
   const orbitFit=()=>{const halfY=THREE.MathUtils.degToRad(camera.fov/2),halfX=Math.atan(Math.tan(halfY)*camera.aspect);return radius/Math.sin(Math.min(halfX,halfY))*1.08;};
   scheduler=browserFrameScheduler(()=>{if(!renderer||!controls||disposed)return;try{controls.update();renderer.render(scene,camera)}catch{if(!disposed)setFallback(true)}});
   const schedule=scheduler.schedule;document.addEventListener("visibilitychange",scheduler.visibility);
   refresh.current=schedule;controls.addEventListener("change",schedule);
   let lastWidth=0,lastHeight=0;
   const resize=()=>{
    if(!renderer||!controls||target.clientWidth<1)return;
    const w=target.clientWidth,h=Math.max(260,Math.min(630,Math.round(w*.78)));
    if(w===lastWidth&&h===lastHeight)return;
    lastWidth=w;lastHeight=h;renderer.setSize(w,h);
    camera.aspect=w/h;
    if(mode!=="walkthrough"){
     const currentDirection=camera.position.clone().sub(controls.target).normalize();
     if(currentDirection.lengthSq()>.1&&Math.abs(currentDirection.dot(up))<.999999)activeDirection=currentDirection;
     const fit=projectedFit(corners,activeDirection,up,camera.fov,camera.aspect,1.24);
     const offset=activeDirection.clone().multiplyScalar(Math.max(fit,orbitFit()));
     controls.maxDistance=fit*3;
     camera.far=Math.max(300,fit*5);
     controls.target.copy(focus);camera.position.copy(focus).add(offset);

    }
    camera.updateProjectionMatrix();
    controls.update();
    schedule();
   };
   cameraView.current=(view)=>{
    if(!controls||mode==="walkthrough")return;
    const v=({front:[0,.18,-1],rear:[0,.18,1],left:[-1,.25,0],right:[1,.25,0],top:[0,1,-.001],fit:[.74,1.85,-1]} as const)[view];
    const dir=new THREE.Vector3(v[0],v[1],v[2]).normalize().applyAxisAngle(up,angle);
    const fit=projectedFit(corners,dir,up,camera.fov,camera.aspect,1.24);
    activeDirection=dir;controls.target.copy(focus);controls.maxDistance=Math.max(fit*3,10);camera.far=Math.max(300,fit*5);camera.updateProjectionMatrix();
    camera.position.copy(focus).addScaledVector(dir,view==="fit"?Math.max(fit,orbitFit()):fit);controls.update();schedule();
   };
   // Snapshot the actual visible scene in site-local coordinates. The site rotation
   // is removed from both camera and boxes, preserving the exact road orientation.
   updateFinish.current=(next)=>{
    const current=next?.planId===planModel?.id?next:undefined;
    for(const b of finishBindings){
     const f=current?.rooms[b.id];
     b.mat.color.set(b.side?wallShade(f,b.side,b.fallback):f?.[b.surface]??b.fallback);
     const map=texture(f?.materials?.[b.surface]??"plain");if(b.mat.map!==map){b.mat.map=map;b.mat.needsUpdate=true;}
    }
    glass.color.set(current?.glass??"#9ebdc5");if(renderer)renderer.shadowMap.needsUpdate=true;refresh.current?.();
   };
   updateFinish.current(schemeRef.current);
   captureRender.current=()=>{
    site.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const inverse=site.matrixWorld.clone().invert(),transform=new THREE.Matrix4(),instance=new THREE.Matrix4(),boxes:RenderBox[]=[];
    site.traverseVisible(object=>{
     if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial))return;
     const mat=object.material;
     if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
     const bounds=object.geometry.boundingBox;if(!bounds)return;
     const append=(matrix:THREE.Matrix4)=>{
      const b=bounds.clone().applyMatrix4(matrix);
      if(b.isEmpty()||!Number.isFinite(b.min.x+b.min.y+b.min.z+b.max.x+b.max.y+b.max.z))return;
      boxes.push({lo:b.min.toArray(),hi:b.max.toArray(),color:[mat.color.r,mat.color.g,mat.color.b],opacity:mat.transparent?mat.opacity:1,metal:mat.metalness,rough:mat.roughness});
     };
     transform.multiplyMatrices(inverse,object.matrixWorld);
     if(object instanceof THREE.InstancedMesh){for(let i=0;i<object.count;i++){object.getMatrixAt(i,instance);append(transform.clone().multiply(instance));}}
     else append(transform);
    });
    const worldCamera=inverse.clone().multiply(camera.matrixWorld);
    return {boxes,camera:{origin:new THREE.Vector3().setFromMatrixPosition(worldCamera).toArray(),forward:new THREE.Vector3(0,0,-1).transformDirection(worldCamera).toArray(),right:new THREE.Vector3(1,0,0).transformDirection(worldCamera).toArray(),up:new THREE.Vector3(0,1,0).transformDirection(worldCamera).toArray(),fov:camera.fov,aspect:camera.aspect},evening:lighting==="evening"};
   };
   exportScene.current=async()=>{
    const {GLTFExporter}=await import("three/addons/exporters/GLTFExporter.js");
    if(disposed)throw new Error("The selected model changed. Try exporting again.");
    // Flatten instanced wall cells only for export, for compatibility with offline renderers.
    // The live view retains its efficient instanced meshes.
    const snapshot=site.clone(true),instanced:THREE.InstancedMesh[]=[];
    snapshot.traverse(o=>{if(o instanceof THREE.InstancedMesh)instanced.push(o)});
    for(const source of instanced){
     const parent=source.parent;if(!parent)continue;
     const group=new THREE.Group();group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);group.visible=source.visible;
     const transform=new THREE.Matrix4();
     for(let i=0;i<source.count;i++){source.getMatrixAt(i,transform);const mesh=new THREE.Mesh(source.geometry,source.material);transform.decompose(mesh.position,mesh.quaternion,mesh.scale);group.add(mesh);}
     parent.add(group);parent.remove(source);
    }
    const exportRoot=new THREE.Group();exportRoot.add(snapshot);
    const exportCamera=camera.clone();exportCamera.name="NeervaRenderCamera";exportRoot.add(exportCamera);exportRoot.updateMatrixWorld(true);
    const output=await new GLTFExporter().parseAsync(exportRoot,{binary:true,onlyVisible:true,includeCustomExtensions:false});
    if(disposed||!(output instanceof ArrayBuffer))throw new Error("Scene changed or export was unavailable.");
    const href=URL.createObjectURL(new Blob([output],{type:"model/gltf-binary"}));
    try{const a=document.createElement("a");a.href=href;a.download="neerva-"+design.id.replace(/[^a-zA-Z0-9_-]/g,"-")+"-"+mode+".glb";a.click();}
    finally{window.setTimeout(()=>URL.revokeObjectURL(href),1000);}
   };
   observer=new ResizeObserver(resize);observer.observe(target);resize();
  }catch{failedTimer=window.setTimeout(()=>setFallback(true),0)}
  return()=>{disposed=true;updateFinish.current=null;exportScene.current=null;captureRender.current=null;environmentTarget?.dispose();if(scheduler){document.removeEventListener("visibilitychange",scheduler.visibility);scheduler.dispose();}window.clearTimeout(failedTimer);refresh.current=null;cameraView.current=null;wallMat.current=null;observer?.disconnect();controls?.dispose();shared.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();scene.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();if(o instanceof THREE.DirectionalLight)o.shadow.dispose()});releaseStudioRenderer(renderer,target,contextLost)};
 },[design,mode,planModel,selectedFloor,wallCells,showFurniture,showAir,quality,lighting,stairReview,fallback]);
 async function downloadModel(){if(!exportScene.current||exporting)return;setExporting(true);setExportStatus("");try{await exportScene.current();setExportStatus("3D scene exported. Open the GLB in Blender for offline architectural rendering.");}catch{setExportStatus("Export unavailable. Keep the current plan open and retry.");}finally{setExporting(false);}}
 return <section className="nbd-building" data-plan-id={design.id} data-frontage-signature={planModel?frontageSignature(planModel):undefined} data-selected-floor={mode==="exterior"?"all":selectedFloor??"all"} data-wall-cells={wallCells.length} data-ventilation-windows={airSummary?.windows} data-visible-ventilation-windows={airSummary?.visible} data-roof-jaal={airSummary?.shaft?"modeled":"not-modeled"}><div className="nbd-hrow"><h2>Plan-based 3D house</h2><span>{selectedFloor===undefined?"Full building":mode==="exterior"?"Full building · all floors":`${["Ground floor","First floor","Second floor"][selectedFloor]??`Floor ${selectedFloor+1}`} only`} · touch to rotate</span></div>{fallback?<div><p role="status">Interactive rotation is unavailable on this device. Your matched plan remains available.</p><button type="button" onClick={()=>{setQuality("balanced");setFallback(false)}}>Retry interactive 3D</button>{planModel?<PlanAxonometric plan={planModel} design={design} floor={mode==="exterior"?undefined:selectedFloor} cutaway={mode==="dollhouse"} showVentilation={showAir}/>:<DesignPlanArt design={design} floor={selectedFloor??0}/>}</div>:<div ref={host} className="nbd-webgl" aria-label="Interactive 3D building model with touch orbit and zoom"/>}{!fallback&&<>{mode!=="walkthrough"&&<div className="nbd-buttons" role="group" aria-label="3D camera views">{(["front","rear","left","right","top","fit"] as CameraView[]).map(view=><button type="button" key={view} onClick={()=>cameraView.current?.(view)}>{({front:"Front view",rear:"Rear view",left:"Left view",right:"Right view",top:"Top view",fit:"Fit model"} as const)[view]}</button>)}</div>}</>}<div className="nbd-buttons nbd-mode-controls" role="group" aria-label="3D display mode">{(["exterior","dollhouse","floor","walkthrough"] as Mode[]).map(option=><button key={option} aria-pressed={mode===option} onClick={()=>setMode(option)}>{option==="walkthrough"?"Eye-level beta":option==="dollhouse"?"Selected floor cutaway":option==="floor"?"Full-height floor":"Full exterior · all floors"}</button>)}</div>{airSummary&&<div className="nbd-air-tools"><div className="nbd-buttons"><button type="button" aria-pressed={showAir} onClick={()=>{setShowAir(v=>!v);if(!showAir&&mode==="dollhouse"&&airSummary.visible<airSummary.windows)setMode("floor")}}>{showAir?"Hide ventilation highlights":"Highlight ventilation in 3D"}</button>{airSummary.shaft&&mode==="exterior"&&!fallback&&<button type="button" onClick={()=>cameraView.current?.("top")}>See roof jaal from above</button>}</div><p className="nbd-disclaimer">{airSummary.screened}/{airSummary.windows} modeled windows with screened exposure · {airSummary.added} ventilation additions · {airSummary.shaft?"Roof-jaal reserve modeled":"Roof jaal not modeled"}.{airSummary.visible<airSummary.windows?" High-level windows are above the cutaway; use full-height floor.":""}{showAir?" Green = screened; amber = review. Model shows openings, not airflow simulation.":""}</p></div>}{!fallback&&<details className="nbd-quality-options"><summary>View settings & export</summary>{planModel&&mode!=="exterior"&&<label><input type="checkbox" checked={showFurniture} onChange={e=>setShowFurniture(e.target.checked)}/> Show optional furniture for space guidance</label>}<div className="nbd-buttons" role="group" aria-label="3D rendering quality"><button type="button" aria-pressed={quality==="balanced"} onClick={()=>setQuality("balanced")}>Smooth preview</button><button type="button" aria-pressed={quality==="detail"} onClick={()=>setQuality("detail")}>Enhanced detail</button></div><div className="nbd-buttons" role="group" aria-label="Scene lighting"><button type="button" aria-pressed={lighting==="day"} onClick={()=>setLighting("day")}>Daylight</button><button type="button" aria-pressed={lighting==="evening"} onClick={()=>setLighting("evening")}>Evening</button></div><button type="button" disabled={exporting} onClick={()=>void downloadModel()}>{exporting?"Exporting…":"Download 3D scene (.glb)"}</button>{exportStatus&&<p role="status">{exportStatus}</p>}</details>}{!fallback&&<BrowserArchitectureRender key={JSON.stringify([design.id,colour,mode,selectedFloor,lighting,quality,showFurniture,planModel?.facade,scheme])} capture={()=>captureRender.current?.()??null}/>}{planModel&&stairReview&&stairReview.unresolved.length>0&&<p role="status" className="nbd-disclaimer"><strong>Stair layout unresolved.</strong> Stair space is reserved, but usable flights and headroom are not verified. Ask an architect before building.</p>}<p className="nbd-disclaimer">Concept only · professional review required before construction.</p><details className="nbd-model-help"><summary>How to read this model</summary><p>Cutaway lowers walls for visibility only; the actual wall height stays unchanged. Full-height floor keeps complete walls on the selected level; full exterior shows all floors. Openings follow the selected plan; eye-level is an illustrative view, not a measured walkthrough.</p></details></section>;
}

