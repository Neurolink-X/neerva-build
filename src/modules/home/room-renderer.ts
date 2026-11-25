
import * as THREE from "three";
import {furniture,type RoomLab,type Piece} from "./room-lab";
export type RoomScene={update:(room:RoomLab,light:"day"|"evening",angle:number,zoom:number)=>void;dispose:()=>void};
const wood="#987557", ivory="#f5eee1";
function clearGroup(group:THREE.Group){
 const materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>(),textures=new Set<THREE.Texture>();
 group.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){materials.add(m);if(m instanceof THREE.MeshStandardMaterial&&m.map)textures.add(m.map)}}});
 group.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
function box(parent:THREE.Group,w:number,h:number,d:number,x:number,y:number,z:number,color:string,roughness=.82){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness}));
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function furnitureModel(p:Piece){
 const f=furniture.find(f=>f.kind===p.kind)!;const {w,d}=f,g=new THREE.Group(),c=f.colour;
 const legs=(height:number)=>{for(const x of [-w/2+.18,w/2-.18])for(const z of [-d/2+.18,d/2-.18])box(g,.14,height,.14,x,height/2,z,wood)};
 if(p.kind==="sofa"){
  legs(.28);box(g,w-.12,.65,d-.15,0,.6,0,c);box(g,w-.12,1.62,.42,0,1.68,-d/2+.25,c);
  for(const x of [-w/2+.29,w/2-.29])box(g,.52,1.1,d-.08,x,1.03,0,c);
  for(let i=0;i<3;i++){const x=(i-1)*(w-1.2)/3;box(g,(w-1.3)/3,.26,d-.65,x,1.04,.15,c);box(g,(w-1.3)/3,.86,.28,x,1.7,-d/2+.53,ivory)}
 }else if(p.kind==="bed"){
  legs(.22);box(g,w,.38,d,0,.42,0,wood);box(g,w-.12,.65,d-.12,0,.94,0,ivory);
  box(g,w,2.2,.25,0,1.25,-d/2+.14,wood);box(g,w-.1,.08,d*.58,0,1.3,d*.17,c);
  for(const x of [-w*.23,w*.23])box(g,w*.4,.18,.9,x,1.37,-d/2+1.05,"#ffffff");
 }else if(p.kind==="wardrobe"){
  box(g,w,6.3,d,0,3.15,0,c);for(const x of [-w/4,w/4]){box(g,w/2-.08,6.1,.1,x,3.15,d/2-.03,wood);box(g,.07,.62,.12,x+(x<0?.65:-.65),3.1,d/2+.04,"#c9b38f")}
 }else if(p.kind==="chair"){
  legs(1.45);box(g,w-.1,.24,d-.12,0,1.55,0,c);box(g,w-.16,1.4,.18,0,2.2,-d/2+.12,c);
 }else{
  legs(2.35);box(g,w,.17,d,0,2.52,0,wood);
  if(p.kind==="desk"){box(g,1.05,.5,d-.1,w/2-.57,2.17,0,c);box(g,1.1,.06,.7,-.3,2.65,-.1,"#303a40");box(g,1.1,.72,.07,-.3,3,-.42,"#38454b")}
 }
 g.rotation.y=p.rotated?-Math.PI/2:0;g.position.set(p.x+(p.rotated?d:w)/2,0,p.y+(p.rotated?w:d)/2);return g;
}
export function buildRoomScene(host:HTMLDivElement):RoomScene{
 const canvas=document.createElement("canvas");const context=canvas.getContext("webgl2",{antialias:true,alpha:false,powerPreference:"low-power"});if(!context)throw new Error("WebGL2 unavailable");
 const renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:false,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,200),objects=new THREE.Group();
 scene.add(objects);const ambient=new THREE.HemisphereLight("#eaf1ff","#9e8263",2.3);scene.add(ambient);
 const sun=new THREE.DirectionalLight("#fff0d6",3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;scene.add(sun,sun.target);
 const lamp=new THREE.PointLight("#ffbf75",35,45,2);scene.add(lamp);
 let room:RoomLab|null=null,angle=42,zoom=1,disposed=false;
 function render(){if(disposed||!room)return;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;const span=Math.max(room.width,room.depth),r=span*1.9/zoom,theta=angle*Math.PI/180;
 camera.position.set(room.width/2+Math.sin(theta)*r,span*.98/zoom+3,room.depth/2+Math.cos(theta)*r);camera.lookAt(room.width/2,2.3,room.depth/2);camera.updateProjectionMatrix();renderer.render(scene,camera)}
 const observer=new ResizeObserver(render);observer.observe(host);
 function update(next:RoomLab,light:"day"|"evening",nextAngle:number,nextZoom:number){
  if(disposed)return;angle=nextAngle;zoom=nextZoom;
  if(room!==next){room=next;clearGroup(objects);const w=next.width,d=next.depth;
   box(objects,w,.2,d,w/2,-.1,d/2,next.floor);for(let z=1;z<d;z+=1)box(objects,w,.006,.018,w/2,.005,z,"#a99b88");
   // Cutaway reference walls and decorative fixed window. Not a measured opening or lighting design.
   box(objects,w,8,.18,w/2,4,-.09,next.wall);box(objects,.18,8,d,-.09,4,d/2,next.wall);
   box(objects,w,.15,.13,w/2,.15,.12,ivory);box(objects,.13,.15,d,.12,.15,d/2,ivory);
   const ww=w*.43,wx=w*.58;box(objects,ww,3.45,.12,wx,4.7,.12,"#e4edf0");for(const x of [wx-ww/2,wx,wx+ww/2])box(objects,.08,3.55,.16,x,4.7,.19,ivory);for(const y of [3,4.7,6.4])box(objects,ww,.08,.16,wx,y,.19,ivory);
   for(const p of next.pieces)objects.add(furnitureModel(p));
   sun.position.set(w+5,20,d+8);sun.target.position.set(w/2,0,d/2);const ext=Math.max(w,d)*1.2;Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:.1,far:100});sun.shadow.camera.updateProjectionMatrix();lamp.position.set(w*.55,7,d*.4);
  }
  const day=light==="day";scene.background=new THREE.Color(day?"#e8eae5":"#3d4149");ambient.intensity=day?2.3:.8;sun.intensity=day?3:.3;lamp.intensity=day?0:65;renderer.toneMappingExposure=day?1.12:.9;render();
 }
 return {update,dispose(){disposed=true;observer.disconnect();clearGroup(objects);sun.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
}
