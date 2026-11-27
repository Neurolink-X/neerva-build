"use client";
import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {studioDevice,configureStudioRenderer,releaseStudioRenderer,studioMaterialTexture,plasterTexture as makePlaster,projectedFit} from "@/modules/studio/core/render-core";
import {browserFrameScheduler} from "@/modules/studio/core/frame-scheduler";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import type {RenderSnapshot,RenderFinish,RenderBox} from "../../public/studio-render-v1";
type CameraPreset="fit"|"front"|"rear"|"top";
type Viewer={update:(snapshot:RenderSnapshot)=>void;reset:(preset?:CameraPreset)=>void};
export default function CommercialRoomViewer({snapshot,exterior=false,onUnavailable}:{snapshot:RenderSnapshot|null;exterior?:boolean;onUnavailable?:()=>void}){
 const host=useRef<HTMLDivElement>(null),viewer=useRef<Viewer|null>(null);
 const [unavailable,setUnavailable]=useState(false),[sceneIssue,setSceneIssue]=useState("");
 useEffect(()=>{if(unavailable||sceneIssue)onUnavailable?.()},[unavailable,sceneIssue,onUnavailable]);
 useEffect(()=>{
  const target=host.current;if(!target)return;
  let renderer:THREE.WebGLRenderer|undefined,environment:THREE.WebGLRenderTarget|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,disposed=false;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(65,1,.03,2000),group=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1);
  const meshes:(THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>|THREE.InstancedMesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>)[]=[];
  const cache=new Map<RenderFinish,THREE.DataTexture>();
  let plaster:THREE.DataTexture|undefined;
  function plasterTexture(){return plaster??=makePlaster(3107);}

  let geometryKey="",appearanceKey="",current:RenderSnapshot|null=null;
  let cameraPreset:CameraPreset="fit";
  const lamps:THREE.PointLight[]=[];
  const {constrained,cores}=studioDevice();
  const detailed=!constrained&&window.innerWidth>=768&&cores>=6;
  const shadows=!constrained&&(exterior||detailed);
  const contextLost=(event:Event)=>{event.preventDefault();setUnavailable(true);};
  scene.add(group);
  const ambient=new THREE.HemisphereLight(0xeaf3ff,0xbcb5a8,1.4),sun=new THREE.DirectionalLight(0xfff3da,2.5);sun.position.set(4,9,2);scene.add(ambient,sun);
  const scheduler=browserFrameScheduler(()=>{if(!disposed&&renderer){try{renderer.render(scene,camera)}catch{setUnavailable(true)}}});const schedule=scheduler.schedule;
  const clear=()=>{for(const m of meshes){group.remove(m);if(m instanceof THREE.InstancedMesh)m.dispose();m.material.dispose()}meshes.length=0;};
  function texture(finish:RenderFinish){
   if(finish==="plain")return null;const existing=cache.get(finish);if(existing)return existing;
   const t=studioMaterialTexture(finish,"commercial");cache.set(finish,t);return t;
  }
  const reset=(preset:CameraPreset="fit")=>{
   if(!current||!controls)return;
   cameraPreset=preset;
   const c=current.camera;camera.position.fromArray(c.origin);camera.fov=c.fov;camera.updateProjectionMatrix();
   if(exterior){
    const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3()),dir=camera.position.clone().sub(center).normalize();
    if(preset==="front")dir.set(0,.08,-1).normalize();else if(preset==="rear")dir.set(0,.08,1).normalize();else if(preset==="top")dir.set(0,1,-.001).normalize();else if(dir.lengthSq()<.1)dir.set(1,.6,-1).normalize();
    const corners:THREE.Vector3[]=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z).sub(center));
    const fit=projectedFit(corners,dir,new THREE.Vector3(0,1,0),camera.fov,Math.max(.1,camera.aspect),1.12,1);
    // Fit the actual projected bounds, not an enclosing sphere: wide commercial sites otherwise shrink excessively on phones.
    controls.target.copy(center);controls.maxDistance=Math.max(fit*3,50);camera.far=Math.max(2000,fit*5);camera.position.copy(center).addScaledVector(dir,fit);camera.updateProjectionMatrix();
   }else controls.target.copy(camera.position).add(new THREE.Vector3(...c.forward).multiplyScalar(2));
   controls.update();schedule();
  };
  try{
   renderer=new THREE.WebGLRenderer({antialias:!constrained,alpha:false,powerPreference:"low-power"});
   configureStudioRenderer(renderer,{constrained,pixelRatio:detailed?1.75:1.25,shadows,exposure:1});
   sun.castShadow=shadows;sun.shadow.mapSize.set(detailed?1024:512,detailed?1024:512);sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
   // Small procedural studio environment: no external HDR downloads.
   const envScene=new THREE.Scene();envScene.background=new THREE.Color(0x888f99);
   const panelGeo=new THREE.PlaneGeometry(8,6),panelMaterials=[new THREE.MeshBasicMaterial({color:0xe5efff,side:THREE.DoubleSide}),new THREE.MeshBasicMaterial({color:0xffe0b6,side:THREE.DoubleSide})];
   const a=new THREE.Mesh(panelGeo,panelMaterials[0]);a.position.set(-5,4,0);a.lookAt(0,0,0);envScene.add(a);
   const b=new THREE.Mesh(panelGeo,panelMaterials[1]);b.position.set(5,3,2);b.lookAt(0,0,0);envScene.add(b);
   const pmrem=new THREE.PMREMGenerator(renderer);try{environment=pmrem.fromScene(envScene,.12);scene.environment=environment.texture;}finally{pmrem.dispose();panelGeo.dispose();panelMaterials.forEach(m=>m.dispose());}
   renderer.domElement.addEventListener("webglcontextlost",contextLost);
   renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.domElement.style.touchAction="none";target.appendChild(renderer.domElement);
   controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=!exterior;controls.minDistance=.3;controls.maxDistance=50;controls.addEventListener("change",schedule);
   const resize=()=>{if(!renderer)return;const w=Math.max(1,target.clientWidth),h=Math.max(1,target.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(exterior&&current)reset(cameraPreset);schedule()};
   observer=new ResizeObserver(resize);observer.observe(target);resize();
   viewer.current={reset,update(next){
    if(!next.boxes.length||next.boxes.length>(constrained?1200:2500)||next.boxes.some(b=>b.hi.some((v,i)=>!Number.isFinite(v)||!Number.isFinite(b.lo[i])||v<=b.lo[i])||b.color.some(v=>!Number.isFinite(v)||v<0||v>1)||[b.rough,b.metal,b.opacity].some(v=>!Number.isFinite(v)||v<0||v>1))){
     clear();current=null;geometryKey="";appearanceKey="";setSceneIssue("This scene exceeds the supported interactive detail budget or contains invalid geometry. Use the matched 2D or lightweight concept view.");schedule();return;
    }
    setSceneIssue("");
    current=next;
    const key=JSON.stringify(next.boxes.map(b=>[b.lo,b.hi]));
    const nextAppearance=JSON.stringify(next.boxes.map(b=>[b.color,b.rough,b.metal,b.opacity,b.finish??"plain"]));
    if(key!==geometryKey||nextAppearance!==appearanceKey){
     const geometryChanged=key!==geometryKey;
     clear();geometryKey=key;appearanceKey=nextAppearance;
     // Batch identical opaque surfaces, but leave glass separate for correct
     // transparent sorting. Geometry is unchanged; camera remains on colour edits.
     const batches=new Map<string,RenderBox[]>(),glass:RenderBox[]=[];
     for(const b of next.boxes){
      if(b.opacity<.98){glass.push(b);continue}
      const k=JSON.stringify([b.color,b.rough,b.metal,b.opacity,b.finish??"plain"]);
      const batch=batches.get(k)??[];batch.push(b);batches.set(k,batch);
     }
     const material=(b:RenderBox)=>{const transparent=b.opacity<.98,m=new THREE.MeshStandardMaterial({roughness:b.rough,metalness:b.metal,opacity:b.opacity,transparent,depthWrite:!transparent,map:texture(b.finish??"plain"),envMapIntensity:transparent?1.2:.55});m.color.setRGB(...b.color,THREE.SRGBColorSpace);if(!transparent&&b.rough>=.75&&b.metal<.1&&(!b.finish||b.finish==="plain")){m.bumpMap=plasterTexture();m.bumpScale=.008;}return m;};
     const dummy=new THREE.Object3D();
     const transform=(b:RenderBox,obj:THREE.Object3D)=>{obj.position.set(...b.lo.map((v,i)=>(v+b.hi[i])/2) as [number,number,number]);obj.scale.set(...b.lo.map((v,i)=>b.hi[i]-v) as [number,number,number]);obj.updateMatrix();};
     for(const batch of batches.values()){
      const mesh=new THREE.InstancedMesh(geometry,material(batch[0]),batch.length);
      batch.forEach((b,i)=>{transform(b,dummy);mesh.setMatrixAt(i,dummy.matrix)});
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.castShadow=shadows;mesh.receiveShadow=shadows;group.add(mesh);meshes.push(mesh);
     }
     for(const b of glass){const mesh=new THREE.Mesh(geometry,material(b));transform(b,mesh);mesh.receiveShadow=shadows;group.add(mesh);meshes.push(mesh);}
     target.dataset.sceneBoxes=String(next.boxes.length);target.dataset.meshBatches=String(meshes.length);target.dataset.renderTier=constrained?"constrained":detailed?"detail":"balanced";
     if(geometryChanged){
      const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      const extent=Math.max(2,size.length()*.65);sun.position.copy(center).add(new THREE.Vector3(extent,extent*1.5,extent));sun.target.position.copy(center);scene.add(sun.target);
      const shadow=sun.shadow.camera;shadow.left=-extent;shadow.right=extent;shadow.top=extent;shadow.bottom=-extent;shadow.far=extent*5;shadow.updateProjectionMatrix();reset();
     }
    }
    for(const lamp of lamps)scene.remove(lamp);lamps.length=0;
    for(const source of (next.lights??[]).slice(0,4)){if(!source.position.every(Number.isFinite)||!source.color.every(Number.isFinite)||!Number.isFinite(source.power)||source.power<0)continue;const lamp=new THREE.PointLight(new THREE.Color().setRGB(...source.color,THREE.SRGBColorSpace),Math.min(source.power,100),0,2);lamp.position.fromArray(source.position);scene.add(lamp);lamps.push(lamp);}
    scene.background=new THREE.Color(next.evening?0x8895a9:0xe1e8ec);ambient.intensity=next.evening?.95:.95;sun.intensity=next.evening?1.7:2.15;sun.color.set(next.evening?0xffc48b:0xfff3da);if(renderer)renderer.shadowMap.needsUpdate=true;schedule();
   }};
   document.addEventListener("visibilitychange",scheduler.visibility);
  }catch{queueMicrotask(()=>{if(!disposed)setUnavailable(true)})}
  return()=>{disposed=true;viewer.current=null;scheduler.dispose();document.removeEventListener("visibilitychange",scheduler.visibility);observer?.disconnect();controls?.dispose();clear();geometry.dispose();for(const t of cache.values())t.dispose();plaster?.dispose();environment?.dispose();sun.shadow.dispose();releaseStudioRenderer(renderer,target,contextLost);};
 },[exterior]);
 useEffect(()=>{if(snapshot)viewer.current?.update(snapshot)},[snapshot]);
 return <section aria-label={exterior?"Interactive commercial building":"Interactive commercial room"} data-room-viewer><div ref={host} hidden={unavailable||!snapshot||!!sceneIssue} style={{width:"100%",height:"clamp(280px,57vw,480px)",borderRadius:10,overflow:"hidden",background:"#e1e8ec"}}/>{!snapshot||sceneIssue?<p role="status">{sceneIssue||"No valid scene is available for the selected input."}</p>:unavailable?<p role="status">Interactive 3D is unavailable on this device. Use the image preview below.</p>:<div className="commercial-camera-controls" role="group" aria-label="Commercial camera views"><button type="button" className="button button-outline" onClick={()=>viewer.current?.reset()}>Reset view</button>{exterior&&<><button type="button" className="button button-outline" onClick={()=>viewer.current?.reset("front")}>Street view</button><button type="button" className="button button-outline" onClick={()=>viewer.current?.reset("rear")}>Rear view</button><button type="button" className="button button-outline" onClick={()=>viewer.current?.reset("top")}>Top view</button></>}</div>}</section>;
}
