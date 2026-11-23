/**
 * Design media data contract. Do not advertise images as photorealistic until
 * an original/licensed image, matching masks and approval have been recorded.
 */
import {studioDesigns} from "./library.ts";
export type MediaPerspective="front"|"side"|"aerial"|"evening"|"living"|"bedroom"|"kitchen"|"bathroom";
export type MediaStatus="draft"|"in_review"|"approved";
export type ImageUsage="original"|"licensed"|"sample";
export type MaskPoint={x:number;y:number};
export type SurfaceMask={
  surface:"main"|"accent"|"cladding"|"railing"|"gate"|"frame"|"boundary"|"roof"|"interior-wall"|"ceiling"|"floor"|"cabinet";
  polygon:MaskPoint[];featherPx:number;
};
export type MediaManifest={
  version:1;designSlug:string;perspective:MediaPerspective;
  imagePath:string;imageSha256:string;widthPx:number;heightPx:number;
  altText:string;license:ImageUsage;licenseEvidence:string|null;
  status:MediaStatus;approvedBy:string|null;approvedAt:string|null;
  masks:SurfaceMask[];
};
const sha256=/^[a-f0-9]{64}$/;
const localImage=/^\/images\/studio\/[a-z0-9/_-]+\.(webp|avif)$/;
const validPoint=(p:MaskPoint)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
const area=(points:MaskPoint[])=>Math.abs(points.reduce((sum,p,i)=>{const next=points[(i+1)%points.length];return sum+p.x*next.y-next.x*p.y},0))/2;
export function validateMediaManifest(asset:MediaManifest):string[]{
 const errors:string[]=[];
 if(asset.version!==1)errors.push("Unsupported asset revision.");
 if(!studioDesigns.some(d=>d.slug===asset.designSlug))errors.push("Unknown design slug.");
 if(!localImage.test(asset.imagePath))errors.push("Only versioned local WebP/AVIF studio images may be published.");
 if(!sha256.test(asset.imageSha256))errors.push("Image checksum must be SHA-256.");
 if(!Number.isInteger(asset.widthPx)||!Number.isInteger(asset.heightPx)||asset.widthPx<600||asset.heightPx<600)errors.push("Invalid source dimensions.");
 if(asset.altText.trim().length<12)errors.push("Descriptive alternative text is required.");
 if(asset.license==="sample"&&asset.status==="approved")errors.push("Sample illustrations cannot be approved as final design renders.");
 if(asset.status==="approved"&&(asset.license!=="original"&&asset.license!=="licensed"||!asset.licenseEvidence||!asset.approvedBy||!asset.approvedAt||Math.max(asset.widthPx,asset.heightPx)<2400))errors.push("Publishing requires approved rights, reviewer, timestamp and 2400px source.");
 if(asset.masks.some(mask=>mask.polygon.length<3||mask.polygon.length>40||mask.polygon.some(p=>!validPoint(p))||area(mask.polygon)<0.0001||!Number.isFinite(mask.featherPx)||mask.featherPx<0||mask.featherPx>20))errors.push("A surface mask has invalid bounds, vertices or feathering.");
 return errors;
}
export function canPublishRealism(asset:MediaManifest):boolean{return asset.status==="approved"&&asset.license!=="sample"&&validateMediaManifest(asset).length===0;}
export const REALISM_STATUS="Original or licensed architectural renders and surface masks are pending review.";
