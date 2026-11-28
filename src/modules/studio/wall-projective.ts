export type WallPoint={x:number;y:number};
/** Unit-square homography for the four clockwise wall corners.
 * Near-degenerate input falls back to the original bilinear mapping. */
export function wallProjector(a:WallPoint,b:WallPoint,c:WallPoint,d:WallPoint){
 const dx1=b.x-c.x,dx2=d.x-c.x,dy1=b.y-c.y,dy2=d.y-c.y;
 const dx3=a.x-b.x+c.x-d.x,dy3=a.y-b.y+c.y-d.y,det=dx1*dy2-dx2*dy1;
 const g=Math.abs(det)>1e-8?(dx3*dy2-dx2*dy3)/det:0,h=Math.abs(det)>1e-8?(dx1*dy3-dx3*dy1)/det:0;
 const safe=Math.abs(det)>1e-8&&[1,1+g,1+h,1+g+h].every(v=>Number.isFinite(v)&&v>.001);
 return (u:number,v:number):WallPoint=>{
  if(!safe)return {x:(1-v)*(a.x+(b.x-a.x)*u)+v*(d.x+(c.x-d.x)*u),y:(1-v)*(a.y+(b.y-a.y)*u)+v*(d.y+(c.y-d.y)*u)};
  const q=1+g*u+h*v;return {x:(a.x+(b.x*(1+g)-a.x)*u+(d.x*(1+h)-a.x)*v)/q,y:(a.y+(b.y*(1+g)-a.y)*u+(d.y*(1+h)-a.y)*v)/q};
 };
}
/** At most 50 triangles; rectangular walls use the original two. */
export function wallProjectionGrid(a:WallPoint,b:WallPoint,c:WallPoint,d:WallPoint){
 const project=wallProjector(a,b,c,d),mid=project(.5,.5),linear={x:(a.x+b.x+c.x+d.x)/4,y:(a.y+b.y+c.y+d.y)/4};
 const error=Math.hypot(mid.x-linear.x,mid.y-linear.y);
 return error<.5?1:Math.max(2,Math.min(5,Math.ceil(Math.sqrt(error))));
}
