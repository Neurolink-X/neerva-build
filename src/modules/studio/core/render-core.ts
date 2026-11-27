import * as THREE from "three";
import {materialTextureBytes,MATERIAL_TILE_SIZE,type TexturedFinish,type TextureProfile} from "./material-texture";
import {preferLiteDevice} from "@/modules/navigation/intent";
/** The render policy is shared; domain-specific scene geometry and lighting presets remain independent. */
export function studioDevice(){const nav=navigator as Navigator&{deviceMemory?:number};return {constrained:preferLiteDevice({cores:nav.hardwareConcurrency,memory:nav.deviceMemory}),cores:nav.hardwareConcurrency??4};}
export function configureStudioRenderer(renderer:THREE.WebGLRenderer,profile:{constrained:boolean;pixelRatio:number;shadows:boolean;exposure:number}){
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,profile.constrained?1:profile.pixelRatio));
 renderer.shadowMap.enabled=profile.shadows&&!profile.constrained;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=profile.exposure;
}
export function releaseStudioRenderer(renderer:THREE.WebGLRenderer|undefined,target:HTMLElement,contextLost:(event:Event)=>void){
 if(!renderer)return;
 renderer.domElement.removeEventListener("webglcontextlost",contextLost);
 renderer.dispose();renderer.forceContextLoss();
 if(renderer.domElement.parentElement===target)target.removeChild(renderer.domElement);
}
export function proceduralTexture(bytes:Uint8Array,size:number,colour=false){
 const t=new THREE.DataTexture(bytes,size,size);
 if(colour)t.colorSpace=THREE.SRGBColorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function studioMaterialTexture(kind:TexturedFinish,profile:TextureProfile){return proceduralTexture(materialTextureBytes(kind,profile),MATERIAL_TILE_SIZE,true);}
export function plasterTexture(seed:number){const n=64,data=new Uint8Array(n*n*4);for(let i=0;i<data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=110+(seed>>>24)%35;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}return proceduralTexture(data,n);}
export function projectedFit(corners:readonly THREE.Vector3[],direction:THREE.Vector3,up:THREE.Vector3,fov:number,aspect:number,padding:number,minimum=-Infinity){
 const right=new THREE.Vector3().crossVectors(up,direction).normalize(),screenUp=new THREE.Vector3().crossVectors(direction,right);
 const tanY=Math.tan(THREE.MathUtils.degToRad(fov/2));
 return Math.max(minimum,...corners.map(p=>p.dot(direction)+padding*Math.max(Math.abs(p.dot(right))/(tanY*aspect),Math.abs(p.dot(screenUp))/tanY)));
}
