/** Road-local feet. Simple polygon, no holes; concept fitting, not cadastral survey. */
export type PlotPoint={x:number;y:number};
export type PlotEnvelope={x:number;y:number;w:number;d:number};
const EPS=1e-7;
const cross=(a:PlotPoint,b:PlotPoint,c:PlotPoint)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const on=(a:PlotPoint,b:PlotPoint,p:PlotPoint)=>Math.abs(cross(a,b,p))<=EPS&&p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
function intersects(a:PlotPoint,b:PlotPoint,c:PlotPoint,d:PlotPoint){
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
 return ((x>EPS&&y< -EPS||x< -EPS&&y>EPS)&&(z>EPS&&w< -EPS||z< -EPS&&w>EPS))||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
export function polygonArea(p:readonly PlotPoint[]){return Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a.x*b.y-b.x*a.y},0))/2;}
export function validatePlot(p:readonly PlotPoint[]):string|null{
 if(p.length<3||p.length>32||p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x<0||v.x>500||v.y<0||v.y>600))return "Enter 3–32 vertices in road-local feet (0–500 x, 0–600 y).";
 if(p.some((a,i)=>p.some((b,j)=>j<i&&Math.hypot(a.x-b.x,a.y-b.y)<EPS)))return "Duplicate vertices are not allowed.";
 for(let i=0;i<p.length;i++){
  const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];
  if(Math.abs(cross(a,b,c))<EPS&&(a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y)>EPS)return "Boundary edges backtrack.";
  for(let j=i+1;j<p.length;j++){
   if(j===i+1||i===0&&j===p.length-1)continue;
   if(intersects(b,c,p[j],p[(j+1)%p.length]))return "Boundary intersects itself.";
  }
 }
 if(polygonArea(p)<EPS)return "Plot area must be positive.";
 if(!p.some((a,i)=>a.y===0&&p[(i+1)%p.length].y===0&&a.x!==p[(i+1)%p.length].x))return "Include a road-facing boundary edge at y=0.";
 return null;
}
export function pointInPlot(p:readonly PlotPoint[],q:PlotPoint){
 let inside=false;
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(on(a,b,q))return true;if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}
 return inside;
}
/** Partition each polygon edge at rectangle boundary crossings. Reject any
 * segment lying in the open rectangle: catches concave notches even when all
 * four corners are inside. Boundary coincidence is allowed. */
export function envelopeFits(p:readonly PlotPoint[],r:PlotEnvelope){
 if(![r.x,r.y,r.w,r.d].every(Number.isFinite)||r.w<=0||r.d<=0)return false;
 const right=r.x+r.w,bottom=r.y+r.d;
 if(![{x:r.x,y:r.y},{x:right,y:r.y},{x:right,y:bottom},{x:r.x,y:bottom},{x:r.x+r.w/2,y:r.y+r.d/2}].every(q=>pointInPlot(p,q)))return false;
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length],dx=b.x-a.x,dy=b.y-a.y;
  const ts=[0,1,...(Math.abs(dx)>EPS?[(r.x-a.x)/dx,(right-a.x)/dx]:[]),...(Math.abs(dy)>EPS?[(r.y-a.y)/dy,(bottom-a.y)/dy]:[])].filter(t=>t>=0&&t<=1).sort((a,b)=>a-b);
  for(let j=0;j<ts.length-1;j++){const t=(ts[j]+ts[j+1])/2,x=a.x+t*dx,y=a.y+t*dy;if(x>r.x+EPS&&x<right-EPS&&y>r.y+EPS&&y<bottom-EPS)return false;}
 }
 return true;
}
/** Bounded sampled search, not a mathematically maximum rectangle. Every
 * accepted envelope is contained and starts on the measured road edge. */
export function roadEnvelope(p:readonly PlotPoint[]):PlotEnvelope|null{
 if(validatePlot(p))return null;
 const maxX=Math.max(...p.map(a=>a.x)),maxY=Math.max(...p.map(a=>a.y));
 const xs=[...new Set([...p.map(a=>a.x),...Array.from({length:21},(_,i)=>maxX*i/20)])].sort((a,b)=>a-b);
 const ys=[...new Set([...p.map(a=>a.y),...Array.from({length:21},(_,i)=>maxY*i/20)])].filter(y=>y>=30).sort((a,b)=>b-a);
 let best:PlotEnvelope|null=null;
 for(let i=0;i<xs.length;i++)for(let j=i+1;j<xs.length;j++){
  const x=xs[i],w=xs[j]-x;if(w<20)continue;
  // Containment is monotonic for nested depths; binary search the candidates.
  let lo=0,hi=ys.length-1,depth=0;
  while(lo<=hi){const m=(lo+hi)>>1,d=ys[m];if(envelopeFits(p,{x,y:0,w,d})){depth=d;hi=m-1;}else lo=m+1;}
  if(depth&&(!best||w*depth>best.w*best.d+EPS))best={x,y:0,w,d:depth};
 }
 return best;
}
export function parsePlot(text:string):PlotPoint[]|null{
 if(text.length>2048)return null;
 const rows=text.trim().split(/\n/);
 const points:PlotPoint[]=[];
 for(const row of rows){const m=/^\s*(\d+(?:\.\d{1,3})?)\s*,\s*(\d+(?:\.\d{1,3})?)\s*$/.exec(row);if(!m)return null;points.push({x:Number(m[1]),y:Number(m[2])});}
 return points;
}
