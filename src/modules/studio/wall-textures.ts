import type {Pattern} from "./wall-patterns.ts";
import {isGeneratedWallPattern} from "./generated-wall-raster.ts";
import type {FacadeStyles,FacadeTarget} from "./facade-paint.ts";
export type WallTexture={src:string;width:number;height:number;bytes:number;sha256:string;crop?:readonly [number,number,number,number]};
export const wallTextures:Partial<Record<Pattern,WallTexture>>={
 // Original AI-generated wall concept artwork, optimized as local grayscale WebP.
 botanical:{src:"/images/studio/walls/botanical-art-v1.webp",width:320,height:214,bytes:4766,sha256:"fa7ee2ea241cbcf192cebbf5c80948df1719166e14f1bf2dd0d4c0b0fcdff06f"},
 "sculptWave": {
  "src": "/images/studio/walls/sculptWave.webp",
  "width": 960,
  "height": 495,
  "bytes": 17350,
  "sha256": "142e4cc919b1d6039786f369bcd96c90960d031b9880fa933b2d4455c24b5814",
  "crop": [
   0.16,
   0,
   0.84,
   1
  ]
 },
 "sculptRibbon": {
  "src": "/images/studio/walls/sculptRibbon.webp",
  "width": 960,
  "height": 465,
  "bytes": 27324,
  "sha256": "32583f62e6cf52ea9fb6ebd75bcc1e879972a2a5344112f8c0766f252d7fd2d1"
 },
 "sculptFold": {
  "src": "/images/studio/walls/sculptFold.webp",
  "width": 960,
  "height": 447,
  "bytes": 36604,
  "sha256": "c33b47667817279adc77f3e85dbf1338b04c621f39eb927d244f0910178ee605"
 },
 "riverSunset": {
  "src": "/images/studio/walls/riverSunset.webp",
  "width": 960,
  "height": 526,
  "bytes": 60938,
  "sha256": "52270dc592c5bf44397edb2c0070c2277ade68e726c14fc093f9a7439580410f"
 },
 "lotusPond": {
  "src": "/images/studio/walls/lotusPond.webp",
  "width": 960,
  "height": 445,
  "bytes": 28680,
  "sha256": "b7c222057c9c1b31dc3e7a9d878d6c9b332c9ad8089a7373d6c2c7790ddfd896"
 },
 "blossomBranch": {
  "src": "/images/studio/walls/blossomBranch.webp",
  "width": 960,
  "height": 422,
  "bytes": 29150,
  "sha256": "ad0e006086ab2af79c4a6a57d35c3d542d2e8c5e877b3960c7350a86e41a06d6"
 },
 "archGallery": {
  "src": "/images/studio/walls/archGallery.webp",
  "width": 960,
  "height": 424,
  "bytes": 26948,
  "sha256": "e452c2fb3a271f1f4d7f378f4e575e5480a3b7b3d290507df6b88c5b726700b5"
 },
 "atelierPanel": {
  "src": "/images/studio/walls/atelierPanel.webp",
  "width": 960,
  "height": 387,
  "bytes": 16158,
  "sha256": "82e6244b8b935c042fbad0d11f47b6eab43416ed001361267f8120eb798ff1b1",
  "crop": [
   0.315,
   0,
   0.47,
   1
  ]
 }
};
export const imageBasedWallPatterns=Object.keys(wallTextures) as Pattern[];
export function textureFor(pattern:Pattern){return wallTextures[pattern];}
export function hasWallRaster(pattern:Pattern){return !!textureFor(pattern)||isGeneratedWallPattern(pattern);}
/** Crop without squeezing the selected artwork to the photographed plane. */
export function wallTextureCrop(width:number,height:number,aspect:number){
 const ratio=width/height;if(!(width>0&&height>0&&aspect>0&&Number.isFinite(aspect)))return [0,0,1,1] as const;
 const w=Math.min(1,aspect/ratio),h=Math.min(1,ratio/aspect);return [(1-w)/2,(1-h)/2,w,h] as const;
}
/** Recolour the original grayscale artwork with base and accent, retaining its
 * highlights, shadows and fine detail. No external image service. */
export function texturePalette(base:string,accent:string){
 const rgb=(s:string)=>/^#[0-9a-f]{6}$/i.test(s)?[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)):[160,160,160];
 const b=rgb(base),a=rgb(accent);
 return Array.from({length:256},(_,i)=>{const v=i/255,mix=Math.max(0,Math.min(1,(.85-v)*1.35));
  // Keep shadows deep and specular highlights bright even on a dark base.
  const dark=Math.max(0,1-v*2),light=Math.max(0,v*2-1);
  return b.map((c,k)=>{const pigment=c*(1-mix)+a[k]*mix;return Math.round(Math.max(0,Math.min(255,pigment*(1-.73*dark)+(255-pigment)*.88*light)));});});
}

/** Painted lines and flowers should use the chosen accent, not be bleached white.
 * Map the neutral raster to the two pigments, retaining subtle directional shading. */
export function paintTexturePalette(base:string,accent:string){
 const rgb=(s:string)=>/^#[0-9a-f]{6}$/i.test(s)?[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)):[160,160,160];
 const b=rgb(base),a=rgb(accent);
 return Array.from({length:256},(_,i)=>{const v=i/255,mix=Math.max(0,Math.min(1,(v-.32)/.48)),light=Math.max(0,v-.83)*.36,dark=Math.max(0,.32-v)*.3;return b.map((c,k)=>{const p=c*(1-mix)+a[k]*mix;return Math.round(Math.max(0,Math.min(255,p*(1-dark)+(255-p)*light)));});});
}

/** Only artwork that can actually appear in the current scene may block export.
 * Saved designs in another scene or the wall being replaced are not active. */
export function appliedWallTextureKeys({scene,target,facadeStyles,walls,editing,valid,effectivePattern}:{scene:"room"|"facade"|"custom";target:FacadeTarget;facadeStyles:FacadeStyles;walls:readonly {pattern:Pattern}[];editing:number|null;valid:boolean;effectivePattern:Pattern}):Pattern[]{
 const keys=scene==="facade"?Object.entries(facadeStyles).filter(([id])=>id!==target).map(([,style])=>style.pattern):walls.filter((_,i)=>i!==editing).map(w=>w.pattern);
 if(scene==="facade"?target!=="all":valid)keys.push(effectivePattern);
 return [...new Set(keys)].filter(hasWallRaster);
}
