import type {Vec3} from "../../../../public/studio-render-v1";
export const FEET_TO_METRES=.3048;
export const normalize=(v:Vec3):Vec3=>{const n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n];};
export const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
