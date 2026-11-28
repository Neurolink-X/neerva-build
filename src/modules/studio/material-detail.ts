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
 // Precompute separable trigonometric terms: O(width+height) trig calls,
 // rather than O(width*height). No per-pixel allocations or closures.
 const stepX=profile.axis==="horizontal"?0:profile.axis==="vertical"?1:.71;
 const stepY=profile.axis==="vertical"?0:profile.axis==="horizontal"?1:.71;
 const terms=(length:number,offset:number,first:number,second:number)=>Array.from({length},(_,i)=>{const a=(i+offset)*first,b=(i+offset)*second;return [Math.sin(a),Math.cos(a),Math.sin(b),Math.cos(b)]});
 const bx=terms(width,left,.071,-.027),by=terms(height,top,.049,.092);
 const rx=terms(width,left,.82*stepX,.33*stepX),ry=terms(height,top,.82*stepY,.33*stepY);
 for(let y=0,i=0;y<height;y++){
  const [ys,yc,yt,yu]=by[y],[rs,rc,rt,ru]=ry[y],prev=Math.max(0,y-1)*width,next=Math.min(height-1,y+1)*width;
  const yHash=Math.imul(y+top+1,19349663);
  for(let x=0;x<width;x++,i+=4){
   if(!data[i+3])continue;
   const [xs,xc,xt,xu]=bx[x],[ps,pc,pt,pu]=rx[x];
   const noise=(((Math.imul(x+left+1,73856093)^yHash)>>>0)%257)/128-1;
   const broad=(xs*yc+xc*ys)*(xu*yu-xt*yt);
   const ridge=.68*(ps*rc+pc*rs)+.32*(pt*ru+pu*rt);
   let factor=1+profile.grain*noise+profile.wash*broad+profile.ridge*ridge;
   if(alpha)factor+=profile.edge*(alpha[next+Math.min(width-1,x+1)]-alpha[prev+Math.max(0,x-1)])/255;
   factor=Math.max(.72,Math.min(1.28,factor));
   data[i]=Math.round(data[i]*factor);data[i+1]=Math.round(data[i+1]*factor);data[i+2]=Math.round(data[i+2]*factor);
  }
 }
}
