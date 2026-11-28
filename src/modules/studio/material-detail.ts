/** Surface detail is deterministic and local. Material profiles change lighting
 * and texture scale, never the authored composition or the photo mask. */
export type MaterialDetail={grain:number;wash:number;ridge:number;edge:number;axis:"horizontal"|"vertical"|"diagonal"};
export function materialDetail(x:number,y:number,profile:MaterialDetail){
 const noise=(((Math.imul(x+1,73856093)^Math.imul(y+1,19349663))>>>0)%257)/128-1;
 const broad=Math.sin(x*.071+y*.049)*Math.cos(y*.092-x*.027);
 const along=profile.axis==="vertical"?x:profile.axis==="horizontal"?y:x*.71+y*.71;
 const ridge=Math.sin(along*.82)*.68+Math.sin(along*.33)*.32;
 return 1+profile.grain*noise+profile.wash*broad+profile.ridge*ridge;
}
/** Directional edge shading reads only immutable alpha, never neighbouring
 * RGB values already modified in place. Transparent pixels remain untouched.
 * This is an optical paint study, not physical bump mapping. */
export function applyMaterialDetail(data:Uint8ClampedArray,width:number,height:number,profile:MaterialDetail,left=0,top=0){
 if(width<=0||height<=0||data.length!==width*height*4)return;
 const alpha=profile.edge?new Uint8Array(width*height):null;
 if(alpha)for(let j=0;j<alpha.length;j++)alpha[j]=data[j*4+3];
 for(let y=0,i=0;y<height;y++)for(let x=0;x<width;x++,i+=4){
  if(!data[i+3])continue;
  let factor=materialDetail(x+left,y+top,profile);
  if(alpha){const at=(u:number,v:number)=>alpha[Math.max(0,Math.min(height-1,v))*width+Math.max(0,Math.min(width-1,u))];factor+=profile.edge*(at(x+1,y+1)-at(x-1,y-1))/255;}
  factor=Math.max(.72,Math.min(1.28,factor));
  data[i]=Math.round(data[i]*factor);data[i+1]=Math.round(data[i+1]*factor);data[i+2]=Math.round(data[i+2]*factor);
 }
}
