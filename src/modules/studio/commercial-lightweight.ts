import type {RenderSnapshot,Vec3} from "../../../public/studio-render-v1";
type Face={id:string;points:string;fill:string;opacity:number;depth:number};
type Point=[number,number,number];
/** Project the very same opening-aware boxes used by the interactive renderer.
 * Three visible faces per box; no WebGL, textures, additional assets, or idle work. */
export function projectCommercialScene(snapshot:RenderSnapshot,angle:number){
 if(!snapshot.boxes.length||snapshot.boxes.length>1800||!Number.isFinite(angle))return null;
 const t=angle*Math.PI/2,c=Math.cos(t),s=Math.sin(t),faces:Face[]=[];
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 const project=([x,y,z]:Vec3):Point=>{const u=x*c-z*s,v=x*s+z*c;return [(u-v)*.866,(u+v)*.5-y,u+v+y*.72];};
 const frontX=c+s>=0,frontZ=c-s>=0;
 for(const [index,b] of snapshot.boxes.entries()){
  if(b.lo.some((v,i)=>!Number.isFinite(v)||!Number.isFinite(b.hi[i])||v>=b.hi[i])||b.color.some(v=>!Number.isFinite(v)||v<0||v>1)||!Number.isFinite(b.opacity))return null;
  const [x0,y0,z0]=b.lo,[x1,y1,z1]=b.hi,x=frontX?x1:x0,z=frontZ?z1:z0;
  const sides:{corners:Vec3[];shade:number}[]=[
   {corners:[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],shade:1.08},
   {corners:[[x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0]],shade:.77},
   {corners:[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],shade:.93}];
  for(const [side,{corners,shade}] of sides.entries()){
   const points=corners.map(project);
   for(const [u,v] of points){left=Math.min(left,u);right=Math.max(right,u);top=Math.min(top,v);bottom=Math.max(bottom,v);}
   const fill="#"+b.color.map(v=>Math.round(Math.min(1,v*shade)*255).toString(16).padStart(2,"0")).join("");
   faces.push({id:index+"-"+side,points:points.map(([u,v])=>u.toFixed(3)+","+v.toFixed(3)).join(" "),fill,opacity:Math.min(1,Math.max(0,b.opacity)),depth:points.reduce((n,p)=>n+p[2],0)/4});
  }
 }
 const pad=Math.max(1,Math.max(right-left,bottom-top)*.05);
 return {faces:faces.sort((a,b)=>a.depth-b.depth),viewBox:[left-pad,top-pad,right-left+2*pad,bottom-top+2*pad].join(" ")};
}
