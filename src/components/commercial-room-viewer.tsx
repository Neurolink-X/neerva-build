"use client";
import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import type {RenderSnapshot,RenderFinish,RenderBox} from "../../public/studio-render-v1";
type Viewer={update:(snapshot:RenderSnapshot)=>void;reset:()=>void};
export default function CommercialRoomViewer({snapshot,exterior=false}:{snapshot:RenderSnapshot|null;exterior?:boolean}){
 const host=useRef<HTMLDivElement>(null),viewer=useRef<Viewer|null>(null);
 const [unavailable,setUnavailable]=useState(false),[sceneIssue,setSceneIssue]=useState("");
 useEffect(()=>{
  const target=host.current;if(!target)return;
  let renderer:THREE.WebGLRenderer|undefined,environment:THREE.WebGLRenderTarget|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,frame=0,disposed=false;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(65,1,.03,2000),group=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1);
  const meshes:(THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>|THREE.InstancedMesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>)[]=[];
  const cache=new Map<RenderFinish,THREE.DataTexture>();
  let geometryKey="",appearanceKey="",current:RenderSnapshot|null=null;
  const lamps:THREE.PointLight[]=[];
  const detailed=window.innerWidth>=768&&(navigator.hardwareConcurrency??4)>=6;
  const shadows=exterior||detailed;
  const contextLost=(event:Event)=>{event.preventDefault();setUnavailable(true);};
  scene.add(group);
  const ambient=new THREE.HemisphereLight(0xeaf3ff,0xbcb5a8,1.4),sun=new THREE.DirectionalLight(0xfff3da,2.5);sun.position.set(4,9,2);scene.add(ambient,sun);
  const schedule=()=>{if(disposed||frame||document.hidden)return;frame=requestAnimationFrame(()=>{frame=0;if(!disposed&&renderer)renderer.render(scene,camera)})};
  const clear=()=>{for(const m of meshes){group.remove(m);if(m instanceof THREE.InstancedMesh)m.dispose();m.material.dispose()}meshes.length=0;};
  function texture(finish:RenderFinish){
   if(finish==="plain")return null;const existing=cache.get(finish);if(existing)return existing;
   const n=128,data=new Uint8Array(n*n*4);
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const a=x/n,b=y/n,vein=Math.abs(Math.sin(a*16+b*6+1.8*Math.sin(b*10)+.6*Math.sin(a*38)));
    const v=finish==="tile"?(x%64<2||y%64<2?158:247):finish==="marble"?Math.round(255*(.79+.21*Math.min(1,vein*4))):finish==="wood"?Math.round(255*(.87+.11*Math.sin(a*190+2*Math.sin(b*6)))):x%32<2||finish==="acp"&&y%64<2?145:245;
    const i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
   }
   const t=new THREE.DataTexture(data,n,n);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;cache.set(finish,t);return t;
  }
  const reset=()=>{
   if(!current||!controls)return;
   const c=current.camera;camera.position.fromArray(c.origin);camera.fov=c.fov;camera.updateProjectionMatrix();
   if(exterior){
    const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3()),dir=camera.position.clone().sub(center).normalize();
    if(dir.lengthSq()<.1)dir.set(1,.6,-1).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize();
    const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    let fit=1;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
     const p=new THREE.Vector3(x,y,z).sub(center);fit=Math.max(fit,p.dot(dir)+1.16*Math.max(Math.abs(p.dot(right))/(tanY*Math.max(.1,camera.aspect)),Math.abs(p.dot(up))/tanY));
    }
    controls.target.copy(center);controls.maxDistance=Math.max(fit*3,50);camera.far=Math.max(2000,fit*5);camera.position.copy(center).addScaledVector(dir,fit);camera.updateProjectionMatrix();
   }else controls.target.copy(camera.position).add(new THREE.Vector3(...c.forward).multiplyScalar(2));
   controls.update();schedule();
  };
  try{
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,detailed?1.75:1.25));renderer.shadowMap.enabled=shadows;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   sun.castShadow=shadows;sun.shadow.mapSize.set(detailed?1024:512,detailed?1024:512);sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
   // Small procedural studio environment: no external HDR downloads.
   const envScene=new THREE.Scene();envScene.background=new THREE.Color(0x888f99);
   const panelGeo=new THREE.PlaneGeometry(8,6),panelMaterials=[new THREE.MeshBasicMaterial({color:0xe5efff,side:THREE.DoubleSide}),new THREE.MeshBasicMaterial({color:0xffe0b6,side:THREE.DoubleSide})];
   const a=new THREE.Mesh(panelGeo,panelMaterials[0]);a.position.set(-5,4,0);a.lookAt(0,0,0);envScene.add(a);
   const b=new THREE.Mesh(panelGeo,panelMaterials[1]);b.position.set(5,3,2);b.lookAt(0,0,0);envScene.add(b);
   const pmrem=new THREE.PMREMGenerator(renderer);try{environment=pmrem.fromScene(envScene,.12);scene.environment=environment.texture;}finally{pmrem.dispose();panelGeo.dispose();panelMaterials.forEach(m=>m.dispose());}
   renderer.domElement.addEventListener("webglcontextlost",contextLost);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
   renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.domElement.style.touchAction="none";target.appendChild(renderer.domElement);
   controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=!exterior;controls.minDistance=.3;controls.maxDistance=50;controls.addEventListener("change",schedule);
   const resize=()=>{if(!renderer)return;const w=Math.max(1,target.clientWidth),h=Math.max(1,target.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(exterior&&current)reset();schedule()};
   observer=new ResizeObserver(resize);observer.observe(target);resize();
   viewer.current={reset,update(next){
    if(!next.boxes.length||next.boxes.length>2500||next.boxes.some(b=>b.hi.some((v,i)=>!Number.isFinite(v)||!Number.isFinite(b.lo[i])||v<=b.lo[i]))){
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
     const material=(b:RenderBox)=>{const transparent=b.opacity<.98,m=new THREE.MeshStandardMaterial({roughness:b.rough,metalness:b.metal,opacity:b.opacity,transparent,depthWrite:!transparent,map:texture(b.finish??"plain"),envMapIntensity:transparent?1.2:.55});m.color.setRGB(...b.color,THREE.SRGBColorSpace);return m;};
     const dummy=new THREE.Object3D();
     const transform=(b:RenderBox,obj:THREE.Object3D)=>{obj.position.set(...b.lo.map((v,i)=>(v+b.hi[i])/2) as [number,number,number]);obj.scale.set(...b.lo.map((v,i)=>b.hi[i]-v) as [number,number,number]);obj.updateMatrix();};
     for(const batch of batches.values()){
      const mesh=new THREE.InstancedMesh(geometry,material(batch[0]),batch.length);
      batch.forEach((b,i)=>{transform(b,dummy);mesh.setMatrixAt(i,dummy.matrix)});
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.castShadow=shadows;mesh.receiveShadow=shadows;group.add(mesh);meshes.push(mesh);
     }
     for(const b of glass){const mesh=new THREE.Mesh(geometry,material(b));transform(b,mesh);mesh.receiveShadow=shadows;group.add(mesh);meshes.push(mesh);}
     target.dataset.sceneBoxes=String(next.boxes.length);target.dataset.meshBatches=String(meshes.length);
     if(geometryChanged){
      const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      const extent=Math.max(2,size.length()*.65);sun.position.copy(center).add(new THREE.Vector3(extent,extent*1.5,extent));sun.target.position.copy(center);scene.add(sun.target);
      const shadow=sun.shadow.camera;shadow.left=-extent;shadow.right=extent;shadow.top=extent;shadow.bottom=-extent;shadow.far=extent*5;shadow.updateProjectionMatrix();reset();
     }
    }
    for(const lamp of lamps)scene.remove(lamp);lamps.length=0;
    for(const source of (next.lights??[]).slice(0,4)){if(!source.position.every(Number.isFinite)||!source.color.every(Number.isFinite)||!Number.isFinite(source.power)||source.power<0)continue;const lamp=new THREE.PointLight(new THREE.Color().setRGB(...source.color,THREE.SRGBColorSpace),Math.min(source.power,100),0,2);lamp.position.fromArray(source.position);scene.add(lamp);lamps.push(lamp);}
    scene.background=new THREE.Color(next.evening?0x8895a9:0xe1e8ec);ambient.intensity=next.evening?1.1:1.4;sun.intensity=next.evening?1.7:2.5;sun.color.set(next.evening?0xffc48b:0xfff3da);if(renderer)renderer.shadowMap.needsUpdate=true;schedule();
   }};
   document.addEventListener("visibilitychange",schedule);
  }catch{queueMicrotask(()=>{if(!disposed)setUnavailable(true)})}
  return()=>{disposed=true;viewer.current=null;cancelAnimationFrame(frame);document.removeEventListener("visibilitychange",schedule);observer?.disconnect();controls?.dispose();clear();geometry.dispose();for(const t of cache.values())t.dispose();environment?.dispose();renderer?.domElement.removeEventListener("webglcontextlost",contextLost);renderer?.dispose();renderer?.forceContextLoss();if(renderer?.domElement.parentElement===target)target.removeChild(renderer.domElement);};
 },[exterior]);
 useEffect(()=>{if(snapshot)viewer.current?.update(snapshot)},[snapshot]);
 return <section aria-label={exterior?"Interactive commercial building":"Interactive commercial room"} data-room-viewer><div ref={host} hidden={unavailable||!snapshot||!!sceneIssue} style={{width:"100%",height:"clamp(240px,48vw,440px)",borderRadius:10,overflow:"hidden",background:"#e1e8ec"}}/>{!snapshot||sceneIssue?<p role="status">{sceneIssue||"No valid scene is available for the selected input."}</p>:unavailable?<p role="status">Interactive 3D is unavailable on this device. Use the image preview below.</p>:<button type="button" className="button button-outline" onClick={()=>viewer.current?.reset()}>Reset view</button>}</section>;
}
